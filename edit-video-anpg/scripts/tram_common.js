// Dùng chung cho fetch_tram.js và capcut_builder.js: danh sách dòng "tram" trong plan, khoá cache, nơi lưu file.
// Dòng tram trong plan: [giây, "tram", "mô tả hiện trên nền đen", { q, url, start, dl }]  (phần {…} tuỳ chọn)
//   q     = từ khoá tìm trên YouTube (nên viết tiếng Anh + "stock footage"/"b-roll"); thiếu thì dùng mô tả
//   url   = link video cụ thể (bỏ qua tìm kiếm)
//   start = giây bắt đầu cắt trong video nguồn (mặc định tự chọn)
//   dl    = false → không tải, giữ nền đen ghi chữ
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

// totalSec = độ dài video (giây) để tính đoạn tram cuối cùng
function tramEntries(plan, totalSec) {
  const list = []; const seen = {};
  plan.main.forEach((m, i) => {
    if (m[1] !== "tram") return;
    const o = (m[3] && typeof m[3] === "object") ? m[3] : {};
    const t0 = m[0], t1 = i + 1 < plan.main.length ? plan.main[i + 1][0] : totalSec;
    const label = String(m[2] || "");
    const query = String(o.q || label).replace(/\s*\n\s*/g, " ").trim();
    let key = crypto.createHash("md5").update([label, o.url || query, o.start != null ? o.start : ""].join("|")).digest("hex").slice(0, 8);
    seen[key] = (seen[key] || 0) + 1; if (seen[key] > 1) key += "-" + seen[key]; // 2 dòng giống hệt nhau → 2 video khác nhau
    list.push({ n: list.length + 1, i, t0, t1, label, query, url: o.url || null, start: o.start, dl: o.dl !== false, key });
  });
  return list;
}

const manifestFile = (planDir, project) => path.join(planDir, `tram_${project}.json`).replace(/\\/g, "/");
const previewFile = (planDir, project) => path.join(planDir, `tram_preview_${project}.jpg`).replace(/\\/g, "/");
const downloadDir = (work) => `${work}/Video trám (tải về)`;
function loadManifest(planDir, project) {
  try { return JSON.parse(fs.readFileSync(manifestFile(planDir, project), "utf8")); } catch { return null; }
}

module.exports = { slug, tramEntries, manifestFile, previewFile, downloadDir, loadManifest };
