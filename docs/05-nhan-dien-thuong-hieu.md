# Nhận diện thương hiệu Vbread (đã chốt)

Chốt ngày 17/09/2026 bằng ChatGPT Plus (Codex), theo prompt trong `docs/04-prompt-nhan-dien-thuong-hieu.md`.

**Tài liệu và tài sản gốc nằm ở thư mục [`brand/`](../brand/):**

- `brand/vbread-brand-guideline.md` — tài liệu hướng dẫn đầy đủ: ý tưởng logo, quy tắc dùng, bảng màu, kiểu chữ, ứng dụng vật lý (xe, tạp dề, bao bì, namecard), quy tắc giao diện phần mềm, khối CSS variables.
- `brand/vbread-theme.css` — khối CSS variables sẵn dùng, dán thẳng vào Next.js ở GĐ-00.
- `brand/vbread-image-prompts.md` — các prompt đã dùng để tạo ảnh (để tạo thêm ảnh sau này nếu cần).
- `brand/logo/` — logo vector (`.svg`): bản ngang (có chữ), biểu tượng V riêng, app icon.
- `brand/icons/` — bộ icon PWA đầy đủ (favicon, 192/512, maskable, apple-touch-icon).
- `brand/mockups/` — ảnh minh họa ứng dụng lên xe thật và lên màn hình app.

## Tóm tắt nhanh

| Tên | Hex | Vai trò |
|---|---|---|
| Crust Red | `#C83B22` | Màu chủ đạo — chiếm 60–70% diện tích nhận diện |
| Pickle Green | `#2F6B45` | Trạng thái hoàn tất / đang hoạt động — 15–25% |
| Baguette Gold | `#F2B544` | Điểm nhấn nhỏ, trạng thái chờ — dưới 10% |
| Paper White | `#FFF8E8` | Nền sáng |
| Charcoal Ink | `#20201D` | Chữ |
| Night Cart | `#121816` | Nền dark mode |

Font: **Be Vietnam Pro** (tiêu đề) · **IBM Plex Sans** (nội dung) · **IBM Plex Mono** (số liệu, mã).
Tính cách: gần gũi · nhanh gọn · đáng tin.

## Đã áp dụng vào

Toàn bộ trang lộ trình trên GitHub Pages (`docs/index.html`, `vbread.html`, `nghiep-vu.html`, `khao-sat.html`) đã dùng đúng bảng màu, font và logo thật này kể từ hôm nay — xem `docs/assets/site.css`.

## Còn thiếu

- Chưa in thử màu lên vật liệu thật (bảng hiệu, túi giấy) để kiểm tra độ rõ dưới nắng.
- Chưa dựng app Next.js nên chưa gắn `brand/vbread-theme.css` vào `tailwind.config` thật — sẽ làm ở GĐ-00.
