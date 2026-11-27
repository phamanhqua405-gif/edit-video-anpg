# Quy chuẩn style kênh "Ăn ngủ gym" (ANPG)

Rút ra từ ANPG 1, 3, 22 (đã phân tích project CapCut gốc) và ANPG 5 (Claude dựng, người dùng duyệt "khá ổn" rồi tự chỉnh thêm).
Cập nhật 25/11/2026 theo yêu cầu người dùng: ảnh ưu tiên hoạt ảnh CapCut tab Yêu thích, keyframe dùng đường cong "Nảy ra",
chữ chỉ 3 màu, câu trộn hoa/thường tô 2 màu trắng/vàng.
Khung 1080×1920, 30fps, dài 1:20–3:00. Toạ độ CapCut: 0 là giữa khung, ±1 là mép; y dương là đi LÊN.
Đổi sang pixel tính từ mép trên: `px = 960 − y × 960`.

## Bố cục 4 lớp (dưới → trên)
1. **Track chính (nền)**: video trám full màn hình, hoặc slide xám `nền.png` (gradient sáng giữa, tối viền).
2. **Ảnh / ảnh chụp màn hình** chồng lớp, đặt ở nửa trên khung.
3. **Nhân vật** đã xóa nền, tỉ lệ 50%, góc dưới trái (≈ x −0.5, y −0.5…−0.57). Người dùng tự đặt sẵn.
4. **Chữ tiêu đề**, rồi **phụ đề** trên cùng.

Vùng an toàn để đặt chữ/ảnh: y từ −0.02 đến 0.65. Tránh y > 0.75 (UI TikTok phía trên), x > 0.75 (cột nút bên phải),
và vùng y < −0.1 (đầu nhân vật + phụ đề ở khoảng y −0.23…−0.32).

## Phụ đề (người dùng tự làm sẵn, KHÔNG sửa)
SVN-Gilroy Heavy, vàng chanh #F0FF00, viền đen mảnh 0.06, cỡ 10, tỉ lệ 110–120%, căn giữa, y −0.23…−0.32,
hoạt ảnh phụ đề "Chữ màu sắc" (hiện từng từ). Phụ đề tự động của CapCut có sẵn thời gian từng từ → dùng làm transcript.

## Chữ tiêu đề — chỉ 1 font SVN-Gilroy Heavy, CHỈ 3 màu
| Mã | Màu chữ | Viền | Dùng cho |
|---|---|---|---|
| R | đỏ #EC1D1D | trắng | tiêu đề mục/chương, từ khoá đập mạnh, kết luận (dòng VIẾT HOA cả dòng) |
| W | trắng #FFFFFF | đen | phần chữ thường trong câu trộn; câu hỏi, chú thích, danh sách |
| Y | vàng #F6C90F | đen | phần VIẾT HOA nhấn mạnh trong câu trộn; con số, điểm số |

**Không dùng màu chữ nào khác ngoài 3 kiểu trên** (quy tắc của người dùng). Đã bỏ: vàng chanh #F0FF00 (chỉ là màu phụ đề người dùng tự làm),
vàng viền trắng, mọi màu khác. Builder báo lỗi nếu plan dùng kiểu khác R/W/Y.

### Câu trộn chữ hoa + thường → 2 màu trong cùng 1 câu
Kiểu chủ đạo cho chú thích/giải thích: viết câu ngắn, phần thường + phần VIẾT HOA nhấn mạnh, mỗi phần một màu.
- Ví dụ "Hôm sau MẶT HƠI SƯNG": "Hôm sau" **trắng viền đen** + "MẶT HƠI SƯNG" **vàng viền đen**.
- Có thể đảo (phần thường vàng, phần HOA trắng) để đổi nhịp — nhưng trong 1 câu luôn đúng 2 màu trắng/vàng, không trộn đỏ vào.
- Thêm ví dụ: "Nước nằm BÊN TRONG quả bóng", "ATP hết → SẠC THÊM", "Thương hiệu UY TÍN", "Càng không làm MẶT BÉO RA".
- Trong plan viết `mix: "Hôm sau MẶT HƠI SƯNG"` (đảo màu: thêm `flip: true`); builder tự tách màu theo hoa/thường.
  Ký hiệu/số (→, =, "1.", "3–5") đi cùng từ đứng sau. Builder cảnh báo khi câu trộn hoa/thường mà chỉ có 1 màu.
- Dòng VIẾT HOA toàn bộ (tiêu đề, từ khoá lớn) thì 1 màu: thường là R, con số dùng Y.

