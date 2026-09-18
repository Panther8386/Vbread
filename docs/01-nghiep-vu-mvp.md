# Nghiệp vụ MVP: vận hành chuỗi xe bánh mì

Ký hiệu: **[XN]** = đã xác nhận (theo mô tả dự án) · **[GĐ]** = giả định, cần chủ dự án xác nhận (xem 02-cau-hoi-can-chot.md)

## 1. Mô hình vận hành

- [XN] Chuỗi gồm nhiều xe bánh mì; mỗi xe bán tại một hoặc nhiều điểm bán.
- [XN] Ba vai trò: chủ chuỗi, quản lý vận hành, nhân viên bán hàng.
- [XN] Nhân viên thao tác trên điện thoại tại xe; quản lý xem tổng quan trên máy tính hoặc điện thoại.
- [XN] Tiền Việt Nam, múi giờ Việt Nam.
- [XN] Global Malls (Vbread) là đơn vị cung ứng bánh mì nền và các sản phẩm do chính họ sản xuất, tự chịu trách nhiệm chất lượng & ATTP cho các sản phẩm đó. Các nhà cung cấp khác (pate, chả, rau...) tự chịu trách nhiệm chất lượng & ATTP cho nguyên liệu của họ — không có bên thứ ba nào đứng trên Vbread trong mô hình.
- [XN] Số ca/ngày và khung giờ ca là **quy định chung cho toàn hệ thống**, không để mỗi đối tác tự đặt. [GĐ] Số ca và giờ ca cụ thể chưa chốt (tạm giữ giả định 1 xe, 1 điểm bán, 1–2 nhân viên/ca, tối đa 2 ca/ngày — chờ xác nhận số chính xác).
- [GĐ] Nhân viên dùng điện thoại riêng có mạng 4G; MVP chưa cần bán khi mất mạng.
- [GĐ] Thanh toán: tiền mặt, chuyển khoản/QR ngân hàng. MVP chỉ ghi nhận phương thức, chưa kết nối ngân hàng.
- [XN] Bắt buộc in bill / xuất hóa đơn cho khách (đúng quy định pháp lý) — đảo ngược giả định cũ "MVP chưa in bill".
- [XN] Thiết bị bán hàng: một phần bắt buộc dùng chung theo chuẩn Vbread, một phần đối tác được tự trang bị hoặc dùng máy có sẵn. [GĐ] Danh sách cụ thể phần nào bắt buộc chưa chốt.
- [XN] Đối tác giữ toàn bộ tiền bán hàng cuối ca (không trích % doanh số nộp về Vbread). Đối tác trả **phí nhượng quyền 1 lần** khi nhận chuyển giao và **phí dịch vụ hàng tháng** riêng (cho hạ tầng/nền tảng) — hai khoản này tách biệt với doanh thu bán hàng. [GĐ] Số tiền cụ thể của 2 loại phí chưa chốt.

## 2. Menu tham khảo (theo tài liệu Vbread)

| Mã | Món | Giá tham khảo |
|---|---|---|
| BM01 | Bánh mì pate | 20.000–25.000 ₫ |
| BM02 | Bánh mì chả | 25.000–30.000 ₫ |
| BM03 | Bánh mì pate chả | 25.000–30.000 ₫ |

- [XN] Giá bán do chủ chuỗi (Vbread) đặt, **1 mức giá chung cho toàn hệ thống** (không khác theo xe/điểm bán); lưu lịch sử giá theo ngày hiệu lực.
- [GĐ] MVP theo dõi tồn kho ở mức **món bán + bánh nền + bao bì**. Việc tự trừ pate, chả, rau theo công thức để giai đoạn sau.

## 3. Luồng một ca bán

