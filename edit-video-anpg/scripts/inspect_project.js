// Đọc project CapCut người dùng đã chuẩn bị + thư mục làm việc, xuất ra những gì cần để lên kế hoạch dựng.
// Cách chạy:  node inspect_project.js "<tên project CapCut>" "<thư mục làm việc>"
// Ghi ra <thư mục làm việc>/_tools/: transcript_<project>.txt (lời thoại kèm thời gian từng từ) và kich_ban.txt (nếu có file .docx)
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const [P, WORK0] = process.argv.slice(2);
if (!P || !WORK0) { console.error('Cách chạy: node inspect_project.js "<tên project>" "<thư mục làm việc>"'); process.exit(1); }
const WORK = WORK0.replace(/\\/g, "/");
const { LOCAL } = require("./paths");
const projDir = `${LOCAL}/CapCut/User Data/Projects/com.lveditor.draft/${P}`;
const backup = `${WORK}/_backup/${P} - truoc khi Claude edit/draft_content.json`;
// Nếu đã có bản sao lưu (đã dựng trước đó), đọc bản gốc để thấy đúng dữ liệu người dùng chuẩn bị
const src = fs.existsSync(backup) ? backup : `${projDir}/draft_content.json`;
if (!fs.existsSync(src)) { console.error("Không thấy project:", projDir); process.exit(1); }
const d = JSON.parse(fs.readFileSync(src, "utf8"));
const idx = {}; for (const [k, a] of Object.entries(d.materials)) if (Array.isArray(a)) for (const x of a) if (x && x.id) idx[x.id] = { k, x };
const OUTDIR = `${WORK}/_tools`;
fs.mkdirSync(OUTDIR, { recursive: true });

console.log(`Project: ${P}  (đọc từ ${src === backup ? "bản sao lưu gốc" : "project CapCut"})`);
console.log(`Thời lượng: ${(d.duration / 1e6).toFixed(2)}s · Khung: ${d.canvas_config.width}x${d.canvas_config.height} · CapCut ${(d.platform || {}).app_version || "?"}`);
console.log(`Track: ${d.tracks.map((t) => `${t.type}(${t.segments.length})`).join(" | ")}`);

for (const tr of d.tracks.filter((t) => t.type === "video")) {
  console.log("\nClip nhân vật / video:");
  for (const s of tr.segments) {
    const m = idx[s.material_id].x, c = s.clip || {};
    console.log(`  ${(s.target_timerange.start / 1e6).toFixed(2).padStart(7)}s +${(s.target_timerange.duration / 1e6).toFixed(2)}  ${path.basename(m.path)}  ${m.width}x${m.height}  vị trí(${c.transform.x.toFixed(2)},${c.transform.y.toFixed(2)}) tỉ lệ ${c.scale.x.toFixed(2)}  xóa nền=${m.matting && m.matting.flag ? "có" : "KHÔNG"}`);
  }
}

const lines = [];
for (const tr of d.tracks.filter((t) => t.type === "text")) {
  const first = idx[tr.segments[0].material_id].x; let st = {};
  try { st = JSON.parse(first.content).styles[0]; } catch {}
  console.log(`\nPhụ đề: ${tr.segments.length} dòng · font ${path.basename((st.font || {}).path || first.font_path || "")} · cỡ ${st.size} · y=${tr.segments[0].clip.transform.y.toFixed(2)} · tỉ lệ ${tr.segments[0].clip.scale.x.toFixed(2)}`);
  for (const s of tr.segments) {
    const m = idx[s.material_id].x; const t0 = s.target_timerange.start / 1e6; let txt = "";
    try { txt = JSON.parse(m.content).text; } catch { txt = m.content; }
    const w = m.words || {};
    const ws = (w.text || []).map((t, i) => (t.trim() ? `${t.trim()}@${(t0 + w.start_time[i] / 1000).toFixed(2)}` : "")).filter(Boolean).join(" ");
    lines.push(`${t0.toFixed(2).padStart(7)} +${(s.target_timerange.duration / 1e6).toFixed(2)} | ${ws || txt}`);
  }
}
fs.writeFileSync(`${OUTDIR}/transcript_${P}.txt`, lines.join("\n"));
console.log(`\nĐã ghi lời thoại + thời gian từng từ: ${OUTDIR}/transcript_${P}.txt (${lines.length} dòng)`);

// Kịch bản .docx (dùng tar có sẵn của Windows để đọc file zip)
// Git Bash có tar riêng (không đọc được zip) → ưu tiên tar.exe của Windows, rồi tới unzip
const winTar = `${(process.env.SystemRoot || "C:/Windows").replace(/\\/g, "/")}/System32/tar.exe`;
function readZipEntry(file, entry) {
  const tries = [[fs.existsSync(winTar) ? winTar : "tar", ["-xOf", file, entry]], ["unzip", ["-p", file, entry]]];
  for (const [bin, a] of tries) { const r = cp.spawnSync(bin, a, { encoding: "utf8", maxBuffer: 64 << 20 }); if (r.status === 0 && r.stdout) return r.stdout; }
  return null;
}
for (const f of fs.readdirSync(WORK).filter((f) => /\.docx$/i.test(f) && !f.startsWith("~$"))) {
  const xml = readZipEntry(`${WORK}/${f}`, "word/document.xml");
  if (!xml) { console.warn("Không đọc được", f); continue; }
  const r = { stdout: xml };
  const text = r.stdout.replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\n{2,}/g, "\n").trim();
  fs.writeFileSync(`${OUTDIR}/kich_ban.txt`, text);
  console.log(`Đã ghi kịch bản từ "${f}": ${OUTDIR}/kich_ban.txt (${text.length} ký tự)`);
}

// Liệt kê tư liệu
for (const sub of fs.readdirSync(WORK, { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith("_"))) {
  const files = fs.readdirSync(`${WORK}/${sub.name}`).filter((f) => !fs.statSync(`${WORK}/${sub.name}/${f}`).isDirectory());
  console.log(`Thư mục "${sub.name}": ${files.length} file${files.length ? " — " + files.slice(0, 12).join(", ") : ""}`);
}
