// Lấy danh sách hoạt ảnh "Yêu thích" (đánh sao) của CapCut và chuẩn bị để capcut_builder.js dùng được.
// CapCut không lưu tab Yêu thích thành file riêng (đồng bộ theo tài khoản), nên gộp 2 nguồn trên máy:
//   1. Hoạt ảnh trong mọi project được áp từ tab Yêu thích (category_id kết thúc bằng "_fav": in_fav, out_fav, ruchang_fav…)
//   2. Cờ has_favorited trong bộ đệm danh mục hoạt ảnh (Cache/ressdk_db/*/rp.db, bảng http_cache) — bản mới nhất của mỗi hoạt ảnh
// Chỉ ĐỌC dữ liệu CapCut (CSDL được chép sang thư mục tạm rồi mới mở), chạy được cả khi CapCut đang mở.
// Ghi assets/favorites.json gồm: favorites (tên theo nhóm) + anim (mẫu hoạt ảnh đã tải về máy, cho builder).
// Cách chạy:  node capcut_favorites.js        (cần Node ≥ 22.5 để đọc SQLite; Node cũ hơn thì chỉ dùng nguồn 1)
const fs = require("fs");
const os = require("os");
const path = require("path");

const { LOCAL, saveAsset } = require("./paths");
const UD = `${LOCAL}/CapCut/User Data`;
const PROJ_ROOT = `${UD}/Projects/com.lveditor.draft`;
const CE = `${UD}/Cache/effect`;
const RES = `${UD}/Cache/ressdk_db`;
const OUT = path.resolve(__dirname, "../assets/favorites.json");
const clone = (o) => JSON.parse(JSON.stringify(o));

// nhóm hoạt ảnh CapCut → [loại material của đoạn, kiểu hoạt ảnh] như khoá trong templates.json
const AT = { video_in: ["videos", "in"], video_out: ["videos", "out"], text_ruchang: ["texts", "in"], text_chuchang: ["texts", "out"], text_xunhuan: ["texts", "loop"] };
const FAV_CAT = { "videos|in": ["in_fav", "in_fav"], "videos|out": ["out_fav", "out_fav"], "texts|in": ["ruchang_fav", "Yêu thích"], "texts|out": ["chuchang_fav", "Yêu thích"], "texts|loop": ["xunhuan", "Vòng lặp"] };

// thư mục cache của hoạt ảnh: ưu tiên đúng md5, không thì bản tải gần nhất
function cacheDir(id, md5) {
  if (!id) return null;
  if (md5 && fs.existsSync(`${CE}/${id}/${md5}`)) return `${CE}/${id}/${md5}`;
  if (!fs.existsSync(`${CE}/${id}`)) return null;
  const dirs = fs.readdirSync(`${CE}/${id}`).filter((d) => !d.endsWith("_tmp") && fs.statSync(`${CE}/${id}/${d}`).isDirectory())
    .map((d) => ({ d, t: fs.statSync(`${CE}/${id}/${d}`).mtimeMs })).sort((a, b) => b.t - a.t);
  return dirs.length ? `${CE}/${id}/${dirs[0].d}` : null;
}

// ---------- nguồn 1: project ----------
const proj = {}; // key → { sample, fav, last }
function index(d) { const m = {}; for (const [k, a] of Object.entries(d.materials || {})) if (Array.isArray(a)) for (const x of a) if (x && x.id) m[x.id] = { k, x }; return m; }
function allDrafts(d) { const out = [d]; for (const x of (d.materials && d.materials.drafts) || []) if (x.draft) out.push(...allDrafts(x.draft)); return out; }
let nProj = 0;
for (const dir of fs.existsSync(PROJ_ROOT) ? fs.readdirSync(PROJ_ROOT) : []) {
  const f = `${PROJ_ROOT}/${dir}/draft_content.json`; if (!fs.existsSync(f)) continue;
  let d0; try { d0 = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; }
  nProj++; const when = fs.statSync(f).mtime.toISOString().slice(0, 10);
  for (const d of allDrafts(d0)) {
    const idx = index(d);
    for (const tr of d.tracks || []) for (const s of tr.segments || []) {
      const r = idx[s.material_id]; if (!r || !["videos", "texts"].includes(r.k)) continue;
      for (const id of s.extra_material_refs || []) {
        const a = idx[id]; if (!a || a.k !== "material_animations") continue;
        for (const x of a.x.animations || []) {
          if (!x.name || !["in", "out", "loop"].includes(x.type)) continue;
          const key = `${r.k}|${x.type}|${x.name}`;
          const p = proj[key] || (proj[key] = { sample: null, fav: false, last: "" });
          const isFav = /_fav$/.test(x.category_id || "");
          if (isFav) p.fav = true;
          if (!p.sample || (fs.existsSync(x.path) && !fs.existsSync(p.sample.path)) || (isFav && !/_fav$/.test(p.sample.category_id || ""))) p.sample = clone(x);
          if (when > p.last) p.last = when;
        }
      }
    }
  }
}

