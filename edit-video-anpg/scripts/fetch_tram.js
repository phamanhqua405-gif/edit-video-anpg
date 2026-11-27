// Tự tải video trám cho các dòng "tram" trong plan bằng yt-dlp (tìm trên YouTube), cắt đúng độ dài đoạn,
// cắt khung 1080×1920 (lấp đầy, lấy giữa), 30fps, bỏ tiếng. Video nào không tải được → builder tự dùng nền đen ghi chữ như cũ.
// Cách chạy (chạy TRƯỚC capcut_builder.js; mất vài phút → nên chạy nền):
//   node fetch_tram.js <plan.js>                 tải mọi video trám chưa có (file đã có, đủ dài thì bỏ qua)
//   node fetch_tram.js <plan.js> --only 3,7,12   chỉ tải lại các số này (bỏ cache, chọn video khác lần trước)
//   node fetch_tram.js <plan.js> --jobs 4        số video tải song song (mặc định 3)
// Kết quả: <work>/Video trám (tải về)/tram_nn_*.mp4
//          <work>/_tools/tram_<project>.json          (builder đọc file này)
//          <work>/_tools/tram_preview_<project>.jpg   (lưới khung hình #nn để soát nội dung có khớp không)
// Không dùng cookie / đăng nhập / proxy / giả trình duyệt để lách chặn: video bị chặn thì bỏ qua, thử video khác.
const fs = require("fs");
const os = require("os");
const path = require("path");
const cp = require("child_process");
const C = require("./tram_common");

const { LOCAL } = require("./paths");
const PROJ_ROOT = `${LOCAL}/CapCut/User Data/Projects/com.lveditor.draft`;
const FONT = `${LOCAL}/Microsoft/Windows/Fonts/SVN-Gilroy Heavy.otf`;

const args = process.argv.slice(2);
const planFile = path.resolve(args.find((a) => !a.startsWith("--") && !/^[\d,]+$/.test(a)) || "");
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const ONLY = opt("--only") ? new Set(opt("--only").split(",").map(Number)) : null;
const JOBS = Math.max(1, +(opt("--jobs") || 3));
if (!fs.existsSync(planFile)) { console.error("Không thấy file kế hoạch:", planFile); process.exit(1); }
const plan = require(planFile);
const P = plan.project;
const planDir = path.dirname(planFile);
const WORK = (plan.work || (path.basename(planDir) === "_tools" ? path.dirname(planDir) : planDir)).replace(/\\/g, "/");

// Độ dài video: đọc từ bản sao lưu (nếu có) hoặc project CapCut (chỉ đọc)
const draftFile = [`${WORK}/_backup/${P} - truoc khi Claude edit/draft_content.json`, `${PROJ_ROOT}/${P}/draft_content.json`].find((f) => fs.existsSync(f));
if (!draftFile) { console.error("Không thấy project CapCut:", P); process.exit(1); }
const TOTAL = JSON.parse(fs.readFileSync(draftFile, "utf8")).duration / 1e6;

// ---------- công cụ ----------
const ENV = { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" };
function findYtdlp() {
  const c = ["yt-dlp", `${LOCAL}/Microsoft/WinGet/Links/yt-dlp.exe`];
  try { for (const d of fs.readdirSync(`${LOCAL}/Microsoft/WinGet/Packages`)) if (/^yt-dlp\.yt-dlp/i.test(d)) c.push(`${LOCAL}/Microsoft/WinGet/Packages/${d}/yt-dlp.exe`); } catch { /* không có winget */ }
  for (const b of c) { const r = cp.spawnSync(b, ["--version"], { encoding: "utf8", env: ENV }); if (r.status === 0) return { bin: b, ver: r.stdout.trim() }; }
  return null;
}
const YT = findYtdlp();
if (!YT) { console.error("Chưa có yt-dlp. Cài: winget install --id yt-dlp.yt-dlp -e  (rồi chạy lại). Builder vẫn chạy được, video trám sẽ là nền đen."); process.exit(1); }

function runAsync(bin, a, timeoutMs = 240000) {
  return new Promise((res) => {
    const p = cp.spawn(bin, a, { env: ENV, windowsHide: true });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (err += d));
    const tm = setTimeout(() => { p.kill(); err += "\nERROR: quá thời gian"; }, timeoutMs);
    p.on("close", (code) => { clearTimeout(tm); res({ code, out, err }); });
    p.on("error", (e) => { clearTimeout(tm); res({ code: -1, out, err: String(e) }); });
  });
}
const errLine = (s) => ((s.match(/ERROR:.*$/gm) || []).pop() || s.trim().split("\n").pop() || "lỗi không rõ").replace(/^ERROR:\s*/, "").slice(0, 160);
function probe(file) {
  const r = cp.spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", file], { encoding: "utf8" });
  try { const j = JSON.parse(r.stdout); return { w: j.streams[0].width, h: j.streams[0].height, dur: parseFloat(j.format.duration) }; } catch { return null; }
}
const esc = (p) => p.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");

