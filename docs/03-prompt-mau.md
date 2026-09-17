# Prompt mẫu theo từng giai đoạn

Cách dùng: mở một cuộc trò chuyện mới cho mỗi giai đoạn, chuyển sang chế độ **Plan**, dán prompt, đọc kế hoạch, góp ý rồi mới cho Claude làm.

## G0. Rà soát nghiệp vụ
```
Đọc CLAUDE.md và toàn bộ thư mục docs/. Chưa viết code.
1) Tóm tắt lại mô hình vận hành bằng lời của bạn để tôi kiểm tra.
2) Liệt kê những điểm mâu thuẫn hoặc còn thiếu.
3) Hỏi tôi từng nhóm câu hỏi (tối đa 5 câu mỗi lượt) để chốt docs/02-cau-hoi-can-chot.md.
Sau khi tôi trả lời, cập nhật docs/01-nghiep-vu-mvp.md: chuyển [GĐ] thành [XN] hoặc sửa lại.
```

## G1. Tạo khung dự án
```
Tạo khung dự án Next.js (App Router, TypeScript, Tailwind, ESLint) ngay trong thư mục hiện tại, cài shadcn/ui, Vitest và Playwright.
Tạo .gitignore có .env.local. Tạo file .env.example (chỉ có tên biến, không có giá trị).
Tạo trang chủ tiếng Việt đơn giản "Vbread – Vận hành xe bánh mì".
Giải thích ngắn từng thư mục vừa tạo. Chạy npm run dev và cho tôi biết mở địa chỉ nào để xem.
```

## G2. Kết nối Supabase, đăng nhập, phân quyền
```
Kết nối dự án với Supabase (tôi đã điền URL và anon key vào .env.local).
Thiết kế và tạo migration cho: profiles (vai trò owner/manager/staff), carts, locations, manager_scopes, audit_logs.
Bật Row Level Security đúng theo phân quyền trong CLAUDE.md. Tạo trigger ghi audit_logs.
Làm trang đăng nhập bằng số điện thoại hoặc email + mật khẩu (tôi chọn: ...).
Viết test chứng minh: nhân viên không xem được dữ liệu xe khác; quản lý chỉ xem xe được phân công.
Lập kế hoạch trước, chờ tôi duyệt.
```

## G3. Danh mục
```
Làm các màn hình quản trị (chỉ owner, manager xem được phần mình): xe, điểm bán, sản phẩm, giá bán có ngày hiệu lực, tài khoản nhân viên.
Có tìm kiếm, bật/tắt trạng thái, không xóa cứng. Tạo dữ liệu mẫu: 2 xe, 3 điểm bán, 3 món BM01–BM03, bánh nền, bao bì, 3 nhân viên.
```

## G4. Ca bán
```
Làm luồng ca theo mục 3 trong docs/01-nghiep-vu-mvp.md, phần phân công và mở ca:
- Quản lý: lịch ca theo ngày, phân công xe, điểm bán, nhân viên.
- Nhân viên (màn hình điện thoại): thấy ca hôm nay, bấm "Mở ca", nhập hàng nhận đầu ca và tiền đầu ca.
Trạng thái ca: da_len_lich → dang_ban → cho_duyet → da_duyet. Không cho mở 2 ca cùng lúc trên 1 xe.
```

## G5. Bán hàng nhanh
```
Làm màn hình bán hàng cho điện thoại: lưới nút món to, chạm để thêm, +/− số lượng, giảm giá, chọn tiền mặt/chuyển khoản, lưu đơn.
Mục tiêu: bán 1 bánh mì trả tiền mặt trong 2 chạm. Hiện tổng doanh thu ca ở đầu màn hình.
Cho sửa/hủy đơn khi nhập lý do; ghi audit_logs. Viết test cho hàm tính tiền và giảm giá.
```

## G6. Hàng hóa trong ca
```
Làm các phiếu: nhận thêm, trả hàng, hủy/hao hụt (bắt buộc lý do, cho chụp ảnh), kiểm kê cuối ca.
Viết hàm tính tồn cuối ca và chênh lệch hàng theo công thức trong docs, kèm test với ít nhất 5 tình huống.
```

## G7. Chốt ca và đối soát tiền
```
Làm màn hình chốt ca: hiện doanh thu theo phương thức, tiền mặt phải có, ô nhập tiền đếm, chuyển khoản thực nhận, tự tính chênh lệch.
Chênh lệch khác 0 bắt buộc ghi lý do; vượt ngưỡng trong docs thì chuyển quản lý duyệt.
Màn hình quản lý: danh sách ca chờ duyệt, xem chi tiết, duyệt hoặc trả lại kèm ghi chú.
```

## G8. Báo cáo và tổng quan
```
Làm trang tổng quan cho chủ chuỗi và quản lý theo mục 6 trong docs: bộ lọc ngày/ca/xe/điểm bán, thẻ số liệu chính, biểu đồ doanh thu theo ngày, bảng món bán chạy, bảng hao hụt, bảng chênh lệch tiền, nút xuất Excel.
Kiểm tra số liệu báo cáo khớp với tổng các đơn bằng test.
```

## G9. Kiểm thử tổng
```
Viết kịch bản Playwright cho một ngày làm việc trọn vẹn: phân công → mở ca → bán 10 đơn → hủy 1 đơn → hao hụt 2 ổ → kiểm kê → chốt ca lệch 10.000 ₫ → quản lý duyệt → báo cáo đúng số.
Chạy toàn bộ test, sửa lỗi, rồi cho tôi danh sách việc cần tự kiểm tra bằng tay trên điện thoại.
```

## Prompt dùng thường xuyên
- `Giải thích cho tôi đoạn code này làm gì, bằng lời đơn giản.`
- `Có lỗi này: [dán lỗi]. Tìm nguyên nhân, giải thích, rồi đề xuất cách sửa trước khi sửa.`
- `Kiểm tra lại toàn bộ thay đổi vừa rồi: có lỗ hổng phân quyền, lộ khóa bí mật, hoặc sai công thức tiền không?`
- `Commit các thay đổi với nội dung mô tả rõ ràng bằng tiếng Việt.`
- `Cập nhật docs/nhat-ky-tien-do.md với việc vừa làm.`
