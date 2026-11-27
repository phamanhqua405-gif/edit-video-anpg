// Tạo lại assets/templates.json: mẫu đoạn clip/chữ/SFX/hiệu ứng + danh mục hoạt ảnh và SFX có trong cache CapCut.
// Chạy khi: lần đầu cài skill, hoặc khi cần thêm SFX/hoạt ảnh mới (dùng nó 1 lần trong 1 project CapCut bất kỳ rồi chạy lại).
// Cách chạy:  node extract_templates.js [tên project mẫu 1] [tên project mẫu 2] ...
const fs = require("fs");
const path = require("path");

const { LOCAL, saveAsset } = require("./paths");
const PROJ_ROOT = `${LOCAL}/CapCut/User Data/Projects/com.lveditor.draft`;
const OUT = path.resolve(__dirname, "../assets/templates.json");
const SOURCES = process.argv.slice(2).length ? process.argv.slice(2) : ["ANPG 1", "ANPG 2", "ANPG 3"];

const clone = (o) => JSON.parse(JSON.stringify(o));
function readDraft(name) {
  const p = `${PROJ_ROOT}/${name}/draft_content.json`;
  if (!fs.existsSync(p)) return null;
  try { let d = JSON.parse(fs.readFileSync(p, "utf8")); return d; } catch { return null; }
}
// gom cả draft lồng (compound clip) để không bỏ sót
function allDrafts(d) { const out = [d]; for (const x of (d.materials && d.materials.drafts) || []) if (x.draft) out.push(...allDrafts(x.draft)); return out; }
function index(d) { const m = {}; for (const [k, a] of Object.entries(d.materials)) if (Array.isArray(a)) for (const x of a) if (x && x.id) m[x.id] = { k, x }; return m; }

const sourceDrafts = [];
for (const n of SOURCES) { const d = readDraft(n); if (!d) { console.warn("bỏ qua (không đọc được):", n); continue; } for (const x of allDrafts(d)) sourceDrafts.push({ name: n, d: x, idx: index(x) }); }
if (!sourceDrafts.length) { console.error("Không đọc được project mẫu nào trong", PROJ_ROOT); process.exit(1); }

// preds: danh sách điều kiện theo thứ tự ưu tiên (mẫu đã kiểm chứng trước, mẫu chung sau)
function pick(label, ...preds) {
  for (const pred of preds) for (const t of sourceDrafts) for (const tr of t.d.tracks) for (const s of tr.segments) {
    const r = t.idx[s.material_id];
    if (r && pred(s, r, tr)) {
      const mats = {}; for (const id of [s.material_id, ...(s.extra_material_refs || [])]) if (t.idx[id]) mats[id] = { kind: t.idx[id].k, data: clone(t.idx[id].x) };
      console.log(`mẫu ${label}: lấy từ ${t.name}`);
      return { seg: clone(s), mats };
    }
  }
  throw new Error("không tìm thấy mẫu " + label + " trong " + SOURCES.join(", "));
}

const templates = {
  mainPhoto: pick("mainPhoto (ảnh trên track chính)",
    (s, r) => r.k === "videos" && r.x.path.endsWith("nền.png"),
    (s, r, tr) => r.k === "videos" && r.x.type === "photo" && tr.type === "video" && tr.flag === 0),
  overlay: pick("overlay (ảnh chồng lớp)",
    (s, r) => r.k === "videos" && r.x.path.endsWith("ức gà.png"),
    (s, r, tr) => r.k === "videos" && r.x.type === "photo" && tr.type === "video" && tr.flag === 2),
  text: pick("text (chữ tiêu đề)",
    (s, r) => r.k === "texts" && r.x.type === "text" && r.x.content.includes("KIỂM SOÁT"),
    (s, r) => r.k === "texts" && r.x.type === "text" && (s.extra_material_refs || []).length > 0),
  sfx: pick("sfx (hiệu ứng âm thanh)",
    (s, r) => r.k === "audios" && r.x.type === "sound" && r.x.name.startsWith("Pop!"),
    (s, r) => r.k === "audios" && r.x.type === "sound"),
  effect: pick("effect (làm mờ)",
    (s, r, tr) => r.k === "video_effects" && r.x.name === "Mờ" && tr.type === "effect" && (s.common_keyframes || []).some((k) => k.property_type === "effects_adjust_blur"),
    (s, r, tr) => r.k === "video_effects" && r.x.name === "Mờ" && tr.type === "effect"),
};

// Danh mục hoạt ảnh + SFX: quét MỌI project trong CapCut để có nhiều lựa chọn
const anim = {}, sfx = {};
for (const dir of fs.readdirSync(PROJ_ROOT)) {
  const d0 = readDraft(dir); if (!d0) continue;
  for (const d of allDrafts(d0)) {
    const idx = index(d);
    for (const tr of d.tracks) for (const s of tr.segments) {
      const r = idx[s.material_id]; if (!r) continue;
      if (r.k === "audios" && r.x.type === "sound" && !sfx[r.x.name] && fs.existsSync(r.x.path)) sfx[r.x.name] = { mat: clone(r.x), dur: s.target_timerange.duration / 1e6};
      for (const id of s.extra_material_refs || []) {
        const a = idx[id]; if (!a || a.k !== "material_animations") continue;
        for (const x of a.x.animations || []) { const key = `${r.k}|${x.type}|${x.name}`; if (!anim[key] && fs.existsSync(x.path)) anim[key] = clone(x); }
      }
    }
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
saveAsset(OUT, { created: new Date().toISOString(), sources: SOURCES.map(() => "<project mẫu>"), templates, anim, sfx });
console.log(`\nĐã ghi ${OUT}`);
console.log(`Hoạt ảnh chữ (texts): ${Object.keys(anim).filter((k) => k.startsWith("texts|")).map((k) => k.split("|").slice(1).join(":")).join(", ")}`);
console.log(`Hoạt ảnh clip/ảnh (videos): ${Object.keys(anim).filter((k) => k.startsWith("videos|")).map((k) => k.split("|").slice(1).join(":")).join(", ")}`);
console.log(`SFX (${Object.keys(sfx).length}): ${Object.keys(sfx).join(" | ")}`);
