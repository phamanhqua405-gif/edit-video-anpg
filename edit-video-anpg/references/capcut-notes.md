# Ghi chú kỹ thuật CapCut PC (đọc khi builder báo lỗi hoặc CapCut mở project bị sai)

## Vị trí và file
- Project: `%LOCALAPPDATA%\CapCut\User Data\Projects\com.lveditor.draft\<tên project>\`
- Nội dung timeline nằm ở `draft_content.json` (JSON thường, không mã hoá ở CapCut 9.7). CapCut 9.x giữ **6 bản giống hệt**:
  `draft_content.json`, `.bak`, `template-2.tmp` ở thư mục gốc và trong `Timelines/<main_timeline_id>/` (id lấy ở `Timelines/project.json`).
  Builder ghi cả 6; ghi thiếu thì CapCut có thể mở bản cũ.
- **CapCut phải tắt hẳn** khi ghi (không chỉ đóng project — đóng cả cửa sổ trang chủ). CapCut tự lưu đè khi đóng project.
  Kiểm tra: `tasklist | grep -i capcut` không còn dòng nào.
- Khi mở project dựng bằng builder rồi đóng, CapCut lưu lại file (kích thước thay đổi) — đó là dấu hiệu nó đọc được bình thường.

## Cấu trúc
- Thời gian tính bằng micro giây (`target_timerange.start/duration`). Track chính (track video đầu tiên, flag 0) phải liền mạch từ 0.
- Track chồng: `flag: 2`; track phụ đề: `flag: 1`. Lớp hiển thị theo `render_index` của từng đoạn (số lớn nằm trên).
- Mỗi đoạn tham chiếu 1 material chính (`material_id`) + các material phụ (`extra_material_refs`: speeds, canvases, material_animations…).
  Builder clone đoạn mẫu trong `assets/templates.json` kèm các material phụ an toàn, đổi id mới.
- Chữ: `materials.texts[].content` là chuỗi JSON `{text, styles:[{fill, font{path}, strokes, size, range:[a,b]}]}`; range tính theo ký tự JS (chuẩn NFC).
- Keyframe: `common_keyframes[{property_type: "KFTypeScaleX" | "KFTypePositionX/Y" | "effects_adjust_blur", keyframe_list:[{time_offset(µs, tính từ đầu đoạn), values:[v]}]}]`.
  Với tỉ lệ đều (uniform_scale), chỉ cần KFTypeScaleX.
- Đường cong keyframe cài sẵn (Biến đổi → biểu đồ → Hiển thị tất cả cài đặt sẵn): 2 keyframe đều `curveType: "FreeCurveInOut"`;
  điểm đầu có `right_control {x: µs, y: Δgiá trị}` tính từ điểm đầu, điểm sau có `left_control` tính từ điểm sau và `graphID` = id
  một mục trong `keyframe_graph_list` (cấp gốc draft): `{id, resource_id, resource_name, source_platform: 1, graph_points: []}`.
  "Nảy ra" = resource 7418179396713845249, hình dạng cubic-bezier(0.17, 0.89, 0.32, 1.27) — ví dụ 0,5s: right_control.x = 85000,
  left_control.x = −340000, y = 0.89·Δ và 0.27·Δ. Đo từ ANPG 5 (người dùng tự áp ngày 25/11/2026).
- Hoạt ảnh Yêu thích: CapCut không lưu tab Yêu thích thành file (đồng bộ theo tài khoản). `capcut_favorites.js` gộp 2 nguồn:
  hoạt ảnh trong các project có `category_id` dạng `in_fav` / `out_fav` / `ruchang_fav`, và cờ `has_favorited` trong
  `Cache/ressdk_db/*/rp.db` (bảng `http_cache`, phản hồi danh mục hoạt ảnh — có tên, effect_id, md5). Mẫu hoạt ảnh dựng được khi
  thư mục `Cache/effect/<effect_id>/<md5>` tồn tại. CSDL được chép ra thư mục tạm rồi mở chỉ-đọc (dùng `node:sqlite`, Node ≥ 22.5).
- Hoạt ảnh: material `material_animations.animations[]` gồm resource_id + `path` tới cache `CapCut/User Data/Cache/effect/<id>/...`.
  Nếu cache bị xoá, hoạt ảnh/SFX không dùng được → dùng thử nó 1 lần trong CapCut (để CapCut tải lại) rồi chạy
  `capcut_favorites.js` (hoạt ảnh) hoặc `extract_templates.js` (SFX).
- SFX: material `audios` type "sound", file mp3 nằm ở `CapCut/User Data/Cache/music/`. Không thêm material loudness (cần mã file nội bộ),
  builder chỉnh âm lượng bằng `volume` (hệ số tuyến tính, tính từ độ lớn LUFS đo bằng ffmpeg).
- Xóa nền nhân vật lưu ở `matting.flag = 3` + thư mục `matting/` trong project → builder giữ nguyên, không chạy lại được ngoài CapCut.
- Giọng đã "Chuẩn hóa âm lượng"/"Tăng cường giọng nói" cần file do CapCut tính → builder không bật được; nhắc người dùng tự bật nếu muốn.

## Video trám tải bằng yt-dlp (scripts/fetch_tram.js)
- Material video giống hệt ảnh (cùng mảng `materials.videos`), chỉ khác `type: "video"`, `duration` (µs, độ dài thật của file),
  `has_audio`. `source_timerange.duration` không được vượt `duration` → file được cắt dư 1s so với đoạn.
- yt-dlp: tìm bằng `ytsearch20:<q> --flat-playlist --print …` (có sẵn độ dài), tải đúng đoạn cần bằng `--download-sections "*a-b"`
  (chỉ tải vài giây, không tải cả video), `--js-runtimes node` (YouTube cần JS runtime để giải mã; yt-dlp mặc định chỉ bật deno).
  Mã thoát 101 = dừng vì `--max-downloads`, không phải lỗi. Đặt `PYTHONIOENCODING=utf-8` để tiêu đề tiếng Việt không vỡ.
- Tải vào thư mục tạm ASCII rồi ffmpeg cắt khung ra thư mục làm việc (đường dẫn có dấu).
- winget cài yt-dlp xong thì PATH chỉ nhận ở shell mới; script tự tìm `%LOCALAPPDATA%\Microsoft\WinGet\Packages\yt-dlp.yt-dlp_*\yt-dlp.exe`.
- Thử nghiệm ANPG 5 (27/11/2026): 25/25 đoạn có `q` tải được trong ~2 phút. Kết quả xấu hay gặp: bản xem trước Videohive/Envato/
  Shutterstock có watermark (script đã loại), video "sound effect" chỉ là ảnh tĩnh, video giải thích dài → người nói chuyện (script hạ điểm).
  Vẫn phải soát lưới `tram_preview_<project>.jpg`.

## Lỗi đã gặp
- `curl -o` vào đường dẫn có dấu tiếng Việt từ Git Bash báo lỗi ghi file (code 23) → tải vào thư mục tạm ASCII rồi `cp`.
- Wikimedia trả trang lỗi cho tải tự động; KHÔNG giả User-Agent trình duyệt để lách (bị chặn và sai nguyên tắc).
- Trang tìm kiếm của TikTok bắt CAPTCHA → không tự giải; nếu cần link thì tìm qua công cụ tìm kiếm web.
- Khi kiểm tra bằng computer use: bấm thước thời gian bị hút vào mép đoạn gần nhất; dùng phím → để đi từng khung hình.
  Cửa sổ CapCut thuộc tiến trình `capcut.exe` (cần xin quyền cả "CapCut" và "capcut.exe"); nút đóng ở góc phải trên (≈ x 1364, y 18 trên màn 1389×868).
