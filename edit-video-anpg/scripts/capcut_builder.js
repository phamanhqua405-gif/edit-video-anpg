// Ghi bản dựng vào project CapCut PC theo một file kế hoạch (plan_<project>.js).
// Cách chạy:
//   node capcut_builder.js <đường dẫn plan.js> --dry          (chạy thử: tạo ảnh giữ chỗ + kiểm tra, KHÔNG ghi project)
//   node capcut_builder.js <đường dẫn plan.js>                (ghi thật; CapCut phải đang tắt)
//   node capcut_builder.js <plan.js> --dry --out <file.json>  (xuất draft dựng thử ra file để so sánh)
// Luôn dựng từ bản sao lưu gốc <work>/_backup/<project> - truoc khi Claude edit (tự tạo ở lần chạy đầu),
// nên chạy lại bao nhiêu lần cũng ra cùng kết quả và không chồng chéo.
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const cp = require("child_process");

const { LOCAL, PROJ_ROOT: PR, DEFAULT_NEN: DN, loadAsset } = require("./paths");
const PROJ_ROOT = PR;
const DEFAULT_FONT = `${LOCAL}/Microsoft/Windows/Fonts/SVN-Gilroy Heavy.otf`;
const DEFAULT_NEN = DN;
const TPL_FILE = path.resolve(__dirname, "../assets/templates.json");
const TRAMC = require("./tram_common");

const args = process.argv.slice(2);
const planFile = path.resolve(args.find((a) => !a.startsWith("--")) || "");
const DRY = args.includes("--dry");
const OUT = args.includes("--out") ? args[args.indexOf("--out") + 1] : null;
if (!fs.existsSync(planFile)) { console.error("Không thấy file kế hoạch:", planFile); process.exit(1); }
const plan = require(planFile);

const P = plan.project;
// Thư mục làm việc: plan.work, hoặc thư mục chứa plan (nếu plan nằm trong <work>/_tools thì lấy <work>)
const planDir = path.dirname(planFile);
const WORK = (plan.work || (path.basename(planDir) === "_tools" ? path.dirname(planDir) : planDir)).replace(/\\/g, "/");
const FONT = plan.font || DEFAULT_FONT;
const NEN = plan.nen || DEFAULT_NEN;
for (const [k, f] of [["font", FONT], ["nen", NEN], ["templates", TPL_FILE]]) if (!fs.existsSync(f)) { console.error(`Thiếu file ${k}: ${f}`); process.exit(1); }

const TPL = loadAsset(TPL_FILE);
// Hoạt ảnh Yêu thích + mọi hoạt ảnh đã tải về máy (tạo bằng capcut_favorites.js)
const FAV_FILE = path.resolve(__dirname, "../assets/favorites.json");
const FAV = fs.existsSync(FAV_FILE) ? loadAsset(FAV_FILE) : { favorites: {}, anim: {} };
const isFav = (group, name) => ((FAV.favorites || {})[group] || []).some((f) => f.name === name && f.ok);
const US = (s) => Math.round(s * 1e6);
const uuid = () => crypto.randomUUID().toUpperCase();
const clone = (o) => JSON.parse(JSON.stringify(o));
const hex = (c) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
const slug = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
const run = (bin, a) => cp.spawnSync(bin, a, { encoding: "utf8" });
const ffmpeg = (a) => { const r = run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...a]); if (r.status !== 0) throw new Error("ffmpeg lỗi: " + (r.stderr || r.error)); };
function index(d) { const m = {}; for (const [k, a] of Object.entries(d.materials)) if (Array.isArray(a)) for (const x of a) if (x && x.id) m[x.id] = { k, x }; return m; }
function capcutRunning() { const r = run("tasklist", ["/FI", "IMAGENAME eq CapCut.exe"]); return /capcut\.exe/i.test(r.stdout || ""); }

// ---------- bản sao lưu gốc ----------
const projDir = `${PROJ_ROOT}/${P}`;
if (!fs.existsSync(`${projDir}/draft_content.json`)) { console.error("Không thấy project CapCut:", projDir); process.exit(1); }
const backupDir = `${WORK}/_backup/${P} - truoc khi Claude edit`;
if (!fs.existsSync(`${backupDir}/draft_content.json`)) {
  if (capcutRunning()) { console.error("CapCut đang mở. Tắt hẳn CapCut rồi chạy lại (cần sao lưu project trước khi sửa)."); process.exit(2); }
  fs.mkdirSync(backupDir, { recursive: true }); fs.cpSync(projDir, backupDir, { recursive: true });
  console.log("Đã sao lưu project gốc vào", backupDir);
}
const D = JSON.parse(fs.readFileSync(`${backupDir}/draft_content.json`, "utf8"));
const TOTAL = D.duration;
for (const k of Object.keys(D.materials)) if (!Array.isArray(D.materials[k]) && D.materials[k] == null) D.materials[k] = [];