// ---------- danh sách cần tải ----------
const entries = C.tramEntries(plan, TOTAL);
const OUT_DIR = C.downloadDir(WORK);
fs.mkdirSync(OUT_DIR, { recursive: true });
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "anpg-tram-")).replace(/\\/g, "/"); // đường dẫn ASCII cho yt-dlp
const old = C.loadManifest(planDir, P) || {};
const oldEntries = old.entries || {};
const man = {};
const used = new Set();  // id YouTube đã dùng cho dòng khác → không lặp cảnh
const bad = new Set();   // id tải lỗi trong lần chạy này
const pad = (n) => String(n).padStart(2, "0");

const todo = [];
for (const e of entries) {
  const need = +(e.t1 - e.t0 + 1).toFixed(2); // thêm 1s dư cho làm tròn khung hình
  const base = { n: e.n, label: e.label, query: e.query, need };
  if (!e.dl) { man[e.key] = { ...base, ok: false, reason: "dl: false (để nền đen)" }; continue; }
  const prev = oldEntries[e.key];
  const redo = ONLY && ONLY.has(e.n);
  if (prev && prev.ok && !redo && fs.existsSync(prev.file)) {
    const pr = probe(prev.file);
    if (pr && pr.dur >= need - 0.05) {
      let file = prev.file; const want = `${OUT_DIR}/tram_${pad(e.n)}_${C.slug(e.label)}_${e.key}.mp4`;
      if (file !== want && !fs.existsSync(want)) { try { fs.renameSync(file, want); file = want; } catch { /* giữ tên cũ */ } }
      man[e.key] = { ...prev, ...base, file, cached: true }; if (prev.id) used.add(prev.id); continue;
    }
  }
  if (ONLY && !redo) { // ngoài --only: giữ nguyên kết quả cũ, không tải
    man[e.key] = prev ? { ...prev, ...base } : { ...base, ok: false, reason: "chưa tải (ngoài --only)" };
    if (prev && prev.id) used.add(prev.id); continue;
  }
  if (redo && prev && prev.id) bad.add(prev.id); // tải lại → chọn video khác lần trước
  todo.push({ e, base });
}

