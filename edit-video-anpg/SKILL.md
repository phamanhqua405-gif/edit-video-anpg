---
name: edit-video-anpg
description: Dựng video kênh "Ăn ngủ gym" (ANPG) trực tiếp vào project CapCut PC theo đúng style kênh — video trám tự tải bằng yt-dlp (không tải được thì nền đen ghi chữ), slide nền xám, chữ tiêu đề chỉ 3 màu đỏ/trắng/vàng (câu trộn hoa-thường tô 2 màu), ảnh minh hoạ dùng hoạt ảnh CapCut ở mục Yêu thích hoặc keyframe "Nảy ra" (tải trên mạng hoặc ảnh giữ chỗ), làm mờ nền, hiệu ứng âm thanh, không nhạc nền. Dùng skill này mỗi khi người dùng muốn dựng/edit/hoàn thiện một video ANPG (ANPG 6, ANPG 7…), nhắc tới kênh Ăn ngủ gym, gửi thư mục "Claude edit" có kịch bản + video thô, hoặc nhờ thêm chữ, SFX, video trám, ảnh minh hoạ vào một project CapCut — kể cả khi họ không gọi tên skill.
---

# Dựng video ANPG trên CapCut PC

Người dùng chuẩn bị sẵn phần khó làm bằng code (cắt thô, xóa nền nhân vật, phụ đề tự động) trong một project CapCut;
skill này làm phần còn lại bằng cách ghi thẳng vào file project (`draft_content.json`), rồi người dùng mở CapCut để
soát/thay video trám, ảnh và xuất video.

Đọc trước khi lên kế hoạch: `references/style-guide.md` (style kênh, vị trí, màu, SFX nào cho sự kiện nào).
Khi viết kế hoạch: `references/plan-format.md` + ví dụ thật `assets/plan_example_ANPG5.js`.
Khi gặp lỗi CapCut/kỹ thuật: `references/capcut-notes.md`.

## Quy tắc của người dùng (giữ nguyên, đừng "cải tiến")
- **Video trám: tự tải bằng yt-dlp** (`scripts/fetch_tram.js`, tìm trên YouTube, ưu tiên clip stock miễn phí, bỏ bản có watermark),
  cắt đúng độ dài đoạn, khung 1080×1920, bỏ tiếng. Đoạn nào **không tải được** (không có kết quả hợp, video bị chặn/cần đăng nhập,
  lỗi mạng…) hoặc đặt `dl: false` → **vẫn nền đen ghi "VIDEO TRÁM #nn + nội dung cần tìm"** như cũ để người dùng tự tìm.
  Không lách chặn (không cookie, đăng nhập, proxy, giả trình duyệt).
- **Ảnh minh hoạ: thử tải trên mạng** (ưu tiên ảnh nền trong suốt, ảnh sản phẩm từ web chính hãng). Không tải được thì dùng
  ảnh giữ chỗ vòng tròn trắng + tên ảnh, vẫn có hiệu ứng bật lên như thường. Không lách chặn (giả User-Agent, giải CAPTCHA…).
- **Ảnh xuất hiện: ưu tiên hoạt ảnh có sẵn của CapCut, chọn trong tab Yêu thích (đánh sao)**, đổi kiểu linh hoạt giữa các ảnh.
  Chỉ thỉnh thoảng (~1/4–1/3 số ảnh) dùng keyframe phóng to, và keyframe luôn dùng đường cong **"Nảy ra"**
  (Biến đổi → biểu đồ keyframe → Hiển thị tất cả cài đặt sẵn → Nảy ra; builder tự đặt).
- **Chữ chỉ 3 màu**: đỏ #EC1D1D viền trắng (R), trắng viền đen (W), vàng #F6C90F viền đen (Y). Không dùng màu nào khác.
- **Câu trộn chữ thường + VIẾT HOA thì tô 2 màu**: phần thường trắng viền đen, phần HOA vàng viền đen (hoặc đảo lại).
  Ví dụ "Hôm sau MẶT HƠI SƯNG" → "Hôm sau" trắng + "MẶT HƠI SƯNG" vàng. Trong plan viết `mix: "…"`.
- **Có SFX, không nhạc nền.**
- Không sửa phụ đề và vị trí nhân vật người dùng đã làm.

## Cần có
- Node.js, ffmpeg + ffprobe trong PATH (đã cài qua winget). Font `SVN-Gilroy Heavy.otf` trong font người dùng.
- yt-dlp (đã cài qua winget: `winget install --id yt-dlp.yt-dlp -e`; cập nhật: `winget upgrade yt-dlp.yt-dlp` khi YouTube đổi
  và tải lỗi hàng loạt). Script tự tìm yt-dlp cả khi PATH chưa nhận, và dùng Node làm JS runtime cho YouTube.