// ---------- clone mẫu ----------
// Chỉ giữ các loại material đi kèm an toàn, để không vô tình mang theo hiệu ứng/màu của project mẫu
const KEEP = {
  mainPhoto: ["speeds", "placeholder_infos", "canvases", "material_animations", "sound_channel_mappings", "material_colors", "vocal_separations"],
  overlay: ["speeds", "placeholder_infos", "canvases", "material_animations", "sound_channel_mappings", "material_colors", "vocal_separations"],
  text: ["material_animations"],
  sfx: ["speeds", "placeholder_infos", "beats", "sound_channel_mappings", "vocal_separations"],
  effect: [],
};
function cloneSeg(key) {
  const T = TPL.templates[key]; const ns = clone(T.seg); ns.id = uuid();
  const add = (id) => { const r = T.mats[id]; if (!r) return null; const m = clone(r.data); m.id = uuid(); (D.materials[r.kind] = D.materials[r.kind] || []).push(m); return { k: r.kind, m }; };
  const main = add(T.seg.material_id); ns.material_id = main.m.id;
  ns.extra_material_refs = []; const refs = [];
  for (const id of T.seg.extra_material_refs || []) { const kind = (T.mats[id] || {}).kind; if (!KEEP[key].includes(kind)) continue; const r = add(id); if (r) { refs.push(r); ns.extra_material_refs.push(r.m.id); } }
  ns.common_keyframes = []; ns.keyframe_refs = [];
  return { seg: ns, mat: main.m, refs };
}
function setAnims(o, matKind, list) {
  let r = o.refs.find((x) => x.k === "material_animations");
  if (!r) { const m = { id: uuid(), type: "sticker_animation", animations: [], multi_language_current: "none" }; (D.materials.material_animations = D.materials.material_animations || []).push(m); o.seg.extra_material_refs.push(m.id); r = { k: "material_animations", m }; o.refs.push(r); }
  r.m.animations = list.map((a) => { const t = animTpl(matKind, a.type, a.name); const x = clone(t); x.start = 0; x.duration = a.dur != null ? US(a.dur) : t.duration; return x; });
}
// Tìm mẫu hoạt ảnh theo tên: templates.json trước, rồi favorites.json; file cache phải còn trên máy
function animTpl(matKind, type, name) {
  const key = `${matKind}|${type}|${name}`;
  for (const src of [TPL.anim, FAV.anim || {}]) if (src[key] && fs.existsSync(src[key].path)) return src[key];
  throw new Error(`Không có hoạt ảnh "${name}" (${matKind}/${type}) trong cache CapCut. Chạy scripts/capcut_favorites.js; nếu vẫn thiếu thì bấm thử hoạt ảnh đó 1 lần trong CapCut (để tải về) rồi chạy lại.`);
}
// Đường cong keyframe cài sẵn của CapCut (Biến đổi → biểu đồ keyframe → Hiển thị tất cả cài đặt sẵn).
// "Nảy ra" = cubic-bezier(0.17, 0.89, 0.32, 1.27): vọt quá đích một chút rồi về — đo từ ANPG 5 người dùng tự chỉnh.
const CURVES = { nayra: { resource_id: "7418179396713845249", name: "Nảy ra", p1: [0.17, 0.89], p2: [0.32, 1.27] } };
const graphs = []; // → D.keyframe_graph_list (CapCut ghi tên đường cong ở đây)
// pts: [[giây tính từ đầu đoạn, giá trị, (tuỳ chọn) đường cong cho quãng tới điểm sau]]
function kf(prop, pts) {
  const list = pts.map(([t, v]) => ({ id: uuid(), curveType: "Line", time_offset: US(t), left_control: { x: 0, y: 0 }, right_control: { x: 0, y: 0 }, values: [v], string_value: "", graphID: "" }));
  pts.forEach(([t0, v0, cv], i) => {
    if (!cv || i + 1 >= pts.length) return;
    const C = CURVES[cv]; if (!C) throw new Error("Không có đường cong keyframe: " + cv);
    const [t1, v1] = pts[i + 1]; const T = US(t1) - US(t0), dv = v1 - v0, a = list[i], b = list[i + 1];
    a.curveType = b.curveType = "FreeCurveInOut";
    a.right_control = { x: Math.round(C.p1[0] * T), y: C.p1[1] * dv };            // tay nắm tính từ điểm đầu
    b.left_control = { x: -Math.round((1 - C.p2[0]) * T), y: (C.p2[1] - 1) * dv }; // tay nắm tính từ điểm cuối
    b.graphID = uuid(); graphs.push({ id: b.graphID, resource_id: C.resource_id, resource_name: C.name, source_platform: 1, graph_points: [] });
  });
  return { id: uuid(), material_id: "", property_type: prop, keyframe_list: list };
}
// Mốc thời gian trên timeline được đẩy lên khung hình kế tiếp (CapCut làm đúng như vậy khi lưu project)
const FPS = D.fps || 30;
const FR = (s) => Math.min(TOTAL, Math.round((Math.ceil(s * FPS - 1e-3) * 1e6) / FPS));
function timing(seg, t0, t1, src = true) { const a = FR(t0), b = FR(t1); seg.target_timerange = { start: a, duration: b - a }; if (src) seg.source_timerange = { start: 0, duration: b - a }; }
const baseMatting = clone(TPL.templates.mainPhoto.mats[TPL.templates.mainPhoto.seg.material_id].data.matting);
function setPhoto(mat, file, w, h) { Object.assign(mat, { path: file, material_name: path.basename(file), width: w, height: h, type: "photo", has_audio: false, local_material_id: "", matting: clone(baseMatting), unique_id: crypto.createHash("md5").update(file).digest("hex") }); }
function imgSize(file) { const r = run("ffprobe", ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", file]); const [w, h] = (r.stdout || "").trim().split(",").map(Number); if (!w) throw new Error("Không đọc được ảnh " + file); return [w, h]; }
// Video trám tải bằng fetch_tram.js: material type "video", không tiếng, độ dài thật (µs)
function setVideo(mat, file, w, h, durUs) { setPhoto(mat, file, w, h); Object.assign(mat, { type: "video", duration: durUs, has_audio: false }); }
function vidInfo(file) {
  const r = run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", file]);
  try { const j = JSON.parse(r.stdout); return { w: j.streams[0].width, h: j.streams[0].height, dur: US(parseFloat(j.format.duration)) }; } catch { return null; }
}

// ---------- ảnh giữ chỗ ----------
const TRAM_DIR = `${WORK}/Video trám (thay thế)`;
const PH_DIR = `${WORK}/Ảnh/giu-cho`;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "anpg-")).replace(/\\/g, "/");
for (const d of [TRAM_DIR, PH_DIR]) fs.mkdirSync(d, { recursive: true });
const esc = (p) => p.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
function makeTram(n, label) {
  const nn = String(n).padStart(2, "0");
  const f = `${TRAM_DIR}/tram_${nn}_${slug(label)}.png`;
  if (!fs.existsSync(f)) {
    const t1 = `${TMP}/t${n}a.txt`, t2 = `${TMP}/t${n}b.txt`;
    fs.writeFileSync(t1, `VIDEO TRÁM #${nn}`); fs.writeFileSync(t2, label);
    ffmpeg(["-f", "lavfi", "-i", "color=c=black:s=1080x1920", "-frames:v", "1", "-vf",
      `drawtext=fontfile='${esc(FONT)}':textfile='${esc(t1)}':fontcolor=0xF6C90F:fontsize=58:x=(w-text_w)/2:y=430,` +
      `drawtext=fontfile='${esc(FONT)}':textfile='${esc(t2)}':fontcolor=white:fontsize=76:line_spacing=18:text_align=C:x=(w-text_w)/2:y=540`, f]);
  }
  return f;
}
function makePlaceholder(label) {
  const f = `${PH_DIR}/anh_${slug(label)}.png`;
  if (!fs.existsSync(f)) {
    const t1 = `${TMP}/ph_${slug(label)}.txt`; fs.writeFileSync(t1, "ẢNH:\n" + label);
    ffmpeg(["-f", "lavfi", "-i", "color=c=white:s=1254x1254", "-frames:v", "1", "-vf",
      `format=rgba,geq=r='255':g='255':b='255':a='if(lte(hypot(X-627,Y-627),600),255,0)',` +
      `drawtext=fontfile='${esc(FONT)}':textfile='${esc(t1)}':fontcolor=black:fontsize=120:line_spacing=30:text_align=C:x=(w-text_w)/2:y=(h-text_h)/2`, f]);
  }
  return f;
}

