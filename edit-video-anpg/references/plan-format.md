# Định dạng file kế hoạch (plan_<project>.js)

Đặt ở `<thư mục làm việc>/_tools/plan_<project>.js`. Là một module Node xuất ra 1 object. Mọi thời gian tính bằng **giây trên timeline**
(lấy từ `transcript_<project>.txt`: mỗi từ có dạng `từ@giây`). Ví dụ đầy đủ: `assets/plan_example_ANPG5.js`.

```js
module.exports = {
  project: "ANPG 6",              // tên project trong CapCut (đúng chữ hoa/thường, dấu cách)
  // work: "D:/.../6/Claude edit", // tuỳ chọn; mặc định = thư mục cha của _tools
  // nen: "D:/.../nền.png",        // tuỳ chọn; mặc định nền xám của kênh
  sfxTargetLufs: -27.5,           // độ lớn SFX; giọng thô ~ -17.5 LUFS

  // Track chính: liên tục từ 0 đến hết video. Mỗi dòng [giây bắt đầu, loại, nội dung]; đoạn kéo dài tới dòng sau.
  // "tram" = video trám: scripts/fetch_tram.js tải theo phần {…} cuối dòng; không tải được / dl: false → nền đen ghi
  //          "VIDEO TRÁM #nn" + nội dung (mô tả này cũng là chữ hiện trên nền đen, nên luôn viết tiếng Việt, cụ thể).
  //   q     = từ khoá tìm YouTube, tiếng Anh, cảnh nhìn thấy được + "stock footage" (thiếu q thì tìm bằng chính mô tả)
  //   url   = link video cụ thể (bỏ qua tìm kiếm) · start = giây bắt đầu cắt trong video nguồn · dl: false = không tải
  main: [
    [0.00, "tram", "Đồ ăn nhanh:\nburger, gà rán", { q: "burger fried chicken fast food stock footage" }],
    [2.10, "tram", "Bench Press\n(đẩy ngực)", { url: "https://www.youtube.com/watch?v=...", start: 12 }],
    [3.40, "tram", "So sánh trước / sau\n(chia đôi màn hình)", { dl: false }],   // cảnh phải tự ghép → để nền đen
    [5.47, "nen"],                                      // slide xám nền.png
    [9.10, "file", "Video trám/clip_co_san.png"],       // (hiếm) ảnh có sẵn làm nền, đường dẫn tương đối theo work
  ],

  // Ảnh chồng lớp. file = ảnh thật (tương đối theo work hoặc tuyệt đối); ph = tạo ảnh giữ chỗ vòng tròn trắng
  // anim = tên hoạt ảnh Vào của CapCut — ƯU TIÊN tên trong tab Yêu thích (xem `node scripts/capcut_favorites.js`, chỉ dùng tên có ✓).
  //        Tên tắt: morong (Mở rộng kiểu kỳ lạ) | phongto (Phóng to) | thuphong (Thu phóng 1) | lac (Lắc mạnh chiều dọc) | truot (Trượt sang trái)
  //        animDur tuỳ chọn (mặc định = độ dài gốc của hoạt ảnh).
  // Không có anim → keyframe phóng to 15% → s trong 0,5s, đường cong "Nảy ra" (chỉ dùng cho ~1/4–1/3 số ảnh).
  images: [
    { t0: 24.33, t1: 27.77, file: "Ảnh/creatine.png", x: 0, y: 0.10, s: 0.70, anim: "Phóng to" },             // hoạt ảnh Yêu thích
    { t0: 30.67, t1: 35.20, ph: "Quả bóng bay", x: 0, y: 0.25, s: 0.38, anim: "Mở rộng kiểu kỳ lạ", animDur: 0.6 },
    { t0: 38.47, t1: 44.19, ph: "Quả bóng bay", x: 0, y: 0.25, s: 0.38, grow: [0.52, 41.46] },               // keyframe Nảy ra rồi phồng tới 0.52 lúc 41.46s
    // tuỳ chọn khác: out: "mo" (Mờ dần) | "truot" | tên hoạt ảnh Ra; outDur; flyOut: true (bay vọt lên khỏi khung 0,7s cuối);
    //                pop: false (hiện thẳng, không hoạt ảnh)
  ],

  // Chữ — CHỈ 3 kiểu: R = đỏ #EC1D1D viền trắng | W = trắng viền đen | Y = vàng #F6C90F viền đen (kiểu khác → builder báo lỗi)
  // runs = các phần chữ [kiểu, cỡ, "nội dung"]; nhiều phần = rich text (khác màu/cỡ trong 1 ô chữ)
  // mix  = câu trộn chữ thường + VIẾT HOA → builder tự tô thường = W, HOA = Y (flip: true để đảo); size tuỳ chọn (mặc định 15)
  texts: [
    { t0: 8.95, t1: 10.67, runs: [["R", 15, "TÍCH NƯỚC\nỞ MẶT?"]], y: 0.30, s: 1.2, anim: "dam" },
    { t0: 25.24, t1: 27.77, runs: [["Y", 14, "GIẢI THÍCH HIỆN TƯỢNG\n"], ["R", 18, "& TÁC DỤNG CỦA CREATINE"]], y: 0.52, s: 0.62, anim: "song", animDur: 0.9 },
    { t0: 68.14, t1: 74.00, mix: "→ Hôm sau MẶT HƠI SƯNG", y: 0.02, s: 0.60, anim: "truot" },  // "→ Hôm sau " trắng + "MẶT HƠI SƯNG" vàng
    { t0: 79.80, t1: 83.07, mix: "Chưa có BẰNG CHỨNG", flip: true, y: 0.45, s: 0.70, anim: "truot" }, // đảo: "Chưa có " vàng + "BẰNG CHỨNG" trắng
    { t0: 107.42, t1: 112.23, runs: [["Y", 15, "ATP"]], y: 0.40, s: 1.6, pop: true },   // pop = tỉ lệ 10% → s trong 0,47s, đường cong Nảy ra
    { t0: 115.31, t1: 121.30, runs: [["R", 15, "→ PHOSPHOCREATINE"]], x: 0.25, y: 0.45, s: 0.55, anim: "truot" },
    // anim: song | truot | dam | thunho | tuyet | ro | tên hoạt ảnh chữ bất kỳ đã tải (bỏ trống = không hoạt ảnh); animDur tuỳ chọn
  ],

  // Làm mờ track chính [bắt đầu, kết thúc] — dùng khi từ khoá lớn đè lên video trám
  blurs: [[8.85, 10.67]],

  // SFX [giây, tên chính xác, (tuỳ chọn) chỉnh thêm dB]
  sfx: [
    [8.95, "Magic reveal"],
    [24.33, "Pop!(1479450)"],
    [173.23, "Fart", -3],
  ],
};
```