1. **Phân công** (quản lý): chọn ngày, xe, điểm bán, khung giờ, nhân viên.
2. **Mở ca** (nhân viên): xác nhận hàng nhận đầu ca (từng mặt hàng, số lượng) và tiền lẻ đầu ca; có thể chụp ảnh.
3. **Bán hàng**: chạm món → số lượng → giảm giá (nếu có) → phương thức thanh toán → lưu → in bill/xuất hóa đơn. Được sửa hoặc hủy đơn khi ghi lý do.
4. **Phát sinh trong ca**: nhận thêm hàng, trả hàng, hủy/hao hụt (bắt buộc chọn lý do: hỏng, rơi, quá hạn, khác).
5. **Kiểm kê cuối ca**: nhập số lượng thực tế còn lại.
6. **Chốt ca**: đếm tiền mặt, xác nhận số tiền chuyển khoản; hệ thống tính chênh lệch; nhân viên ghi lý do nếu có chênh lệch.
7. **Duyệt** (quản lý): xem và duyệt ca. Sau khi duyệt, mọi chỉnh sửa phải ghi lý do và lưu nhật ký.
8. **Bàn giao** (nếu đổi người giữa ca): chốt số liệu tạm, người nhận xác nhận.

## 4. Công thức

- Tồn cuối ca (sổ sách) = Tồn đầu ca + Nhận − Bán − Trả − Hủy/Hao hụt
- Chênh lệch hàng = Tồn thực tế kiểm kê − Tồn cuối ca (sổ sách)
- Doanh thu = Σ (đơn giá × số lượng) − giảm giá, trừ các đơn đã hủy
- Tiền mặt phải có = Tiền đầu ca + Doanh thu tiền mặt
- Chênh lệch tiền mặt = Tiền mặt thực đếm − Tiền mặt phải có
- Chênh lệch chuyển khoản = Chuyển khoản thực nhận − Doanh thu chuyển khoản
- [GĐ] Ngưỡng cảnh báo: chênh lệch tiền khác 0 ₫ bắt buộc ghi lý do; từ 50.000 ₫ trở lên quản lý phải duyệt.

## 5. Dữ liệu chính (gợi ý)

| Bảng | Nội dung |
|---|---|
| `profiles` | Người dùng, họ tên, số điện thoại, vai trò, trạng thái |
| `carts` | Xe: mã, tên, biển số/ghi chú, trạng thái |
| `locations` | Điểm bán: tên, địa chỉ, tọa độ (tùy chọn) |
| `manager_scopes` | Quản lý nào phụ trách xe nào |
| `products` | Mã, tên, đơn vị, nhóm (món bán, bánh nền, bao bì), trạng thái |
| `prices` | Giá theo sản phẩm, ngày hiệu lực (1 giá chung toàn hệ thống, không theo xe/điểm bán) |
| `shifts` | Ca: ngày kinh doanh, xe, điểm bán, giờ, trạng thái (đã lên lịch, đang bán, chờ duyệt, đã duyệt) |
| `shift_staff` | Nhân viên trong ca |
| `stock_movements` | Phiếu hàng: loại (nhận, trả, hủy, hao hụt, kiểm kê), sản phẩm, số lượng, lý do, ảnh |
| `sales`, `sale_items` | Đơn bán và các dòng món |
| `payments` | Phương thức và số tiền của từng đơn |
| `shift_closings` | Tiền đầu ca, tiền đếm, chênh lệch, lý do, người duyệt |
| `audit_logs` | Nhật ký chỉnh sửa: bảng, bản ghi, người sửa, thời điểm, giá trị cũ/mới, lý do |

## 6. Báo cáo MVP

- Theo ngày / ca / xe / điểm bán: doanh thu, số đơn, sản lượng theo món.
- Món bán chạy.
- Tồn cuối ca, hao hụt (số lượng, giá trị ước tính), chênh lệch hàng.
- Chênh lệch tiền và lý do.
- Màn hình tổng quan cho chủ chuỗi: hôm nay bán bao nhiêu, xe nào đang mở ca, ca nào chờ duyệt, cảnh báo chênh lệch.
- Xuất Excel.

## 7. Để sau MVP

Bán khi mất mạng, QR thanh toán tự đối soát, đặt hàng online và điều phối đơn, trừ nguyên liệu theo công thức, giá vốn và lợi nhuận, QC/chấm điểm điểm bán, tài sản, KPI, tính lương, khách hàng thân thiết.

[XN] Quản lý phí nhượng quyền & hợp đồng đối tác (thu phí 1 lần khi chuyển giao, thu phí dịch vụ hàng tháng, theo dõi hợp đồng 12/24/36 tháng) — **làm trong app này, ở giai đoạn sau MVP** (không làm thủ công ngoài app, nhưng cũng không chặn tiến độ MVP). Xem GĐ-08 trong lộ trình.