// ---------- 1. track chính ----------
const out = { main: [], effect: [], images: [], texts: [], sfx: [] };
const tramList = [];
// Video trám đã tải (scripts/fetch_tram.js → _tools/tram_<project>.json). Không có / không tải được → nền đen ghi chữ.
const TRAM_MAN = TRAMC.loadManifest(planDir, P);
const tramByIdx = Object.fromEntries(TRAMC.tramEntries(plan, TOTAL / 1e6).map((e) => [e.i, e]));
plan.main.forEach((m, i) => {
  const t0 = m[0], t1 = i + 1 < plan.main.length ? plan.main[i + 1][0] : TOTAL / 1e6;
  if (t1 <= t0) throw new Error(`main: mốc ${t0}s không tăng dần`);
  const o = cloneSeg("mainPhoto");
  const last = i + 1 === plan.main.length;
  const segUs = (last ? TOTAL : FR(t1)) - FR(t0);
  if (m[1] === "tram") {
    const e = tramByIdx[i], got = TRAM_MAN && (TRAM_MAN.entries || {})[e.key];
    const vi = got && got.ok && fs.existsSync(got.file) ? vidInfo(got.file) : null;
    const T = { n: e.n, t0, t1, label: m[2] };
    if (vi && vi.dur >= segUs) {
      setVideo(o.mat, got.file, vi.w, vi.h, vi.dur);
      tramList.push({ ...T, file: got.file, video: true, src: got });
    } else {
      const reason = !TRAM_MAN ? "chưa chạy fetch_tram.js" : !got ? "plan đổi sau lần tải → chạy lại fetch_tram.js"
        : !got.ok ? got.reason : !vi ? "mất file video" : "video ngắn hơn đoạn → chạy lại fetch_tram.js";
      const file = makeTram(e.n, m[2]); setPhoto(o.mat, file, 1080, 1920);
      tramList.push({ ...T, file, video: false, reason });
    }
  } else {
    const file = m[1] === "nen" ? NEN : path.isAbsolute(m[2]) ? m[2] : `${WORK}/${m[2]}`;
    const [w, h] = m[1] === "file" ? imgSize(file) : [1080, 1920];
    setPhoto(o.mat, file, w, h);
  }
  setAnims(o, "videos", []);
  o.seg.clip.scale = { x: 1, y: 1 }; o.seg.clip.transform = { x: 0, y: 0 };
  timing(o.seg, t0, t1);
  if (last) { o.seg.target_timerange.duration = TOTAL - o.seg.target_timerange.start; o.seg.source_timerange.duration = o.seg.target_timerange.duration; }
  out.main.push(o.seg);
});