// ---------- tìm + tải ----------
async function search(q) {
  const r = await runAsync(YT.bin, ["--flat-playlist", "--no-warnings", "--js-runtimes", "node", "--print", "%(id)s\t%(duration)s\t%(live_status)s\t%(channel)s\t%(title)s", `ytsearch20:${q}`], 90000);
  if (r.code !== 0 && !r.out.trim()) return { list: [], err: errLine(r.err) };
  const list = r.out.split(/\r?\n/).filter(Boolean).map((l) => { const [id, d, live, channel, ...t] = l.split("\t"); return { id, dur: parseFloat(d), live, channel, title: t.join("\t"), url: `https://www.youtube.com/watch?v=${id}` }; });
  return { list };
}
// Xếp hạng kết quả: ưu tiên clip stock miễn phí, ngắn; bỏ bản xem trước có watermark của web bán stock;
// video dài thường là người nói chuyện / tổng hợp → hạ điểm. Cùng điểm thì giữ thứ tự liên quan của YouTube.
const FREE = /no[ -]?copyright|copyright[ -]?free|royalty[ -]?free|free[ -](hd |4k )?(stock|footage|video|b-?roll)|stock footage|b-?roll|pexels|pixabay|mixkit|videvo/i;
const WATERMARK = /videohive|envato|shutterstock|motion ?array|pond5|storyblocks|istock|adobe ?stock|getty|depositphotos|alamy|artgrid|filmsupply|dreamstime|123rf/i;
// Thường không có hình hợp (ảnh tĩnh, người nói chuyện, chữ đầy màn hình)
const NOTVIS = /sound ?effects?|\bsfx\b|ringtone|lyrics?|podcast|explained|review|tutorial|how to|reaction|interview|\bvlog\b|full (movie|episode)|top \d+/i;
function score(c) {
  const t = `${c.title} ${c.channel}`;
  if (WATERMARK.test(t)) return -100;
  return (FREE.test(t) ? 3 : 0) - (NOTVIS.test(t) ? 4 : 0) + (c.dur <= 90 ? 1 : 0) - (c.dur > 180 ? 1 : 0) - (c.dur > 600 ? 2 : 0);
}
function pickStart(dur, need, given) {
  if (given != null) return Math.max(0, given);
  if (!(dur > 0)) return 0;
  const s = dur <= 20 ? 1 : Math.min(dur * 0.2, 30); // bỏ đoạn mở đầu (logo, intro)
  return +Math.max(0, Math.min(s, dur - need - 0.5)).toFixed(2);
}
async function download(c, start, need, key) {
  const raw = `${TMP}/${key}_${c.id || "url"}`;
  const r = await runAsync(YT.bin, ["--js-runtimes", "node", "--no-playlist", "--no-warnings", "--no-progress",
    "-f", "bv*[height<=1920][width<=1920]/b[height<=1920][width<=1920]/bv*/b", "-S", "vcodec:h264",
    "--download-sections", `*${start}-${(start + need + 0.5).toFixed(2)}`, "--force-keyframes-at-cuts",
    "-o", `${raw}.%(ext)s`, "--print", "after_move:filepath", "--print", "after_move:%(id)s\t%(title)s\t%(channel)s\t%(webpage_url)s", c.url]);
  const lines = r.out.split(/\r?\n/).filter(Boolean);
  const f = lines.find((l) => fs.existsSync(l.trim()));
  if (!f) return { err: errLine(r.err) };
  const [id, title, channel, url] = (lines.find((l) => l.includes("\t")) || "").split("\t");
  return { raw: f.trim(), id: id || c.id, title: title || c.title, channel: channel || c.channel, url: url || c.url };
}
function encode(raw, out, need) {
  const pr = probe(raw); if (!pr || !(pr.dur > 0.3)) return "file tải về hỏng";
  const loop = pr.dur < need ? ["-stream_loop", "-1"] : []; // nguồn ngắn hơn đoạn → lặp lại
  const r = cp.spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...loop, "-i", raw, "-t", String(need), "-an",
    "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,format=yuv420p",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-movflags", "+faststart", out], { encoding: "utf8" });
  if (r.status !== 0) return "ffmpeg lỗi: " + (r.stderr || "").trim().slice(0, 160);
  const po = probe(out); if (!po || po.dur < need - 0.1) return "video sau khi cắt quá ngắn";
  return null;
}
async function fetchOne({ e, base }) {
  const out = `${OUT_DIR}/tram_${pad(e.n)}_${C.slug(e.label)}_${e.key}.mp4`;
  let cands, reason = "không có kết quả phù hợp";
  if (e.url) cands = [{ url: e.url, id: null, dur: NaN }];
  else {
    const s = await search(e.query);
    if (s.err) reason = "tìm kiếm lỗi: " + s.err;
    cands = s.list.filter((c) => c.id && !["is_live", "is_upcoming", "post_live"].includes(c.live) && c.dur >= base.need + 1.5 && c.dur <= 3600)
      .map((c, k) => ({ ...c, k, sc: score(c) })).filter((c) => c.sc > -50).sort((a, b) => b.sc - a.sc || a.k - b.k);
  }
  let tries = 0;
  for (const c of cands) {
    if (tries >= 3) break;
    if (c.id && (used.has(c.id) || bad.has(c.id))) continue;
    if (c.id) used.add(c.id); // giữ chỗ ngay (đồng bộ) để các luồng khác không chọn trùng
    tries++;
    const start = pickStart(c.dur, base.need, e.start);
    const d = await download(c, start, base.need, e.key);
    if (d.err) { reason = d.err; if (c.id) { used.delete(c.id); bad.add(c.id); } continue; }
    const er = encode(d.raw, out, base.need);
    try { fs.rmSync(d.raw, { force: true }); } catch { /* bỏ qua */ }
    if (er) { reason = er; if (c.id) { used.delete(c.id); bad.add(c.id); } continue; }
    if (d.id) used.add(d.id);
    man[e.key] = { ...base, ok: true, file: out, id: d.id, title: d.title, channel: d.channel, url: d.url, start };
    console.log(`  ✅ #${pad(e.n)} ${e.label.replace(/\n/g, " ")}  ←  ${d.title} (${d.url}, từ ${start}s)`);
    return;
  }
  man[e.key] = { ...base, ok: false, reason };
  console.log(`  ⬛ #${pad(e.n)} ${e.label.replace(/\n/g, " ")}  →  nền đen (${reason})`);
}
async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) await fn(items[i++]); }));
}

