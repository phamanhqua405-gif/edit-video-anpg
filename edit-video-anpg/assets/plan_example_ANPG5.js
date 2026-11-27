// Kế hoạch dựng ANPG 5 (creatine & tích nước). Thời gian tính bằng giây trên timeline CapCut.
// Kiểu chữ (CHỈ 3 kiểu): R = đỏ #EC1D1D viền trắng, W = trắng viền đen, Y = vàng #F6C90F viền đen.
// mix = câu trộn chữ thường + VIẾT HOA → thường trắng (W), HOA vàng (Y); flip: true để đảo.
// Hoạt ảnh chữ: song = Sóng dồn, truot = Trượt sang trái, dam = Đậm rực rỡ, thunho = Thu nhỏ 2, ro = Rõ dần.
// Ảnh: anim = hoạt ảnh Vào trong tab Yêu thích của CapCut (đổi kiểu linh hoạt); không có anim = keyframe phóng to + đường cong Nảy ra.

module.exports = {
  project: "ANPG 5",
  sfxTargetLufs: -27.5, // giọng thô ~ -17.5 LUFS -> SFX thấp hơn ~10 dB

  // Track chính (nền): mỗi dòng [bắt đầu, loại, mô tả, {tuỳ chọn tải}]. "nen" = slide xám nền.png
  // "tram" = video trám: fetch_tram.js tự tải từ YouTube theo q (tiếng Anh, cảnh cụ thể + "stock footage");
  //          không tải được hoặc dl: false → nền đen ghi "VIDEO TRÁM #nn" + mô tả (người dùng tự tìm).
  main: [
    [0.00, "tram", "Đồ ăn nhanh:\nburger, gà rán,\nkhoai chiên", { q: "burger fried chicken french fries fast food stock footage" }],
    [1.34, "tram", "Trà sữa", { q: "bubble milk tea boba stock footage" }],
    [2.34, "tram", "Đồ nướng", { q: "korean bbq grilling meat stock footage" }],
    [3.02, "tram", "Lẩu, ăn uống thả ga\n(cả năm cả tháng)", { q: "friends eating hot pot stock footage" }],
    [5.47, "tram", "Cầm lọ creatine,\nxúc 1 muỗng pha uống", { q: "scooping creatine powder into water b-roll" }],
    [8.23, "tram", "Soi gương sờ mặt,\nmặt hơi sưng / tròn ra", { q: "man looking in mirror touching face stock footage" }],
    [13.60, "tram", "Meme cười lăn lộn", { q: "man laughing hysterically stock footage" }],
    [14.97, "tram", "Người mới tập gym\ngãi đầu, bối rối", { q: "confused man in gym scratching head stock footage" }],
    [17.37, "nen"],
    [20.97, "tram", "Phòng gym,\nanh em người mới tập", { q: "beginners working out in gym stock footage" }],
    [24.33, "nen"],
    [27.77, "nen"],
    [35.20, "tram", "Pha creatine vào\nbình lắc rồi uống", { q: "mixing supplement powder shaker bottle drinking stock footage" }],
    [38.47, "nen"],
    [44.19, "tram", "Meme mặt sưng,\n\"tích nước mặt\"", { dl: false }], // meme cụ thể → để người dùng tự chọn
    [47.20, "nen"],
    [57.43, "tram", "Mặt sưng phù:\nmí mắt, hai bên má", { q: "puffy swollen face eyes close up stock footage" }],
    [63.47, "nen"],
    [74.00, "tram", "So sánh 2 hiện tượng\n(chia đôi màn hình\ntrước / sau)", { dl: false }], // cảnh phải tự ghép → không tải
    [76.17, "tram", "Cơ bắp căng mọng,\ngồng tay (pump)", { q: "bodybuilder flexing biceps pump stock footage" }],
    [78.60, "tram", "Người lo lắng\nsờ mặt / sờ bụng\n(sợ béo)", { q: "worried man touching belly fat stock footage" }],
    [83.07, "tram", "Cơ căng mọng nước\nsau buổi tập", { q: "muscle pump after workout stock footage" }],
    [86.80, "tram", "Gồng cơ trước gương,\ntrông vâm, nở nang", { q: "man flexing muscles in gym mirror stock footage" }],
    [92.63, "nen"],
    [100.33, "tram", "Bench Press\n(đẩy ngực)", { q: "bench press gym stock footage" }],
    [106.30, "nen"],
    [112.23, "nen"],
    [121.30, "tram", "Uống creatine\nđều đặn mỗi ngày", { q: "drinking supplement shake morning stock footage" }],
    [126.57, "tram", "Tập nặng,\ngắng thêm set cuối", { q: "heavy lifting last rep struggle gym stock footage" }],
    [130.03, "tram", "Thể thao cường độ cao\nlặp lại (sprint, HIIT)", { q: "sprint interval training HIIT stock footage" }],
    [133.32, "tram", "Tập gym", { q: "gym weight training stock footage" }],
    [134.39, "tram", "Chạy bộ", { q: "running jogging outdoor stock footage" }],
    [135.07, "tram", "Boxing", { q: "boxing training punching bag stock footage" }],
    [136.47, "nen"],
    [149.10, "tram", "Kệ thực phẩm bổ sung,\nngười mới chọn creatine", { q: "supplement store shelves shopping stock footage" }],
    [152.63, "nen"],
    [162.60, "nen"],
    [168.00, "tram", "Xúc nhiều muỗng creatine\n(loading 20g)", { q: "scooping creatine powder stock footage" }],
    [173.99, "nen"],
    [180.54, "tram", "Đi khám bác sĩ\n(phòng khám)", { q: "doctor consultation clinic stock footage" }],
  ],

  // Ảnh: file = ảnh thật; ph = ảnh giữ chỗ (vòng tròn trắng + chữ) để thay sau.
  // 7/10 ảnh dùng hoạt ảnh Yêu thích, 3/10 dùng keyframe Nảy ra (ảnh phồng to + 2 ảnh đổi nhịp).
  images: [
    { t0: 24.33, t1: 27.77, file: "Ảnh/creatine.png", x: 0, y: 0.10, s: 0.70, anim: "Phóng to" },
    { t0: 30.67, t1: 35.20, ph: "Quả bóng bay", x: 0, y: 0.25, s: 0.38, anim: "Mở rộng kiểu kỳ lạ", animDur: 0.6 },
    { t0: 38.47, t1: 44.19, ph: "Quả bóng bay", x: 0, y: 0.25, s: 0.38, grow: [0.52, 41.46] }, // keyframe Nảy ra rồi phồng to
    { t0: 49.32, t1: 57.43, ph: "Quả bóng bay", x: 0, y: 0.25, s: 0.38, anim: "Thu phóng 1" },
    { t0: 64.47, t1: 74.00, ph: "Nồi lẩu thái", x: -0.42, y: 0.32, s: 0.36, anim: "Trượt sang trái" },
    { t0: 66.94, t1: 74.00, ph: "Cốc mì tôm", x: 0.42, y: 0.32, s: 0.36 }, // keyframe Nảy ra
    { t0: 112.95, t1: 121.30, file: "Ảnh/creatine.png", x: -0.42, y: 0.45, s: 0.55, anim: "Phóng to" },
    { t0: 117.39, t1: 121.30, ph: "Cục sạc dự phòng", x: -0.42, y: 0.12, s: 0.30 }, // keyframe Nảy ra
    { t0: 152.75, t1: 162.60, file: "Ảnh/nutrabio_creatine_monohydrate.png", x: -0.45, y: 0.30, s: 0.50, anim: "Mở rộng kiểu kỳ lạ" },
    { t0: 165.65, t1: 168.00, file: "Ảnh/creatine.png", x: -0.10, y: 0.05, s: 0.55, anim: "Thu phóng 1" },
  ],

  // Chữ: runs = [[kiểu, cỡ, "nội dung"], ...]
  texts: [
    { t0: 8.95, t1: 10.67, runs: [["R", 15, "TÍCH NƯỚC\nỞ MẶT?"]], y: 0.30, s: 1.20, anim: "dam" },
    { t0: 17.37, t1: 20.97, runs: [["W", 15, "Phân biệt được không?"]], y: 0.62, s: 0.55, anim: "truot" },
    { t0: 18.27, t1: 20.97, runs: [["R", 15, "TÍCH NƯỚC DƯỚI DA"]], y: 0.45, s: 0.80, anim: "song" },
    { t0: 19.51, t1: 20.97, runs: [["R", 15, "TÍCH NƯỚC TRONG CƠ"]], y: 0.27, s: 0.80, anim: "song" },
    { t0: 21.63, t1: 24.33, runs: [["W", 15, "SERIES: ĐƠN GIẢN HÓA\nMỌI THỨ TRONG GYM"]], y: 0.45, s: 0.60, anim: "truot" },
    { t0: 25.24, t1: 27.77, runs: [["Y", 14, "GIẢI THÍCH HIỆN TƯỢNG TÍCH NƯỚC\n"], ["R", 18, "& TÁC DỤNG CỦA CREATINE"]], y: 0.52, s: 0.62, anim: "song", animDur: 0.9 },

    { t0: 27.77, t1: 35.20, runs: [["R", 15, "1. TÍCH NƯỚC TRONG CƠ"]], y: 0.62, s: 0.70, anim: "song" },
    { t0: 31.77, t1: 34.31, mix: "Nước nằm BÊN TRONG quả bóng", y: -0.02, s: 0.55, anim: "truot" },
    { t0: 34.31, t1: 35.20, mix: "Vỏ bóng = MÀNG TẾ BÀO", y: -0.02, s: 0.55, anim: "truot" },
    { t0: 38.47, t1: 44.19, runs: [["R", 15, "1. TÍCH NƯỚC TRONG CƠ"]], y: 0.62, s: 0.70 },
    { t0: 39.07, t1: 42.66, mix: "Nước bên trong TĂNG → bóng CĂNG", y: -0.02, s: 0.55, anim: "truot" },
    { t0: 42.66, t1: 44.19, runs: [["R", 15, "= TĂNG NƯỚC NỘI BÀO"]], y: -0.02, s: 0.75, anim: "dam" },
    { t0: 46.07, t1: 47.20, runs: [["W", 15, "\"Tích nước mặt\"?"]], y: 0.35, s: 0.80, anim: "truot" },

    { t0: 47.20, t1: 57.43, runs: [["R", 15, "2. TÍCH NƯỚC DƯỚI DA"]], y: 0.62, s: 0.70, anim: "song" },
    { t0: 51.87, t1: 53.27, mix: "Nước tụ XUNG QUANH quả bóng", y: -0.02, s: 0.55, anim: "truot" },
    { t0: 53.27, t1: 54.77, mix: "nằm DƯỚI LỚP DA", y: -0.02, s: 0.60, anim: "truot" },
    { t0: 54.77, t1: 57.43, runs: [["Y", 15, "(khoảng gian bào của mô dưới da)"]], y: -0.02, s: 0.50, anim: "truot" },

    { t0: 68.14, t1: 74.00, mix: "→ Hôm sau MẶT HƠI SƯNG", y: 0.02, s: 0.60, anim: "truot" },
    { t0: 72.50, t1: 74.00, runs: [["R", 15, "NHIỀU MUỐI → GIỮ NƯỚC"]], y: 0.62, s: 0.70, anim: "song" },
    { t0: 74.44, t1: 76.17, runs: [["R", 15, "KHÁC NHAU\nHOÀN TOÀN"]], y: 0.30, s: 1.20, anim: "dam" },
    { t0: 77.17, t1: 78.60, mix: "Creatine: tăng nước TRONG CƠ", y: 0.40, s: 0.65, anim: "truot" },
    { t0: 79.80, t1: 83.07, runs: [["Y", 15, "CHƯA CÓ BẰNG CHỨNG"]], y: 0.45, s: 0.70, anim: "truot" },
    { t0: 80.70, t1: 83.07, runs: [["W", 15, "làm tích nước mặt hay béo ra"]], y: 0.30, s: 0.60, anim: "truot" },
    { t0: 83.31, t1: 86.80, mix: "Chỉ để cơ CĂNG hơn thôi à?", flip: true, y: 0.40, s: 0.70, anim: "truot" },
    { t0: 90.35, t1: 92.63, runs: [["R", 15, "VÂM &\nNỞ NANG"]], y: 0.30, s: 1.20, anim: "thunho" },

    { t0: 94.42, t1: 100.33, mix: "Cái ĐÁNG TIỀN NHẤT", y: 0.50, s: 0.70, anim: "song" },
    { t0: 96.17, t1: 100.33, runs: [["R", 15, "HỖ TRỢ TÁI TẠO\nNĂNG LƯỢNG CHO CƠ BẮP"]], y: 0.25, s: 0.75, anim: "song" },
    { t0: 107.42, t1: 112.23, runs: [["Y", 15, "ATP"]], y: 0.40, s: 1.60, pop: true },
    { t0: 109.67, t1: 112.23, mix: "Có sẵn trong cơ RẤT ÍT", y: 0.10, s: 0.60, anim: "truot" },
    { t0: 111.23, t1: 112.23, mix: "→ phải TÁI TẠO LIÊN TỤC", y: -0.02, s: 0.60, anim: "truot" },
    { t0: 115.31, t1: 121.30, runs: [["R", 15, "→ PHOSPHOCREATINE"]], x: 0.25, y: 0.45, s: 0.55, anim: "truot" },
    { t0: 117.39, t1: 121.30, runs: [["W", 15, "= CỤC SẠC\nDỰ PHÒNG"]], x: 0.30, y: 0.12, s: 0.60, anim: "truot" },
    { t0: 119.06, t1: 121.30, mix: "ATP hết → SẠC THÊM", x: 0.30, y: -0.06, s: 0.50, anim: "truot" },
    { t0: 123.83, t1: 126.57, mix: "Uống ĐỀU ĐẶN\n→ creatine dự trữ trong cơ TĂNG", y: 0.40, s: 0.60, anim: "truot" },
    { t0: 128.50, t1: 130.03, runs: [["Y", 15, "+1–2 SET"]], y: 0.30, s: 1.40, pop: true },
    { t0: 130.79, t1: 133.32, mix: "Thể thao CƯỜNG ĐỘ CAO", y: 0.40, s: 0.70, anim: "truot" },
    { t0: 133.32, t1: 134.39, runs: [["W", 15, "GYM"]], y: 0.40, s: 0.90 },
    { t0: 134.39, t1: 135.07, runs: [["W", 15, "CHẠY BỘ"]], y: 0.40, s: 0.90 },
    { t0: 135.07, t1: 136.47, runs: [["W", 15, "BOXING"]], y: 0.40, s: 0.90 },

    { t0: 136.47, t1: 149.10, runs: [["R", 15, "TÓM LẠI"]], y: 0.62, s: 0.80, anim: "song" },
    { t0: 138.67, t1: 149.10, mix: "1. KHÔNG phải để cơ ngậm nước cho to", y: 0.45, s: 0.50, anim: "truot" },
    { t0: 143.59, t1: 149.10, mix: "2. Giúp TẬP TỐT HƠN", y: 0.32, s: 0.55, anim: "truot" },
    { t0: 145.43, t1: 149.10, mix: "3. → Hỗ trợ PHÁT TRIỂN CƠ BẮP", y: 0.19, s: 0.55, anim: "truot" },
    { t0: 147.65, t1: 149.10, runs: [["Y", 15, "Tăng nước chỉ là thay đổi nhỏ đi kèm"]], y: 0.05, s: 0.48, anim: "truot" },

    { t0: 152.75, t1: 162.60, runs: [["R", 15, "NUTRABIO\nCREATINE"]], x: 0.45, y: 0.55, s: 0.60, anim: "song" },
    { t0: 154.70, t1: 162.60, runs: [["Y", 15, "99,98% Creatine\nMonohydrate"]], x: 0.45, y: 0.36, s: 0.50, anim: "truot" },
    { t0: 157.66, t1: 162.60, mix: "Thương hiệu UY TÍN", x: 0.45, y: 0.22, s: 0.45, anim: "truot" },
    { t0: 158.74, t1: 162.60, mix: "Giá TẦM TRUNG", x: 0.45, y: 0.12, s: 0.45, anim: "truot" },
    { t0: 160.91, t1: 162.60, mix: "Chất lượng ỔN so với giá", x: 0.45, y: 0.02, s: 0.42, anim: "truot" },
    { t0: 164.04, t1: 168.00, runs: [["Y", 15, "3–5 GRAM / NGÀY"]], y: 0.45, s: 1.00, pop: true },
    { t0: 165.81, t1: 168.00, runs: [["R", 15, "= 1 MUỖNG"]], x: 0.50, y: 0.05, s: 0.70, anim: "truot" },
    { t0: 168.32, t1: 173.99, runs: [["W", 15, "Loading 20g creatine?"]], y: 0.45, s: 0.65, anim: "truot" },
    { t0: 171.23, t1: 173.99, runs: [["Y", 15, "Hấp thụ hết không?"]], y: 0.30, s: 0.65, anim: "truot" },

    { t0: 174.19, t1: 180.54, runs: [["R", 15, "NHỚ NHÉ"]], y: 0.62, s: 0.80, anim: "song" },
    { t0: 174.71, t1: 180.54, mix: "Tăng cân do NƯỚC TRONG CƠ", y: 0.45, s: 0.60, anim: "truot" },
    { t0: 177.91, t1: 180.54, runs: [["R", 15, "KHÔNG PHẢI TĂNG MỠ"]], y: 0.26, s: 0.80, anim: "thunho" },
    { t0: 179.30, t1: 180.54, mix: "càng không làm MẶT BÉO RA", y: 0.08, s: 0.55, anim: "truot" },
    { t0: 181.02, t1: 186.33, runs: [["W", 15, "Mặt sưng phù bất thường?"]], y: 0.45, s: 0.65, anim: "truot" },
    { t0: 183.19, t1: 186.33, runs: [["R", 15, "→ ĐI KHÁM BÁC SĨ"]], y: 0.28, s: 0.80, anim: "song" },
  ],

  // Làm mờ nền (hiệu ứng "Mờ", cường độ 0 → 50 trong 0,4s) khi chữ to xuất hiện
  blurs: [[8.85, 10.67], [74.00, 76.17], [90.20, 92.63], [128.40, 130.03]],

  // SFX: [thời điểm, tên trong thư viện CapCut]
  sfx: [
    [8.95, "Magic reveal"],
    [18.27, "Poyoi (jump, speech bubble, telop)"],
    [19.51, "Poyoi (jump, speech bubble, telop)"],
    [24.33, "Pop!(1479450)"],
    [25.24, "Magic reveal"],
    [27.77, "Culin. It looks like a light bulb mark is on the head."],
    [30.67, "Pop!(1479450)"],
    [38.47, "Pop!(1479450)"],
    [42.66, "Kirarin glitter star Glocken 2"],
    [47.20, "Culin. It looks like a light bulb mark is on the head."],
    [49.32, "Pop!(1479450)"],
    [64.47, "【Pop motion 14-1】(71341)"],
    [66.94, "Pop!(1479450)"],
    [74.44, "Magic reveal"],
    [90.35, "Bell ding"],
    [96.17, "Magic reveal"],
    [107.42, "Ding"],
    [112.95, "Pop!(1479450)"],
    [115.31, "Kirarin glitter star Glocken 2"],
    [117.39, "Pop!(1479450)"],
    [128.50, "Ding"],
    [133.32, "Poyoi (jump, speech bubble, telop)"],
    [134.39, "Poyoi (jump, speech bubble, telop)"],
    [135.07, "Poyoi (jump, speech bubble, telop)"],
    [136.47, "Culin. It looks like a light bulb mark is on the head."],
    [138.67, "Poyoi (jump, speech bubble, telop)"],
    [143.59, "Poyoi (jump, speech bubble, telop)"],
    [145.43, "Poyoi (jump, speech bubble, telop)"],
    [152.75, "Pop!(1479450)"],
    [154.70, "Poyoi (jump, speech bubble, telop)"],
    [157.66, "Poyoi (jump, speech bubble, telop)"],
    [158.74, "Poyoi (jump, speech bubble, telop)"],
    [160.91, "Poyoi (jump, speech bubble, telop)"],
    [164.04, "Ding"],
    [173.23, "Fart"],
    [174.19, "Culin. It looks like a light bulb mark is on the head."],
    [177.91, "Magic reveal"],
    [183.19, "Ding"],
  ],
};