// ---------- 2. làm mờ nền ----------
for (const [t0, t1] of plan.blurs || []) { const o = cloneSeg("effect"); timing(o.seg, t0, t1, false); o.seg.source_timerange = null; o.seg.common_keyframes = [kf("effects_adjust_blur", [[0, 0], [0.4, 0.5]])]; out.effect.push(o.seg); }

// ---------- 3. ảnh ----------
// anim: tên hoạt ảnh Vào của CapCut (ưu tiên tab Yêu thích, xem favorites.json) hoặc tên tắt dưới đây.
// Không có anim → keyframe phóng to 15% → 100% trong 0,5s với đường cong "Nảy ra".
const IMG_ANIM = { morong: "Mở rộng kiểu kỳ lạ", truot: "Trượt sang trái", phongto: "Phóng to", thuphong: "Thu phóng 1", lac: "Lắc mạnh chiều dọc" };
const IMG_OUT = { mo: "Mờ dần", truot: "Trượt sang trái" };
const phList = [];
const imgStat = { anim: 0, fav: 0, pop: 0, none: 0, names: {} };
for (const im of plan.images || []) {
  const file = im.file ? (path.isAbsolute(im.file) ? im.file : `${WORK}/${im.file}`) : makePlaceholder(im.ph);
  if (im.ph && !phList.find((p) => p.label === im.ph)) phList.push({ label: im.ph, file });
  const [w, h] = imgSize(file);
  const o = cloneSeg("overlay"); setPhoto(o.mat, file, w, h);
  const anims = [];
  const inName = im.anim ? IMG_ANIM[im.anim] || im.anim : null;
  if (inName) anims.push({ type: "in", name: inName, dur: im.animDur });
  if (im.out) anims.push({ type: "out", name: IMG_OUT[im.out] || im.out, dur: im.outDur });
  setAnims(o, "videos", anims);
  timing(o.seg, im.t0, im.t1);
  o.seg.clip.transform = { x: im.x || 0, y: im.y || 0 }; o.seg.clip.scale = { x: im.s, y: im.s };
  const kfs = [];
  if (!inName && im.pop !== false) {
    const pts = [[0, im.s * 0.15, "nayra"], [0.5, im.s]];
    if (im.grow) pts.push([0.6, im.s], [im.grow[1] - im.t0, im.grow[0]]);
    kfs.push(kf("KFTypeScaleX", pts)); imgStat.pop++;
  } else if (inName) {
    if (im.grow) kfs.push(kf("KFTypeScaleX", [[(im.animDur || 0.5) + 0.1, im.s], [im.grow[1] - im.t0, im.grow[0]]]));
    imgStat.anim++; if (isFav("videos|in", inName)) imgStat.fav++; imgStat.names[inName] = (imgStat.names[inName] || 0) + 1;
  } else imgStat.none++;
  if (im.grow) o.seg.clip.scale = { x: im.grow[0], y: im.grow[0] };
  if (im.flyOut) kfs.push(kf("KFTypePositionY", [[im.t1 - im.t0 - 0.7, im.y || 0], [im.t1 - im.t0, 1.25]]));
  o.seg.common_keyframes = kfs;
  out.images.push(o.seg);
}

