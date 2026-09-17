# Prompt: thiết kế bộ nhận diện thương hiệu (dùng trên ChatGPT Plus)

Cách dùng: mở cuộc trò chuyện mới trên ChatGPT Plus, dán nguyên khối prompt bên dưới. Sau khi có 3 hướng phong cách, chọn 1 hướng rồi trả lời tiếp trong cùng cuộc trò chuyện để đi sâu.

Kết quả cuối (bảng màu mã hex + tên font + khối CSS variables) mang về đưa cho Claude Code để dán thẳng vào `tailwind.config` và `globals.css` của app — không cần diễn giải lại.

```
Bạn là giám đốc sáng tạo (creative director) chuyên thiết kế nhận diện thương hiệu cho ngành F&B / đồ ăn đường phố tại Việt Nam.

BỐI CẢNH DOANH NGHIỆP
- Tên chuỗi: Vbread (tên tạm, có thể đổi sau).
- Mô hình: chuỗi xe bánh mì lưu động (food cart), bán tại nhiều điểm bán khác nhau trong thành phố, tại Việt Nam.
- Sản phẩm cốt lõi: bánh mì Việt Nam (pate, chả, pate chả...), giá bình dân khoảng 20.000–30.000 ₫/ổ.
- Khách hàng mục tiêu: người đi đường, dân văn phòng, học sinh sinh viên — mua nhanh, ăn tại chỗ hoặc mang đi.
- Vận hành: mỗi xe có 1–2 nhân viên/ca, tối đa 2 ca/ngày; xe có thể đổi điểm bán theo ngày.
- Song song có 1 phần mềm quản lý vận hành nội bộ (KHÔNG phải app cho khách hàng) dùng trên điện thoại của nhân viên và quản lý, xây bằng Next.js + Tailwind CSS + shadcn/ui, cài được lên màn hình chính điện thoại (PWA).

NHIỆM VỤ
Thiết kế bộ nhận diện thương hiệu hoàn chỉnh cho Vbread, dùng đồng thời cho:
(a) VẬT LÝ: bảng hiệu trên xe, tấm che nắng, bao bì (túi giấy, giấy gói bánh), đồng phục/tạp dề nhân viên, namecard, banner dựng tại điểm bán;
(b) SỐ: giao diện phần mềm quản lý vận hành nội bộ nói trên — màu sắc, font, icon app.
Hai phần này phải dùng chung một hệ màu và font, không tách rời.

YÊU CẦU THIẾT KẾ CỤ THỂ

1) Logo
- Phiên bản đầy đủ (có tên) và phiên bản chỉ biểu tượng (icon-only, dùng làm favicon và app icon vuông/bo góc kiểu iOS-Android maskable icon).
- Bản màu và bản 1 màu/đen trắng (để in giá rẻ trên túi giấy).
- Phải đọc rõ ở kích thước rất nhỏ (favicon 48px) VÀ nhìn rõ từ xa ngoài đường (bảng hiệu trên xe, người đi bộ hoặc đi xe máy nhìn thấy).

2) Bảng màu
- 1 màu chủ đạo + 1–2 màu phụ + màu trung tính (nền, chữ).
- Cho mã hex cụ thể kèm tên gọi riêng cho từng màu (không chỉ "màu cam", ví dụ "Crust Orange #B7501C").
- Phải rõ ràng dưới ánh nắng ngoài trời — tránh màu pastel nhạt khó thấy.
- Nêu rõ cách áp dụng cho cả giao diện sáng (light mode) và tối (dark mode) trên app điện thoại.

3) Kiểu chữ (typography)
- Ưu tiên font có trên Google Fonts, hỗ trợ đầy đủ dấu tiếng Việt.
- Đề xuất: 1 font tiêu đề có cá tính + 1 font nội dung dễ đọc trên di động + (tuỳ chọn) 1 font phụ cho số liệu/mã đơn nếu cần con số thẳng hàng.

4) Họa tiết / hoa văn phụ trợ (nếu có)
- Gợi liên tưởng đến bánh mì hoặc đường phố Việt Nam, dùng tiết chế, không lạm dụng.

5) Giọng điệu thương hiệu
- Nêu 2–3 tính từ mô tả cảm giác thương hiệu nên mang lại (ví dụ: gần gũi, nhanh gọn, đáng tin).

YÊU CẦU KỸ THUẬT ĐỂ ĐỒNG BỘ VỚI APP
- Cuối cùng, xuất bảng màu và font dưới dạng khối CSS variables sẵn sàng dán vào code, dạng:
  :root {
    --color-primary: #......;
    --color-primary-foreground: #......;
    --color-secondary: #......;
    --color-background: #......;
    --font-heading: "...", sans-serif;
    --font-body: "...", sans-serif;
  }
- Gợi ý luôn danh sách icon/app-icon cần xuất cho PWA: favicon.ico, 192x192, 512x512, maskable icon, apple-touch-icon.

QUY TRÌNH LÀM VIỆC MONG MUỐN
1. Trước tiên, đề xuất 3 hướng phong cách khác biệt rõ rệt (khác nhau về cảm xúc, màu sắc, kiểu chữ). Mỗi hướng chỉ mô tả ngắn gọn bằng lời kèm gợi ý màu/font — CHƯA vẽ chi tiết. Tôi sẽ chọn 1 hướng hoặc yêu cầu trộn giữa các hướng.
2. Sau khi tôi chọn, phát triển sâu hướng đó: vẽ concept logo, hoàn thiện bảng màu, font, và vài ứng dụng thực tế (mockup bảng hiệu xe, bao bì, 1 màn hình app đơn giản).
3. Tổng hợp thành 1 tài liệu hướng dẫn thương hiệu (brand guideline) ngắn gọn: mã màu, tên font, quy tắc dùng logo, và khối CSS variables ở cuối.

LƯU Ý TRÁNH
- Tránh phong cách thiết kế "AI làm đại trà" hay gặp: nền be/kem nhạt phối chữ serif + màu cam đất; nền đen phối một màu neon nổi bật; toàn bộ chữ căn giữa; bo góc lớn ở mọi khối; dùng font Inter/Poppins mặc định không điểm nhấn; dùng emoji làm gạch đầu dòng.
- Ưu tiên một hướng có cá tính riêng, gắn với hình ảnh thật của bánh mì Việt Nam và xe đẩy đường phố, thay vì phong cách "startup công nghệ chung chung".

Hãy bắt đầu bằng bước 1: đề xuất 3 hướng phong cách.
```