// ---------- nguồn 2: bộ đệm danh mục của CapCut ----------
const cat = {}; // key → { id, md5, fav, ts, dur }
let nDb = 0, sqliteOk = true;
let DatabaseSync = null;
try { ({ DatabaseSync } = require("node:sqlite")); } catch { sqliteOk = false; }
if (sqliteOk && fs.existsSync(RES)) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "anpg-rp-"));
  try {
    for (const dir of fs.readdirSync(RES)) {
      const db0 = `${RES}/${dir}/rp.db`; if (!fs.existsSync(db0)) continue;
      const dst = path.join(tmp, dir); fs.mkdirSync(dst);
      for (const ext of ["", "-wal", "-shm"]) if (fs.existsSync(db0 + ext)) fs.copyFileSync(db0 + ext, path.join(dst, "rp.db" + ext));
      let db; try { db = new DatabaseSync(path.join(dst, "rp.db"), { readOnly: true }); } catch { continue; }
      try {
        nDb++;
        for (const r of db.prepare("select response_body b, timestamp ts from http_cache").all()) {
          if (!r.b.includes('"animation_type"')) continue;
          let j; try { j = JSON.parse(r.b); } catch { continue; }
          const walk = (o) => {
            if (!o || typeof o !== "object") return;
            if (Array.isArray(o)) { o.forEach(walk); return; }
            if (o.common_attr && o.common_attr.effect_id && o.animation && AT[o.animation.animation_type]) {
              const c = o.common_attr; const [k, t] = AT[o.animation.animation_type]; const key = `${k}|${t}|${c.title}`;
              let dur = null; try { dur = JSON.parse(c.sdk_extra || "{}").setting.animation_duration; } catch { /* không có */ }
              if (!cat[key] || cat[key].ts < r.ts) cat[key] = { id: c.effect_id, md5: c.md5, fav: !!c.has_favorited, ts: r.ts, dur };
            }
            for (const v of Object.values(o)) walk(v);
          };
          walk(j.data);
        }
      } catch { /* CSDL không có bảng http_cache */ }
      db.close();
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

// ---------- gộp ----------
function entryFor(key) {
  const [kind, type, name] = key.split("|");
  const p = proj[key], c = cat[key];
  const id = (p && p.sample && p.sample.resource_id) || (c && c.id);
  const dir = cacheDir(id, c && c.md5) || (p && p.sample && fs.existsSync(p.sample.path) ? p.sample.path : null);
  if (!dir) return null;
  const [cid, cname] = FAV_CAT[`${kind}|${type}`];
  const e = p && p.sample ? clone(p.sample) : {
    id, type, start: 0, duration: Math.round(((c && c.dur) || 0.5) * 1e6), path: dir, platform: "all", resource_id: id, third_resource_id: id,
    source_platform: 1, name, category_id: cid, category_name: cname, panel: kind === "videos" ? "video" : "", material_type: kind === "videos" ? "video" : "sticker",
    anim_adjust_params: null, request_id: "",
  };
  e.path = dir; e.start = 0; e.id = e.id || id; e.request_id = "";
  return e;
}
const keys = new Set([...Object.keys(proj), ...Object.keys(cat)]);
const anim = {};
const favorites = {};
for (const key of [...keys].sort()) {
  const e = entryFor(key); if (e) anim[key] = e;
  const p = proj[key], c = cat[key];
  if ((p && p.fav) || (c && c.fav)) {
    const g = key.split("|").slice(0, 2).join("|");
    (favorites[g] = favorites[g] || []).push({ name: key.split("|")[2], ok: !!e, from: [p && p.fav ? "project" : null, c && c.fav ? "capcut-cache" : null].filter(Boolean), last: (p && p.last) || (c && c.ts && c.ts.slice(0, 10)) || "" });
  }
}
for (const g of Object.keys(favorites)) favorites[g].sort((a, b) => (b.ok - a.ok) || b.last.localeCompare(a.last));

saveAsset(OUT, { updated: new Date().toISOString(), sources: { projects: nProj, capcutCacheDbs: nDb }, favorites, anim });
console.log(`Đã ghi ${OUT}`);
console.log(`Nguồn: ${nProj} project, ${nDb} CSDL bộ đệm${sqliteOk ? "" : " (Node không có node:sqlite → bỏ qua nguồn bộ đệm)"} · Hoạt ảnh đã tải về máy: ${Object.keys(anim).length}`);
const LABEL = { "videos|in": "Ảnh/clip — Vào", "videos|out": "Ảnh/clip — Ra", "texts|in": "Chữ — Vào", "texts|out": "Chữ — Ra", "texts|loop": "Chữ — Lặp" };
for (const g of Object.keys(LABEL)) if (favorites[g]) {
  console.log(`\nYêu thích · ${LABEL[g]}:`);
  for (const f of favorites[g]) console.log(`  ${f.ok ? "✓" : "✗ chưa tải"}  ${f.name}`);
}
console.log("\n✗ = chưa có trong cache: mở CapCut, bấm thử hoạt ảnh đó 1 lần (để tải về) rồi chạy lại script này.");
