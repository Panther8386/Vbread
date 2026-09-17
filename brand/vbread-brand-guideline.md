# Vbread — Brand Guideline 01

## Ý tưởng trung tâm: Dấu Cắt Giòn

Vbread dùng một chữ **V** đậm, dựng từ hai nét như hai nửa ổ bánh mì. Nét phải có ba đường cắt vỏ bánh. Hình đủ đơn giản để nhận ra ở favicon 48 px, nhưng vẫn có một chi tiết riêng khi phóng lớn trên mái xe.

Ba phẩm chất thương hiệu: **gần gũi — nhanh gọn — đáng tin**.

## Logo

- Lockup ngang là phiên bản mặc định cho mái xe, bảng hiệu và header tài liệu.
- Biểu tượng V dùng riêng cho favicon, app icon, avatar, tạp dề và tem nhỏ.
- Bản một màu dùng Charcoal Ink, Crust Red hoặc mực trắng đảo màu. Không dùng sắc độ trung gian.
- Khoảng trống an toàn quanh logo tối thiểu bằng **1/4 chiều rộng biểu tượng V**.
- Kích thước tối thiểu: lockup ngang 120 px hoặc 25 mm; biểu tượng 24 px hoặc 8 mm. Với favicon, ưu tiên 48 px trở lên.
- Không kéo giãn, thêm viền, đổ bóng, đổi góc nghiêng, tách ba đường cắt hoặc đặt logo trên ảnh thiếu tương phản.

## Màu sắc

| Tên màu | Hex | Vai trò |
|---|---:|---|
| Crust Red | `#C83B22` | Màu chủ đạo, mái xe, CTA chính, logo |
| Pickle Green | `#2F6B45` | Đồng phục, trạng thái hoàn tất/đang hoạt động |
| Baguette Gold | `#F2B544` | Nhấn nhỏ, trạng thái chờ và chi tiết món ăn |
| Paper White | `#FFF8E8` | Nền thương hiệu, giấy gói, chữ đảo màu |
| Charcoal Ink | `#20201D` | Chữ, bản logo một màu |
| Night Cart | `#121816` | Nền dark mode |

Crust Red cần chiếm khoảng 60–70% diện tích nhận diện từ xa. Pickle Green chỉ nên chiếm 15–25%; Baguette Gold dưới 10%. Trên app, không dùng Crust Red cho mọi thành phần: giữ nó cho hành động chính và điểm nhận diện.

## Kiểu chữ

- **Be Vietnam Pro ExtraBold 800/900:** logo chữ, tiêu đề, bảng giá và số lớn.
- **IBM Plex Sans 400/500/600:** nội dung, nhãn form và điều hướng trên điện thoại.
- **IBM Plex Mono 500/600:** mã đơn, mã xe, số tiền và số kiểm kê cần thẳng hàng.

Tất cả đều có trên Google Fonts và hỗ trợ tiếng Việt. Bảng hiệu nên dùng chữ hoa/thường ngắn, tương phản cao; không dùng chữ mảnh trên nền ngoài trời.

## Họa tiết phụ trợ

Họa tiết duy nhất là cụm **ba đường cắt chéo** lấy từ biểu tượng. Có thể lặp theo nhịp đều trên giấy gói hoặc chạy thành dải ở chân banner. Dùng một màu với độ phủ thấp; không biến thành họa tiết lúa mì và không phủ kín mọi bề mặt.

## Ứng dụng vật lý

- **Mái và thân xe:** nền Crust Red, logo Paper White; bảng giá dùng chữ trắng hoặc Charcoal Ink trên Paper White.
- **Tạp dề:** Pickle Green với biểu tượng trắng ở ngực; áo bên trong màu đen hoặc trắng.
- **Túi/giấy gói:** in một màu Crust Red hoặc Charcoal Ink để giữ chi phí thấp.
- **Banner:** ưu tiên một thông điệp và một mức giá lớn; tránh ảnh món ăn chen vào vùng logo.
- **Namecard:** mặt trước Crust Red với logo trắng; mặt sau Paper White với chữ Charcoal Ink.

## Giao diện phần mềm

Light mode dùng Paper White làm nền, thẻ trắng và Charcoal Ink cho chữ. Dark mode dùng Night Cart, bề mặt xanh-đen, đồng thời nâng độ sáng của đỏ và xanh để giữ tương phản. Trạng thái không được truyền đạt chỉ bằng màu: luôn kèm nhãn hoặc biểu tượng.

Nút chạm tối thiểu 44 × 44 px. Bo góc vừa phải 8–12 px; không dùng pill hoặc thẻ bo tròn lớn cho toàn bộ giao diện.

## CSS variables

```css
:root {
  --color-primary: #C83B22;
  --color-primary-foreground: #FFF8E8;
  --color-secondary: #2F6B45;
  --color-secondary-foreground: #FFFFFF;
  --color-accent: #F2B544;
  --color-accent-foreground: #20201D;
  --color-background: #FFF8E8;
  --color-surface: #FFFFFF;
  --color-foreground: #20201D;
  --color-muted: #6F726C;
  --color-border: #DDD8CC;

  --font-heading: "Be Vietnam Pro", sans-serif;
  --font-body: "IBM Plex Sans", sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
}

.dark {
  --color-primary: #F06445;
  --color-primary-foreground: #18110F;
  --color-secondary: #65B985;
  --color-secondary-foreground: #0E1A13;
  --color-accent: #F2B544;
  --color-accent-foreground: #20201D;
  --color-background: #121816;
  --color-surface: #1B2420;
  --color-foreground: #FFF8E8;
  --color-muted: #AEB8B0;
  --color-border: #36423C;
}
```

## Bộ icon cần xuất cho PWA

- `favicon.ico`: 16, 32 và 48 px trong cùng file.
- `icon-192.png`: 192 × 192 px.
- `icon-512.png`: 512 × 512 px.
- `icon-maskable-192.png` và `icon-maskable-512.png`: logo nằm trong vùng an toàn trung tâm 80%.
- `apple-touch-icon.png`: 180 × 180 px, có nền Crust Red, không trong suốt.
- Nên bổ sung `favicon.svg` để trình duyệt hiện đại giữ nét sắc.

Các app icon chỉ dùng biểu tượng V, không kèm chữ “Vbread”.