Cỡ chữ gốc 15 (dòng nhỏ phía trên trong cụm 2 dòng: 14, từ chốt: 18). Kích thước chỉnh bằng tỉ lệ (s):
- tiêu đề mục / chương: s 0.7–0.8, y 0.62
- dòng danh sách: s 0.45–0.6, mỗi dòng cách nhau ~0.13 theo y
- từ khoá đập mạnh (kèm làm mờ nền): s 1.1–1.3, y 0.3
- con số lớn (ATP, "+1–2 SET", "3–5 GRAM"): s 1.0–1.6 + keyframe bật lên (pop, đường cong Nảy ra)
Câu dài: CapCut tự xuống dòng ở 82% bề ngang; muốn ngắt chủ động thì dùng "\n".
Ký tự "→" hiển thị được với Gilroy; tránh ✔ ✘ ≠ emoji (font không có).

## Hoạt ảnh chữ (vào)
| Mã | Tên CapCut | Dùng khi |
|---|---|---|
| song | Sóng dồn | tiêu đề chương, tiêu đề slide, câu mở video |
| truot | Trượt sang trái | dòng danh sách, chú thích, tên món/sản phẩm |
| dam | Đậm rực rỡ | từ khoá lớn trên nền mờ |
| thunho | Thu nhỏ 2 | câu "chốt" đập mạnh (chữ khổng lồ thu về chỗ) |
| tuyet | Ánh sáng tuyết mờ | chữ lấp lánh |
| ro | Rõ dần | nhãn phụ |
Không dùng hoạt ảnh ra cho chữ — chữ cắt thẳng khi hết đoạn. Chữ ngắn < 1,2s thì bỏ hoạt ảnh.

## Video trám (track chính)
- Đổi nền trung bình mỗi 4–6s; tính cả chữ/ảnh thì ~4s có một thay đổi hình. Đoạn mở đầu (hook) cắt nhanh 0,7–2,5s.
- Minh hoạ **sát nghĩa từng câu**: nói "trà sữa" → cảnh trà sữa; nói "đi khám" → phòng khám; ví von hài (NASA, phù thủy…) → cảnh phim tương ứng.
- Claude **tự tải video trám bằng yt-dlp** (scripts/fetch_tram.js): clip stock sát nghĩa câu nói, cắt khung dọc lấp đầy, không tiếng.
  Đoạn không tải được hoặc không tìm được cảnh hợp → **nền đen ghi chữ "VIDEO TRÁM #nn + nội dung cần tìm"** (mô tả cụ thể cảnh,
  1–3 dòng ngắn) để người dùng tự tìm. Tránh clip có watermark, người ngồi nói chuyện, ảnh tĩnh, chữ to đầy màn hình.
- Slide xám `nền.png` cho: câu hỏi mở đề, tiêu đề chương, giải thích có hình minh hoạ, danh sách tóm tắt, sản phẩm, liều dùng.
  Một slide dài 3–15s, phải luôn có chữ/ảnh xuất hiện dần để không "chết hình".
- Tỉ lệ thường thấy: ~25–30 đoạn video trám + 8–13 slide cho video ~3 phút.

## Ảnh minh hoạ
- Người dùng thích ảnh **nền trong suốt** (món ăn trên đĩa, sản phẩm, đồ vật), kiểu 1254×1254.
- Nguồn nên thử: ảnh sản phẩm từ web chính hãng (Shopify: `https://<shop>/products/<handle>.json` → danh sách ảnh; thêm `&width=1200`),
  ảnh trong thư mục `Ảnh/` của người dùng. Wikimedia chặn tải tự động — KHÔNG giả User-Agent để lách.
- Không tải được → ảnh giữ chỗ vòng tròn trắng + "ẢNH: <tên>" (builder tự tạo), người dùng thay sau bằng chuột phải → Thay thế.

### Ảnh xuất hiện thế nào (quy tắc người dùng)
1. **Ưu tiên hoạt ảnh Vào có sẵn của CapCut, chọn trong tab Yêu thích (mục đánh sao).** Lấy danh sách bằng
   `node scripts/capcut_favorites.js` (✓ = đã tải về máy, builder dùng được; ✗ = chưa tải, bỏ qua hoặc nhờ người dùng bấm thử 1 lần).
   Lúc viết (25/11/2026) các hoạt ảnh Yêu thích dùng được: **Mở rộng kiểu kỳ lạ, Phóng to, Thu phóng 1, Lắc mạnh chiều dọc, Trượt sang trái**
   (chưa tải: Trượt lên/xuống/sang phải, Hai lớp giấy, Click Open…). Chạy lại script để có danh sách mới nhất.
   Dùng **linh hoạt**, đổi kiểu giữa các ảnh, không lặp 1 kiểu cho cả video. Gợi ý:
   - Phóng to / Thu phóng 1 / Mở rộng kiểu kỳ lạ: vật, món ăn, sản phẩm hiện ra giữa khung.
   - Trượt sang trái (và các kiểu trượt khác khi đã tải): ảnh vào từ cạnh, bố cục 2 ảnh hoặc ảnh + cột chữ.
   - Lắc mạnh chiều dọc: chi tiết gây bất ngờ/cảnh báo (mặt sưng, đau, sai lầm).
