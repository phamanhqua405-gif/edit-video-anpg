# edit-video-anpg

Skill cho **Claude Code** để dựng video kênh *Ăn ngủ gym* (ANPG) trực tiếp vào project **CapCut PC**.
Người dùng chuẩn bị cắt thô, tách nền và phụ đề trong CapCut; Claude đọc kịch bản và lời thoại, lên kế hoạch dựng rồi ghi thẳng vào
file project: video trám, slide nền, chữ tiêu đề có hoạt ảnh, ảnh minh hoạ, làm mờ nền và hiệu ứng âm thanh (không nhạc nền).
Mở lại CapCut là thấy bản dựng và có thể tự sửa tay.

> Dùng nội bộ. Xem [LICENSE](LICENSE).

## Cấu trúc

```
edit-video-anpg/            ← thư mục skill (chép nguyên thư mục này vào ~/.claude/skills/)
├── SKILL.md                quy trình cho Claude
├── references/             style kênh, định dạng file kế hoạch, ghi chú kỹ thuật CapCut
├── scripts/                công cụ Node.js (đọc project, dựng, tải video trám, quét mẫu)
│   └── paths.js            mọi đường dẫn máy lấy từ %LOCALAPPDATA% / biến môi trường
└── assets/                 mẫu đoạn CapCut, danh mục SFX/hoạt ảnh, plan ví dụ, nen.png
tests/smoke-test.js         kiểm tra nhanh sau khi cài
```

## Yêu cầu

- Windows + CapCut PC (đã kiểm với bản 9.7) và Claude Code (Claude Desktop, chế độ Code, môi trường *This PC*).
- Node.js ≥ 22.5, FFmpeg + ffprobe trong `PATH` (`winget install Gyan.FFmpeg`).
- Font **SVN-Gilroy Heavy** cài cho người dùng hiện tại.
- Tuỳ chọn: `yt-dlp` để tự tải video trám.

## Cài đặt

```powershell
Copy-Item -Recurse .\edit-video-anpg "$env:USERPROFILE\.claude\skills\edit-video-anpg"
```

Lần đầu trên một máy mới, tạo lại danh mục mẫu từ thư viện CapCut của máy đó (cần có sẵn vài project đã dựng):

```powershell
node "$env:USERPROFILE\.claude\skills\edit-video-anpg\scripts\extract_templates.js" "ANPG 1" "ANPG 2" "ANPG 3"
node "$env:USERPROFILE\.claude\skills\edit-video-anpg\scripts\capcut_favorites.js"
```

Biến môi trường tuỳ chọn: `ANPG_NEN` = đường dẫn ảnh nền slide (mặc định `assets/nen.png`).

## Cách dùng

1. Tạo thư mục tập, ví dụ `...\6\Claude edit\` gồm `Kịch bản.docx`, `Video Thô/`, `Ảnh/`.
2. Trong CapCut tạo project (vd. `ANPG 6`): đưa video thô vào, cắt thô, tách nền nhân vật, chạy phụ đề tự động. **Tắt hẳn CapCut.**
3. Trong Claude Code gõ: `/edit-video-anpg ANPG 6, thư mục ...\6\Claude edit` (hoặc nói tự nhiên "dựng ANPG 6").
4. Mở CapCut xem bản dựng, góp ý để Claude sửa; thay video trám/ảnh giữ chỗ bằng chuột phải → **Thay thế**.

Project gốc luôn được sao lưu vào `<thư mục tập>/_backup/` trước lần ghi đầu tiên.

## Kiểm tra

```powershell
node tests/smoke-test.js                                  # cú pháp, assets, không còn đường dẫn máy
node tests/smoke-test.js --project "ANPG 5" --work "<thư mục tập>"   # thêm: đọc project thật + dựng thử (không ghi)
```

## Lưu ý

- Định dạng project CapCut không được công bố; bản CapCut mới có thể đổi cấu trúc. Luôn thử trên một tập ngắn sau khi cập nhật CapCut.
- `assets/templates.json` và `favorites.json` trỏ tới SFX/hoạt ảnh trong bộ đệm CapCut (`%LOCALAPPDATA%\CapCut\User Data\Cache`);
  chỉ dùng được trong CapCut, không trích ra dùng ngoài.