## Quy tắc builder tự áp dụng
- Đoạn chồng thời gian được chia sang nhiều track tự động (ảnh, chữ, SFX).
- Thứ tự lớp: nền (0) → làm mờ → ảnh (3,4…) → nhân vật (2, nằm dưới ảnh) → chữ (14001+) → phụ đề (14100, trên cùng).
- Nhân vật được chuyển từ track chính lên track chồng; phụ đề giữ nguyên.
- Mỗi lần chạy đều dựng lại từ bản sao lưu gốc → sửa plan rồi chạy lại là được, không bị nhân đôi.
- Video trám: đọc `_tools/tram_<project>.json` (do fetch_tram.js ghi). Đoạn có video đủ dài → material video (không tiếng);
  thiếu / ngắn hơn đoạn / plan đổi sau lần tải → nền đen + cảnh báo ⚠ "chạy lại fetch_tram.js". Khoá cache = mô tả + q/url + start,
  nên đổi mốc thời gian không làm tải lại (trừ khi đoạn dài hơn video đã cắt).
- Keyframe phóng to (ảnh không có `anim`, chữ có `pop`) tự gắn đường cong "Nảy ra" và ghi vào `keyframe_graph_list`.
- Cuối lần chạy in dòng "Ảnh: … hoạt ảnh CapCut … · keyframe Nảy ra …" và cảnh báo ⚠ nếu đa số ảnh dùng keyframe
  hoặc có câu trộn hoa/thường chỉ 1 màu → sửa plan cho hết cảnh báo.

## Kiểm tra nhanh trước khi chạy
- `main` tăng dần, bắt đầu từ 0.
- Mỗi chữ: t1 > t0, y trong vùng an toàn, không trùng vị trí với chữ khác cùng lúc.
- Tên SFX phải có trong `assets/templates.json`; tên hoạt ảnh phải có trong `templates.json` hoặc `favorites.json` và đã tải về máy
  (builder báo lỗi rõ nếu thiếu).
- Chữ chỉ dùng kiểu R/W/Y; câu nào vừa có chữ thường vừa có cụm VIẾT HOA thì viết bằng `mix`.
- Ảnh: đa số có `anim` (tên trong tab Yêu thích, đổi kiểu linh hoạt), số ít để keyframe Nảy ra.