// ---------- lưới xem trước ----------
function preview() {
  const tiles = [];
  for (const e of entries) {
    const m = man[e.key]; const f = `${TMP}/p_${String(tiles.length + 1).padStart(3, "0")}.png`;
    const lab = `${TMP}/lab_${e.n}.txt`; fs.writeFileSync(lab, `#${pad(e.n)} ${e.label.split("\n")[0]}`);
    const text = `drawtext=fontfile='${esc(FONT)}':textfile='${esc(lab)}':fontsize=17:fontcolor=0xF6C90F:box=1:boxcolor=black@0.75:boxborderw=5:x=6:y=8`;
    const a = m && m.ok
      ? ["-ss", String(Math.min(1, m.need / 3)), "-i", m.file, "-frames:v", "1", "-vf", `scale=216:384,${text}`]
      : ["-f", "lavfi", "-i", "color=c=black:s=216x384", "-frames:v", "1", "-vf", `${text},drawtext=fontfile='${esc(FONT)}':text='NEN DEN':fontsize=26:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2`];
    const r = cp.spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...a, f], { encoding: "utf8" });
    if (r.status === 0) tiles.push(f);
  }
  if (!tiles.length) return null;
  const cols = Math.min(6, tiles.length), rows = Math.ceil(tiles.length / cols);
  const pf = C.previewFile(planDir, P);
  const r = cp.spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", "1", "-i", `${TMP}/p_%03d.png`,
    "-vf", `tile=${cols}x${rows}:padding=4:color=gray`, "-frames:v", "1", "-q:v", "3", pf], { encoding: "utf8" });
  return r.status === 0 ? pf : null;
}

(async () => {
  console.log(`yt-dlp ${YT.ver} · ${entries.length} đoạn video trám · cần tải ${todo.length} (song song ${JOBS})`);
  await pool(todo, JOBS, fetchOne);
  fs.writeFileSync(C.manifestFile(planDir, P), JSON.stringify({ project: P, updated: new Date().toISOString(), ytdlp: YT.ver, entries: man }, null, 1));
  const pf = preview();
  fs.rmSync(TMP, { recursive: true, force: true });
  const vals = Object.values(man), ok = vals.filter((m) => m.ok);
  console.log(`Xong: tải được ${ok.length}/${entries.length} (dùng lại ${ok.filter((m) => m.cached).length}) · nền đen ${vals.length - ok.length}`);
  console.log("Danh sách:", C.manifestFile(planDir, P));
  if (pf) console.log("Xem trước (đọc ảnh này để soát cảnh có khớp nội dung không):", pf);
})();
