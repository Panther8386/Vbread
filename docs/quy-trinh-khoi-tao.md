# Quy trình khởi tạo: xe, tài khoản, cấu hình ca

Thứ tự nên làm khi bắt đầu vận hành 1 xe mới. Một số bước không bắt buộc phải làm trước — có ghi chú "độc lập" — còn lại phải làm đúng thứ tự vì bước sau cần dữ liệu của bước trước.

## Việc độc lập, làm lúc nào cũng được

- **Điểm bán** (`/danh-muc/xe` → mục Điểm bán): thêm địa điểm bán hàng.
- **Sản phẩm & Giá bán**: thêm món, đặt giá.
- **Cấu hình ca** (`/cau-hinh/ca`): owner đặt tên ca + khung giờ (ví dụ "Ca sáng" 6h–14h). Nên làm sớm vì bước Phân công ca cần chọn từ đây.

## Thứ tự bắt buộc

1. **Tạo Xe** (`/danh-muc/xe`) — owner tạo, chưa cần gán đối tác lúc này. Xe mới mặc định "Chưa hoạt động".
2. **Tạo tài khoản Đối tác** (`/danh-muc/tai-khoan`) — owner tạo, **bắt buộc chọn xe đã tạo ở bước 1** (chưa có xe thì không tạo được tài khoản đối tác — phải làm bước 1 trước). Gán xong, **xe tự động chuyển "Đang hoạt động"** (owner vẫn tự chuyển lại "Chưa hoạt động" được nếu xe chưa thật sự sẵn sàng vận hành).
3. **Tạo tài khoản Quản lý** (tùy chọn) và **Nhân viên** — owner hoặc chính đối tác tạo. Quản lý bắt buộc chọn xe phụ trách; Nhân viên không cần chọn xe lúc tạo (nhân viên chỉ gắn với xe khi được phân công vào 1 ca cụ thể ở bước 4).
4. **Phân công ca** (`/ca-ban`) — owner hoặc đối tác chọn ngày, xe, điểm bán, ca (theo Cấu hình ca ở trên), nhân viên. Đây luôn là bước cuối vì cần xe đã "Đang hoạt động" + có ca mẫu + (nên) có sẵn nhân viên.

## Vì sao xe cần gán đối tác mới "Đang hoạt động"

Xe chưa gán đối tác và chưa từng có ca nào thì không có ai vận hành — hệ thống chặn không cho set "Đang hoạt động" trong trường hợp đó, tránh xe "ma" xuất hiện trong danh sách phân công ca. Ngay khi gán đối tác, xe coi như sẵn sàng và tự bật "Đang hoạt động".