// ---------- 4. chữ ----------
// CHỈ 3 màu chữ (quy tắc người dùng) — không thêm màu khác
const STY = {
  R: { c: [236, 29, 29], k: [255, 255, 255] },  // đỏ #EC1D1D viền trắng
  W: { c: [255, 255, 255], k: [0, 0, 0] },      // trắng viền đen
  Y: { c: [246, 201, 15], k: [0, 0, 0] },       // vàng #F6C90F viền đen
};
const TEXT_ANIM = { song: "Sóng dồn", truot: "Trượt sang trái", dam: "Đậm rực rỡ", thunho: "Thu nhỏ 2", ro: "Rõ dần", tuyet: "Ánh sáng tuyết mờ" };
const ANIM_DUR = { dam: 0.63, song: 0.6, thunho: 0.5, truot: 0.5, ro: 0.5, tuyet: 0.63 };
// Câu trộn chữ hoa + thường → 2 màu: phần thường trắng (W), phần VIẾT HOA vàng (Y); flip: true thì đảo lại.
// Ký hiệu/số (→, =, 1., 3–5) đi theo từ đứng sau; khoảng trắng đi theo từ đứng trước.
function mixRuns(str, size, flip) {
  const tok = str.normalize("NFC").split(/(\s+)/).filter((t) => t !== "");
  const kind = (w) => { const L = [...w].filter((ch) => ch.toLowerCase() !== ch.toUpperCase()); return !L.length ? null : L.every((ch) => ch === ch.toUpperCase()) ? "U" : "l"; };
  const cls = tok.map((t) => (/^\s+$/.test(t) ? null : kind(t)));
  for (let i = 0; i < tok.length; i++) if (!cls[i] && !/^\s+$/.test(tok[i])) cls[i] = cls.slice(i + 1).find((c) => c) || cls.slice(0, i).reverse().find((c) => c) || "l";
  for (let i = 0; i < tok.length; i++) if (!cls[i]) cls[i] = cls.slice(0, i).reverse().find((c) => c) || cls.slice(i + 1).find((c) => c) || "l";
  const runs = [];
  tok.forEach((t, i) => { const st = (cls[i] === "U") !== !!flip ? "Y" : "W"; if (runs.length && runs[runs.length - 1][0] === st) runs[runs.length - 1][2] += t; else runs.push([st, size, t]); });
  return runs;
}
const isMixedCase = (s) => { const w = s.split(/\s+/).map((x) => [...x].filter((ch) => ch.toLowerCase() !== ch.toUpperCase())); return w.some((L) => L.length >= 2 && L.every((ch) => ch === ch.toUpperCase())) && w.some((L) => L.some((ch) => ch !== ch.toUpperCase())); };
const textWarn = [];
for (const tx of plan.texts || []) {
  const o = cloneSeg("text");
  if (tx.mix) tx.runs = mixRuns(tx.mix, tx.size || 15, tx.flip);
  if (!tx.runs || !tx.runs.length) throw new Error(`Chữ ở ${tx.t0}s thiếu runs/mix`);
  if (tx.runs.length === 1 && isMixedCase(tx.runs[0][2])) textWarn.push(`${tx.t0}s "${tx.runs[0][2].replace(/\n/g, " ")}" trộn hoa/thường nhưng 1 màu → dùng mix`);
  let text = ""; const styles = [];
  for (const [st, size, str] of tx.runs) {
    const S = STY[st]; if (!S) throw new Error(`Kiểu chữ "${st}" không dùng nữa. Chỉ có R (đỏ viền trắng), W (trắng viền đen), Y (vàng #F6C90F viền đen).`);
    const s = text.length; text += str.normalize("NFC");
    styles.push({ fill: { content: { render_type: "solid", solid: { color: S.c.map((v) => v / 255) } } }, font: { path: FONT, id: "" },
      strokes: [{ content: { render_type: "solid", solid: { color: S.k.map((v) => v / 255) } }, width: 0.06, mode: 0 }], size, useLetterColor: true, range: [s, text.length] });
  }
  const m = o.mat, S0 = STY[tx.runs[0][0]];
  Object.assign(m, { content: JSON.stringify({ text, styles }), font_path: FONT, font_size: tx.runs[0][1], text_color: hex(S0.c), border_color: hex(S0.k),
    is_rich_text: tx.runs.length > 1, alignment: 1, type: "text", has_shadow: false, background_alpha: 0, background_style: 0,
    words: { start_time: [], end_time: [], text: [] }, current_words: { start_time: [], end_time: [], text: [] } });
  timing(o.seg, tx.t0, tx.t1, false);
  o.seg.clip.transform = { x: tx.x || 0, y: tx.y }; o.seg.clip.scale = { x: tx.s, y: tx.s };
  const dur = tx.t1 - tx.t0;
  setAnims(o, "texts", tx.anim ? [{ type: "in", name: TEXT_ANIM[tx.anim] || tx.anim, dur: Math.min(tx.animDur || ANIM_DUR[tx.anim] || 0.5, dur * 0.6) }] : []);
  if (tx.pop) o.seg.common_keyframes = [kf("KFTypeScaleX", [[0, 0.1, "nayra"], [0.47, tx.s]])];
  out.texts.push(o.seg);
}

