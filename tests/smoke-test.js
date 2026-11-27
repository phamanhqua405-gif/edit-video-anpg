// Kiểm tra nhanh skill edit-video-anpg.
//   node tests/smoke-test.js
//   node tests/smoke-test.js --project "ANPG 5" --work "<thư mục tập>"   (thêm: đọc project thật + dựng thử, không ghi project)
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const SKILL = path.resolve(__dirname, "../edit-video-anpg");
const args = process.argv.slice(2);
const arg = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
let fail = 0;
const ok = (name, cond, extra = "") => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`); if (!cond) fail++; };

// 1. cú pháp mọi script
for (const f of fs.readdirSync(`${SKILL}/scripts`).filter((f) => f.endsWith(".js"))) {
  const r = cp.spawnSync(process.execPath, ["--check", `${SKILL}/scripts/${f}`], { encoding: "utf8" });
  ok(`cú pháp scripts/${f}`, r.status === 0, (r.stderr || "").split("\n")[0]);
}

// 2. SKILL.md có frontmatter name/description
const sk = fs.readFileSync(`${SKILL}/SKILL.md`, "utf8");
ok("SKILL.md frontmatter", /^---\nname: edit-video-anpg\ndescription: .+\n---/m.test(sk.replace(/\r/g, "")));

// 3. không còn đường dẫn/ thông tin máy cá nhân trong repo
const PATTERNS = [/C:[\\/]+Users[\\/]+(?!%)[A-Za-z0-9._-]+/i, /[A-Z]:[\\/]+0\. Công việc/i, /hard_disk_id"\s*:\s*"[^"]+/, /mac_address"\s*:\s*"[^"]+/, /device_id"\s*:\s*"[^"]+/];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === "node_modules" || e.name === ".git" ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)]));
const leaks = [];
for (const f of walk(path.resolve(__dirname, "..")).filter((f) => /\.(js|json|md|txt)$/i.test(f) && !f.endsWith("smoke-test.js"))) {
  const s = fs.readFileSync(f, "utf8");
  for (const p of PATTERNS) { const m = p.exec(s); if (m) leaks.push(`${path.relative(path.resolve(__dirname, ".."), f)}: ${m[0]}`); }
}
ok("không còn đường dẫn máy cá nhân", leaks.length === 0, leaks.slice(0, 5).join(" | "));

// 4. assets đọc được qua paths.js, chỗ giữ %LOCALAPPDATA% được thay đúng
const { loadAsset, LOCAL, DEFAULT_NEN } = require(`${SKILL}/scripts/paths.js`);
const tpl = loadAsset(`${SKILL}/assets/templates.json`);
const raw = JSON.stringify(tpl);
ok("templates.json đọc được", !!(tpl.templates && tpl.anim && tpl.sfx), `${Object.keys(tpl.sfx).length} SFX, ${Object.keys(tpl.anim).length} hoạt ảnh`);
ok("đã thay %LOCALAPPDATA%", !raw.includes("%LOCALAPPDATA%"));
ok("ảnh nền mặc định có sẵn", fs.existsSync(DEFAULT_NEN), DEFAULT_NEN);
for (const k of ["mainPhoto", "overlay", "text", "sfx", "effect"]) ok(`mẫu ${k}`, !!tpl.templates[k]);

// 5. trên máy có CapCut: tài nguyên bộ đệm còn tồn tại
if (fs.existsSync(`${LOCAL}/CapCut`)) {
  const sfx = Object.values(tpl.sfx); const have = sfx.filter((s) => fs.existsSync(s.mat.path)).length;
  ok("SFX trong bộ đệm CapCut", have > 0, `${have}/${sfx.length} file còn trên máy`);
} else console.log("SKIP  máy không có CapCut — bỏ qua kiểm tra bộ đệm");

// 6. công cụ ngoài
for (const bin of ["ffmpeg", "ffprobe"]) { const r = cp.spawnSync(bin, ["-version"], { encoding: "utf8" }); ok(`${bin} trong PATH`, r.status === 0); }

// 7. chạy thật trên một project (tuỳ chọn)
const P = arg("--project"), W = arg("--work");
if (P && W) {
  const r1 = cp.spawnSync(process.execPath, [`${SKILL}/scripts/inspect_project.js`, P, W], { encoding: "utf8" });
  ok(`inspect_project "${P}"`, r1.status === 0, (r1.stdout || r1.stderr).split("\n").find((l) => /Thời lượng|Không/.test(l)) || "");
  const plan = path.join(W, "_tools", `plan_${P.replace(/\s+/g, "")}.js`);
  if (fs.existsSync(plan)) {
    const r2 = cp.spawnSync(process.execPath, [`${SKILL}/scripts/capcut_builder.js`, plan, "--dry"], { encoding: "utf8" });
    const out = (r2.stdout || "") + (r2.stderr || "");
    ok(`capcut_builder --dry ${path.basename(plan)}`, r2.status === 0 && /không ghi/i.test(out), out.split("\n").filter((l) => /Track:|Video trám|LỖI|Lỗi|⚠/.test(l)).join(" | ").slice(0, 300));
  } else console.log(`SKIP  không thấy ${plan}`);
}

console.log(fail ? `\n${fail} kiểm tra THẤT BẠI` : "\nTất cả kiểm tra đều đạt");
process.exit(fail ? 1 : 0);