- `assets/templates.json` (mẫu + danh mục SFX/hoạt ảnh). Nếu thiếu hoặc cần SFX/hoạt ảnh mới: `node scripts/extract_templates.js`.
- `assets/favorites.json` (hoạt ảnh tab Yêu thích + mọi hoạt ảnh đã tải về máy): tạo/cập nhật bằng `node scripts/capcut_favorites.js`
  (cần Node ≥ 22.5; chỉ đọc dữ liệu CapCut, chạy được cả khi CapCut đang mở).
- Thư mục làm việc dạng `<thư mục kênh>\<số tập>\Claude edit\` gồm `Kịch bản.docx`, `Video Thô/`, `Ảnh/`.
- Project CapCut (thường tên "ANPG <số>") đã có: clip nhân vật cắt thô trên 1 track, đã xóa nền, đặt góc dưới trái; 1 track phụ đề.

## Quy trình

### 1. Xác định project và thư mục
Hỏi nếu người dùng chưa nói rõ tên project CapCut hoặc thư mục làm việc. Chuyển phiên vào thư mục làm việc (change_directory).
Các script nằm trong thư mục skill này: `~/.claude/skills/edit-video-anpg/scripts/` — gọi bằng đường dẫn tuyệt đối.

### 2. Đọc tư liệu
```bash
node "<skill>/scripts/inspect_project.js" "ANPG 6" "<thư mục làm việc>"
```
Script in ra clip nhân vật, kiểu phụ đề, tư liệu trong các thư mục, và ghi `_tools/transcript_<project>.txt`
(mỗi dòng phụ đề kèm `từ@giây`) + `_tools/kich_ban.txt`. Đọc cả hai. Xem nhanh các ảnh trong `Ảnh/` (Read ảnh) để biết có gì dùng được.
Nếu project không đúng dạng (nhiều track video, chưa có phụ đề, chưa xóa nền) thì dừng và hỏi người dùng.

Lấy danh sách hoạt ảnh Yêu thích mới nhất (mỗi video chạy 1 lần):
```bash
node "<skill>/scripts/capcut_favorites.js"
```
Chỉ dùng các tên có ✓ trong nhóm "Ảnh/clip — Vào" cho ảnh. Tên có ✗ là chưa tải về máy → không dùng (hoặc nhờ người dùng bấm thử 1 lần trong CapCut).

### 3. Lên kế hoạch dựng
Viết `_tools/plan_<project>.js` theo `references/plan-format.md`. Cách nghĩ:
- Chia video theo kịch bản: hook (cắt nhanh, có 1 từ khoá lớn + làm mờ nền ở giây 3–10), câu hỏi/mở đề, từng chương, tóm tắt, sản phẩm/CTA, kết.
- Track chính liên tục 0 → hết: video trám cho câu kể chuyện/ví von; slide xám (`nen`) cho giải thích có hình, danh sách, sản phẩm.
- Mốc thời gian lấy đúng từ `từ@giây` trong transcript: chữ/ảnh xuất hiện đúng lúc nhân vật nói từ đó.
- Mô tả video trám cụ thể đến mức người dùng tìm được ngay (cảnh gì, ai làm gì), 1–3 dòng ngắn, ngắt bằng `\n`.
  Kèm từ khoá tải `{ q: "..." }`: **tiếng Anh**, tả cảnh nhìn thấy được + "stock footage" (vd `"man flexing muscles in gym mirror stock footage"`).
  Đã biết clip hợp → `{ url: "https://..." }`. Cảnh phải tự ghép (chia đôi màn hình, trước/sau), meme cụ thể, cảnh từ phim → `{ dl: false }`.
- Chữ: chỉ từ khoá, con số, danh sách, câu chốt. Kiểm tra vùng an toàn và không chồng vị trí (xem style-guide).
  Chỉ kiểu R/W/Y. Câu chú thích nên viết trộn thường + VIẾT HOA cụm nhấn mạnh và khai báo bằng `mix` (2 màu trắng/vàng);
  dòng VIẾT HOA cả dòng (tiêu đề, từ khoá lớn) thì 1 màu.
- Ảnh: đa số gắn `anim` = tên hoạt ảnh Yêu thích (đổi kiểu theo nội dung, xem gợi ý trong style-guide); số ít bỏ `anim`
  để dùng keyframe Nảy ra (nhất là ảnh cần `grow`).
- SFX đúng khung hình xuất hiện của chữ/ảnh, theo bảng trong style-guide; tên SFX phải khớp chính xác danh mục.

### 4. Tải video trám (yt-dlp)
Chạy nền (`run_in_background`, ~2–4 phút cho 25–30 đoạn) rồi làm bước 5 trong lúc chờ:
```bash
node "<skill>/scripts/fetch_tram.js" "<work>/_tools/plan_<project>.js"
```
Mỗi dòng `tram` → `<work>/Video trám (tải về)/tram_nn_*.mp4` (đúng độ dài đoạn + 1s, 1080×1920, 30fps, không tiếng), ghi kết quả vào
`_tools/tram_<project>.json` (builder đọc) và lưới khung hình `_tools/tram_preview_<project>.jpg`. Chạy lại chỉ tải đoạn mới/đổi
(đổi `q`/`url`/`start` hoặc đổi mốc làm đoạn dài hơn); đoạn đã có thì dùng lại.
**Soát bằng mắt**: Read ảnh `tram_preview_<project>.jpg`. Ô nào sai cảnh, là người ngồi nói chuyện, ảnh tĩnh/chữ đầy màn hình,
có watermark/logo to → sửa `q` (cụ thể hơn), hoặc thêm `start` (giây khác trong video nguồn), hoặc `url`, hoặc `dl: false`, rồi:
```bash
node "<skill>/scripts/fetch_tram.js" "<work>/_tools/plan_<project>.js" --only 5,7,12   # chỉ tải lại các số này, chọn video khác lần trước
```
Tối đa 2–3 vòng; đoạn vẫn không ổn thì `dl: false` (nền đen) để người dùng tự tìm. Ô "NEN DEN" = không tải được / `dl: false`.

### 5. Ảnh minh hoạ
Liệt kê ảnh cần (vật/món ăn/sản phẩm). Với sản phẩm: thử web chính hãng (Shopify `.../products/<handle>.json`).
Tải vào thư mục tạm có đường dẫn ASCII rồi copy vào `<work>/Ảnh/` (curl lỗi với đường dẫn có dấu).
Kiểm tra `ffprobe` thấy `rgba` (có nền trong) và xem ảnh trước khi dùng. Ảnh không lấy được → `ph: "<tên>"` trong plan.

### 6. Chạy thử
```bash
node "<skill>/scripts/capcut_builder.js" "<work>/_tools/plan_<project>.js" --dry
```
Lần đầu tự sao lưu project gốc vào `<work>/_backup/` (CapCut phải tắt lúc này). Đoạn trám đã tải → đặt video;
đoạn chưa có → tạo ảnh nền đen trong `Video trám (thay thế)/`. Tạo ảnh giữ chỗ trong `Ảnh/giu-cho/`, và `DANH_SACH_CAN_BO_SUNG - <project>.md`.
Dòng "Video trám: N (tải về X · nền đen Y)" cho biết đã ghép bao nhiêu video. Sửa plan cho tới khi không còn lỗi và không còn
cảnh báo ⚠ (ảnh dùng keyframe quá nhiều, câu trộn hoa/thường chỉ 1 màu, video trám cần chạy lại `fetch_tram.js` vì plan đổi mốc/nội dung).
Xem dòng "Ảnh: …" để chắc các hoạt ảnh được đổi kiểu linh hoạt. Xem thử 1–2 ảnh giữ chỗ vừa tạo (chữ tiếng Việt hiển thị đúng).

### 7. Ghi vào project
Đảm bảo CapCut đã tắt hẳn (`tasklist | grep -i capcut` rỗng; nếu còn, nhờ người dùng tắt). Rồi chạy lại lệnh trên **không** có `--dry`.
Builder luôn dựng lại từ bản sao lưu gốc, nên sửa plan và chạy lại bao nhiêu lần cũng được.
Lưu ý: nếu người dùng đã mở project và tự sửa sau lần ghi trước, chạy lại sẽ xoá phần họ sửa → hỏi trước.

### 8. Kiểm tra trong CapCut (nên làm)
Dùng computer use: xin quyền "CapCut" và "capcut.exe" (thêm "File Explorer" nếu cần bấm taskbar), mở project, dùng phím → để đi
tới 3–5 thời điểm có chữ to/ảnh/slide/video trám và nhìn khung xem trước. Xong thì đóng project rồi đóng hẳn cửa sổ CapCut.
Nếu chỉnh plan sau khi kiểm tra, phải đóng hẳn CapCut trước khi ghi lại.

### 9. Báo cáo cho người dùng
Ngắn gọn: đã thêm gì (số video trám — bao nhiêu tải được / bao nhiêu nền đen, chữ, ảnh, SFX, chỗ làm mờ), ảnh nào tải được /
ảnh nào là giữ chỗ, ảnh dùng hoạt ảnh Yêu thích nào / bao nhiêu ảnh dùng keyframe Nảy ra, đã kiểm tra trong CapCut chưa,
và trỏ tới `DANH_SACH_CAN_BO_SUNG - <project>.md` (bảng video trám còn thiếu + bảng video đã tải kèm link nguồn). Nhắc:
- Video trám tải tự động là bản nháp: lướt lại từng đoạn, đoạn nào chưa hợp thì thay. Clip lấy từ YouTube → kiểm tra quyền sử dụng
  trước khi đăng (ưu tiên giữ các clip ghi "free / no copyright").
- Thay đoạn nền đen/video trám/ảnh giữ chỗ: chuột phải → Thay thế (giữ vị trí, thời lượng, hiệu ứng).
- Âm lượng: SFX đang cân với giọng thô; nếu bấm "Chuẩn hóa âm lượng" cho giọng thì tăng SFX ~+5 dB.
- Bản gốc nằm ở `_backup/` nếu cần quay lại.