2. **Thỉnh thoảng (khoảng 1/4–1/3 số ảnh) dùng keyframe phóng to** 15% → 100% trong 0,5s, và luôn đặt đường cong **"Nảy ra"**
   (trong CapCut: Biến đổi → biểu đồ keyframe → Hiển thị tất cả cài đặt sẵn → Nảy ra). Builder tự làm vậy cho ảnh không có `anim`.
   Dùng keyframe khi cần "phồng to" thêm (grow) để minh hoạ "tăng thể tích", hoặc để đổi nhịp sau vài ảnh dùng hoạt ảnh.
3. Hoạt ảnh Ra: thường không cần (ảnh cắt theo nền); chỉ thêm `out` khi ảnh rời đi giữa một slide còn tiếp tục.
- Bố cục hay dùng: 1 ảnh giữa (x 0, y 0.25, s ~0.38); 2 ảnh hàng trên (x ±0.42, y 0.32, s ~0.36); ảnh trái + cột chữ phải (ảnh x −0.45, chữ x 0.45).
- File có nhiều khoảng trống quanh vật (ví dụ creatine.png) cần tỉ lệ lớn hơn (0.55–0.7).

## Làm mờ nền
Khi có từ khoá lớn đè lên video trám: hiệu ứng "Mờ" trên track hiệu ứng, cường độ 0 → 50 trong 0,4s, chỉ làm mờ track chính
(nhân vật vẫn nét). Đặt đoạn mờ bắt đầu ~0,1s trước chữ. 3–5 lần mỗi video.

## Âm thanh
- **Không bao giờ thêm nhạc nền.** Chỉ giọng + SFX.
- Giọng thô thường ~ −17,5 LUFS, đỉnh sát 0 dB → không tăng giọng trong builder. SFX đặt thấp hơn giọng ~10 dB (`sfxTargetLufs: -27.5`).
  Nếu người dùng chuẩn hoá giọng lên −12 LUFS thì báo họ tăng SFX thêm ~5 dB.
- SFX đặt ĐÚNG khung hình chữ/ảnh xuất hiện; không gắn cho phụ đề. Mật độ ~1 SFX mỗi 5–8s (video giải thích nhiều chữ), ~1/12s (video ít chữ).

| Sự kiện | SFX (tên chính xác trong thư viện) |
|---|---|
| Câu mở / từ khoá lớn / câu chốt | Magic reveal |
| Mở chương, "TÓM LẠI", "NHỚ NHÉ" | Culin. It looks like a light bulb mark is on the head. |
| Con số, điểm số, câu kêu gọi cuối | Ding |
| Ảnh bật lên (keyframe Nảy ra, Phóng to, Thu phóng 1, Mở rộng kiểu kỳ lạ) | Pop!(1479450) |
| Ảnh trượt vào (Trượt sang trái…) | 【Pop motion 14-1】(71341) |
| Ảnh Lắc mạnh chiều dọc (cảnh báo, bất ngờ) | Damage hitting punch |
| Từng dòng danh sách / nhãn nhanh | Poyoi (jump, speech bubble, telop) |
| Tiêu đề danh sách, câu hỏi | 特殊效果55 |
| Chữ lấp lánh, khái niệm mới | Kirarin glitter star Glocken 2 |
| Tên app / thương hiệu | Follow/like notification ding |
| Món ăn dễ thương | Cute system Pyui, Pyrroline(1240318) |
| Câu đùa thô / "đi ra ngoài" | Fart |
| "đẹp keng", khen chốt | Bell ding |
Danh sách SFX đầy đủ hiện có: xem cuối output của `extract_templates.js` hoặc khoá `sfx` trong `assets/templates.json`.

## Lỗi cần tránh (đã gặp)
- Quá nhiều chữ: mỗi câu thoại không cần một dòng chữ. Chỉ ghi từ khoá, con số, danh sách, câu chốt.
- Chữ đè lên đầu nhân vật hoặc phụ đề (y < −0.05 ở nửa trái).
- Hai chữ cùng vị trí chồng thời gian — chữ sau phải bắt đầu đúng lúc chữ trước kết thúc.
- Câu trộn hoa/thường nhưng tô 1 màu (ANPG 5: "→ Hôm sau MẶT HƠI SƯNG" toàn trắng) → phải tách 2 màu trắng/vàng bằng `mix`.
- Dùng vàng chanh #F0FF00 hoặc vàng viền trắng cho chữ tiêu đề — không còn được dùng.
- Mọi ảnh đều bật lên bằng keyframe đường thẳng — nay ưu tiên hoạt ảnh Yêu thích, keyframe phải có đường cong Nảy ra.
