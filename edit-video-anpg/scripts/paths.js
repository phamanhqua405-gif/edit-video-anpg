// Đường dẫn dùng chung — không ghi cứng thư mục của máy nào.
const fs = require("fs");
const os = require("os");
const path = require("path");

const slash = (p) => p.replace(/\\/g, "/");
// %LOCALAPPDATA% của Windows (CapCut, font người dùng, winget đều nằm ở đây)
const LOCAL = slash(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"));
const PROJ_ROOT = `${LOCAL}/CapCut/User Data/Projects/com.lveditor.draft`;
const ASSETS = slash(path.resolve(__dirname, "../assets"));
// Ảnh nền xám của slide: biến môi trường ANPG_NEN, hoặc plan.nen, mặc định assets/nen.png
const DEFAULT_NEN = slash(process.env.ANPG_NEN || `${ASSETS}/nen.png`);
const PH = "%LOCALAPPDATA%";

// Đọc file assets/*.json: thay chỗ giữ %LOCALAPPDATA% bằng đường dẫn thật của máy đang chạy
function loadAsset(file) { return JSON.parse(fs.readFileSync(file, "utf8").split(PH).join(LOCAL)); }
// Ghi file assets/*.json: thay đường dẫn máy bằng chỗ giữ để file dùng được trên máy khác
function saveAsset(file, obj, space = 1) { fs.writeFileSync(file, JSON.stringify(obj, null, space).split(LOCAL).join(PH)); }

module.exports = { LOCAL, PROJ_ROOT, ASSETS, DEFAULT_NEN, loadAsset, saveAsset, slash };