// ---------- 5. SFX ----------
const lufsCache = {};
function lufs(file) {
  if (lufsCache[file] !== undefined) return lufsCache[file];
  const r = run("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "ebur128", "-f", "null", "-"]);
  const m = /I:\s+(-?[\d.]+) LUFS/.exec((r.stderr || "").split("Summary:").pop()); return (lufsCache[file] = m ? parseFloat(m[1]) : -20);
}
const sfxReport = [];
const target = plan.sfxTargetLufs != null ? plan.sfxTargetLufs : -27.5;
for (const [t, name, gainDb] of plan.sfx || []) {
  const S = TPL.sfx[name]; if (!S) throw new Error(`Không có SFX "${name}". Tên SFX có sẵn: ${Object.keys(TPL.sfx).join(" | ")}`);
  const o = cloneSeg("sfx");
  const mat = clone(S.mat); mat.id = o.mat.id; Object.assign(o.mat, mat);
  const dur = Math.min(S.dur, TOTAL / 1e6 - t - 0.01);
  timing(o.seg, t, t + dur);
  const vol = Math.min(3, Math.pow(10, (target - lufs(S.mat.path) + (gainDb || 0)) / 20));
  o.seg.volume = +vol.toFixed(3); o.seg.last_nonzero_volume = o.seg.volume;
  sfxReport.push(`${t.toFixed(2)}s  ${name}  (${(20 * Math.log10(vol)).toFixed(1)} dB)`);
  out.sfx.push(o.seg);
}

// ---------- 6. ghép track ----------
function lanes(segs) {
  const L = [];
  for (const s of segs.sort((a, b) => a.target_timerange.start - b.target_timerange.start)) {
    const st = s.target_timerange.start; let lane = L.find((l) => l.end <= st);
    if (!lane) { lane = { end: 0, segs: [] }; L.push(lane); }
    lane.segs.push(s); lane.end = st + s.target_timerange.duration;
  }
  return L.map((l) => l.segs);
}
const mk = (type, segs, flag, ri) => { for (const s of segs) s.render_index = ri; return { id: uuid(), type, segments: segs, flag, attribute: 0, name: "", is_default_name: true }; };
const videoTracks = D.tracks.filter((t) => t.type === "video");
const textTracks = D.tracks.filter((t) => t.type === "text");
const audioTracks = D.tracks.filter((t) => t.type === "audio");
const others = D.tracks.filter((t) => !["video", "text", "audio"].includes(t.type));
if (videoTracks.length !== 1 || textTracks.length !== 1) {
  console.error(`Project gốc cần đúng 1 track video (nhân vật) và 1 track phụ đề; đang có ${videoTracks.length} video, ${textTracks.length} chữ. Hỏi lại người dùng trước khi dựng.`); process.exit(1);
}
const faceTrack = videoTracks[0], subTrack = textTracks[0];
const T = [];
T.push(mk("video", out.main, 0, 0));
lanes(out.effect).forEach((l) => T.push(mk("effect", l, 0, 11000)));
for (const tr of others) T.push(tr);
lanes(out.images).forEach((l, i) => T.push(mk("video", l, 2, 3 + i)));
for (const s of faceTrack.segments) s.render_index = 2;
T.push({ ...faceTrack, id: uuid(), flag: 2 });
lanes(out.texts).forEach((l, i) => T.push(mk("text", l, 0, 14001 + 2 * i)));
for (const s of subTrack.segments) s.render_index = 14100;
T.push(subTrack);
for (const tr of audioTracks) T.push(tr);            // giữ nguyên track âm thanh có sẵn (nếu có)
lanes(out.sfx).forEach((l) => T.push(mk("audio", l, 0, 0)));
T.forEach((tr, i) => tr.segments.forEach((s) => (s.track_render_index = i)));
D.tracks = T;
D.keyframe_graph_list = [...(D.keyframe_graph_list || []), ...graphs];

// ---------- 7. kiểm tra ----------
const idx = index(D); const ids = new Set(); const errs = [];
for (const tr of D.tracks) for (const s of tr.segments) {
  if (ids.has(s.id)) errs.push("trùng id đoạn " + s.id); ids.add(s.id);
  if (!idx[s.material_id]) errs.push("thiếu material " + s.material_id);
  for (const r of s.extra_material_refs || []) if (!idx[r]) errs.push("thiếu ref " + r);
  if (s.target_timerange.start + s.target_timerange.duration > TOTAL + 1) errs.push(`đoạn ${tr.type} vượt quá cuối video`);
}
let cur = 0; for (const s of D.tracks[0].segments) { if (s.target_timerange.start !== cur) errs.push(`track chính hở ở ${cur / 1e6}s`); cur = s.target_timerange.start + s.target_timerange.duration; }
if (cur !== TOTAL) errs.push(`track chính kết thúc ở ${cur / 1e6}s, video dài ${TOTAL / 1e6}s`);
for (const m of D.materials.videos) if (!fs.existsSync(m.path)) errs.push("thiếu file " + m.path);
if (errs.length) { console.error("LỖI:\n" + errs.slice(0, 30).join("\n")); process.exit(1); }

console.log(`Track: ${D.tracks.map((t) => t.type + "(" + t.segments.length + ")").join(" | ")}`);
const tramOk = tramList.filter((t) => t.video).length;
console.log(`Video trám: ${tramList.length} (tải về ${tramOk} · nền đen ${tramList.length - tramOk}) · Ảnh giữ chỗ: ${phList.length} · Chữ: ${out.texts.length} · SFX: ${out.sfx.length} · Làm mờ: ${out.effect.length}`);
if (!TRAM_MAN && tramList.length) console.log("  ⚠ Chưa chạy scripts/fetch_tram.js → mọi video trám đang là nền đen.");
const tramStale = tramList.filter((t) => !t.video && /chạy lại fetch_tram/.test(t.reason || ""));
if (tramStale.length) console.log(`  ⚠ ${tramStale.length} video trám cần chạy lại fetch_tram.js (plan đổi mốc/nội dung): #${tramStale.map((t) => String(t.n).padStart(2, "0")).join(", #")}`);
console.log(`Ảnh: ${out.images.length} — hoạt ảnh CapCut ${imgStat.anim} (Yêu thích ${imgStat.fav}: ${Object.entries(imgStat.names).map(([n, c]) => `${n}×${c}`).join(", ") || "—"}) · keyframe Nảy ra ${imgStat.pop}${imgStat.none ? ` · hiện thẳng ${imgStat.none}` : ""}`);
if (imgStat.pop > imgStat.anim) console.log("  ⚠ Đa số ảnh đang dùng keyframe — quy tắc kênh: ưu tiên hoạt ảnh CapCut (tab Yêu thích), keyframe Nảy ra chỉ thỉnh thoảng.");
if (textWarn.length) console.log("  ⚠ Chữ cần sửa màu:\n    " + textWarn.join("\n    "));

// ---------- 8. danh sách cho người dùng ----------
const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
const cell = (s) => String(s || "").replace(/\n/g, " ").replace(/\|/g, "/");
const tramRow = (t) => `| ${String(t.n).padStart(2, "0")} | ${fmt(t.t0)}–${fmt(t.t1)} | ${(t.t1 - t.t0).toFixed(1)}s | ${cell(t.label)} |`;
const tramMiss = tramList.filter((t) => !t.video), tramGot = tramList.filter((t) => t.video);
const md = [`# Danh sách cần bổ sung - ${P}`, "",
  `## Video trám còn thiếu — nền đen (${tramMiss.length})`, "", "| # | Thời gian | Dài | Nội dung | Vì sao chưa có |", "|---|---|---|---|---|",
  ...tramMiss.map((t) => `${tramRow(t)} ${cell(t.reason)} |`),
  "", `## Video trám đã tự tải (${tramGot.length}) — xem lại, đoạn nào chưa hợp thì thay`, "",
  "Tải từ YouTube bằng yt-dlp, đã cắt khung 1080×1920 và bỏ tiếng, nằm trong `Video trám (tải về)/`. Kiểm tra quyền sử dụng trước khi đăng.", "",
  "| # | Thời gian | Dài | Nội dung | Nguồn |", "|---|---|---|---|---|",
  ...tramGot.map((t) => `${tramRow(t)} [${cell(t.src.title).slice(0, 60)}](${t.src.url}) từ ${t.src.start}s |`),
  "", "## Ảnh giữ chỗ (vòng tròn trắng)", "", ...phList.map((p) => `- ${p.label}`),
  "", "Cách thay: chuột phải vào đoạn trên timeline → Thay thế → chọn video/ảnh mới (giữ nguyên vị trí, thời lượng, hiệu ứng).",
  "", "## SFX đã thêm", "", ...sfxReport.map((s) => `- ${s}`)].join("\n");
fs.writeFileSync(`${WORK}/DANH_SACH_CAN_BO_SUNG - ${P}.md`, md);
fs.rmSync(TMP, { recursive: true, force: true });

if (OUT) { fs.writeFileSync(OUT, JSON.stringify(D)); console.log("Đã xuất draft dựng thử:", OUT); }
if (DRY) { console.log("Chạy thử: KHÔNG ghi vào project."); process.exit(0); }
if (capcutRunning()) { console.error("CapCut đang mở → không ghi. Tắt hẳn CapCut rồi chạy lại."); process.exit(2); }

// ---------- 9. ghi vào project (cả bản ở thư mục gốc lẫn Timelines/<id>) ----------
const json = JSON.stringify(D);
const targets = [`${projDir}/draft_content.json`, `${projDir}/draft_content.json.bak`, `${projDir}/template-2.tmp`];
try {
  const tl = JSON.parse(fs.readFileSync(`${projDir}/Timelines/project.json`, "utf8")).main_timeline_id;
  targets.push(`${projDir}/Timelines/${tl}/draft_content.json`, `${projDir}/Timelines/${tl}/draft_content.json.bak`, `${projDir}/Timelines/${tl}/template-2.tmp`);
} catch { /* bản CapCut cũ không có thư mục Timelines */ }
let n = 0; for (const f of targets) if (fs.existsSync(f)) { fs.writeFileSync(f, json); n++; }
console.log(`Đã ghi ${n} file project. Mở CapCut → project "${P}" để xem.`);
