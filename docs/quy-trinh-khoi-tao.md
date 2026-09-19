# Quy trình khởi tạo: xe, tài khoản, cấu hình ca

Thứ tự nên làm khi bắt đầu vận hành 1 xe mới. Một số bước không bắt buộc phải làm trước — có ghi chú "độc lập" — còn lại phải làm đúng thứ tự vì bước sau cần dữ liệu của bước trước.

## Việc độc lập, làm lúc nào cũng được

- **Điểm bán** (`/danh-muc/diem-ban`): thêm địa điểm bán hàng.
- **Sản phẩm & Giá bán**: thêm món, đặt giá.
- **Cấu hình ca** (`/cau-hinh/ca`): owner đặt tên ca + khung giờ (ví dụ "Ca sáng" 6h–14h). Nên làm sớm vì bước Phân công ca cần chọn từ đây.

## Thứ tự bắt buộc

1. **Tạo Xe** (`/danh-muc/xe`) — chỉ owner tạo. Xe mới luôn ở trạng thái "Chưa hoạt động".
2. **Owner phân bổ xe cho Đối tác và Quản lý**:
   - **Đối tác** (chủ sở hữu xe, `/danh-muc/tai-khoan`) — owner tạo tài khoản, **bắt buộc chọn xe đã tạo ở bước 1**.
   - **Quản lý** (phục vụ chăm sóc đối tác & cung ứng sản phẩm) — **chỉ owner tạo được**, chọn xe cần phụ trách. Quản lý xem được ca của xe mình phụ trách nhưng không tự phân công ca.
3. **Tạo tài khoản Nhân viên bán hàng** — owner hoặc chính đối tác tạo (theo yêu cầu của đối tác), không cần chọn xe lúc tạo — nhân viên chỉ gắn với xe khi được phân công vào 1 ca cụ thể ở bước 4.
4. **Phân công ca** (`/ca-ban`) — **chỉ đối tác hoặc owner** chọn ngày, xe, điểm bán, ca (theo Cấu hình ca), nhân viên (ưu tiên đối tác tự thực hiện). **Ngay khi có nhân viên được phân công vào 1 ca cụ thể, xe mới chính thức chuyển "Đang hoạt động"** — trước đó, dù đã gán đối tác/quản lý, xe vẫn "Chưa hoạt động".

## Vì sao xe chỉ "Đang hoạt động" khi có nhân viên trong ca

Có đối tác/quản lý mới là gán trách nhiệm quản lý, chưa chắc xe đã thật sự vận hành. Xe chỉ được coi là "Đang hoạt động" khi có nhân viên cụ thể được phân công bán hàng theo ca — đúng thời điểm xe bắt đầu kinh doanh thật. Owner vẫn có thể tự tay chuyển trạng thái xe nếu cần (ví dụ tạm ngừng xe đang hoạt động).
