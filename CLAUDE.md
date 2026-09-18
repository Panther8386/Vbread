# Vbread App: nền tảng vận hành chuỗi xe bánh mì

<!-- Tên thương hiệu: tạm gọi Vbread, đã chốt 17/09/2026 (xem docs/02-cau-hoi-can-chot.md), có thể đổi sau. -->

## Bối cảnh
- Chủ dự án không phải lập trình viên. Luôn giải thích bằng tiếng Việt, câu ngắn, dễ hiểu; nói rõ mình sắp làm gì trước khi sửa nhiều file.
- Nghiệp vụ chi tiết: @docs/01-nghiep-vu-mvp.md
- Câu hỏi còn mở: @docs/02-cau-hoi-can-chot.md
- Khi gặp điều chưa rõ về nghiệp vụ: hỏi lại, không tự đoán. Nếu buộc phải giả định, ghi rõ "GIẢ ĐỊNH" trong câu trả lời và thêm vào docs/02-cau-hoi-can-chot.md.

## Người dùng và phân quyền
- `owner` (chủ chuỗi): xem toàn bộ, cấu hình hệ thống.
- `manager` (quản lý vận hành): chỉ thấy các xe/điểm bán được phân công.
- `staff` (nhân viên bán hàng): chỉ thấy ca của mình; nhận hàng, bán hàng, kiểm kê, chốt ca.
- Phân quyền phải được kiểm tra ở cơ sở dữ liệu (Row Level Security của Supabase), không chỉ ẩn nút trên giao diện.

## Phạm vi MVP (chỉ làm những phần này)
1. Danh mục: xe, điểm bán, sản phẩm, giá bán, tài khoản nhân viên.
2. Ca bán: phân công, mở ca (hàng + tiền đầu ca), bàn giao, đóng ca.
3. Bán hàng: sản phẩm, số lượng, giảm giá, phương thức thanh toán, in bill/xuất hóa đơn (bắt buộc).
4. Hàng hóa: nhận, bán, trả, hủy/hao hụt, kiểm kê, tồn cuối ca.
5. Đối soát tiền: tiền phải có so với tiền thực đếm, chênh lệch và lý do.
6. Báo cáo theo ngày, ca, xe, điểm bán.

KHÔNG làm trong MVP (chỉ làm khi chủ dự án yêu cầu): đặt hàng online, điều phối đơn, QC/chấm điểm, tài sản, KPI, bếp trung tâm, công thức/giá vốn, tính lương, khách hàng thân thiết, tích hợp bên ngoài.

## Công nghệ
- Next.js (App Router) + TypeScript, Tailwind CSS, shadcn/ui.
- Supabase: PostgreSQL, Auth, Row Level Security. Thay đổi cấu trúc dữ liệu luôn bằng file migration trong `supabase/migrations/`.
- Giao diện ưu tiên điện thoại (mobile-first), cài được lên màn hình chính (PWA).
- Kiểm thử: Vitest cho logic tính toán; Playwright cho luồng chính.
- Triển khai: Vercel (web) + Supabase (dữ liệu).

## Quy ước bắt buộc
- Giao diện 100% tiếng Việt. Tên biến, bảng, cột trong code bằng tiếng Anh.
- Tiền: số nguyên đồng (kiểu `bigint`), không dùng số thập phân. Hiển thị dạng `25.000 ₫`.
- Thời gian: lưu `timestamptz` (UTC), hiển thị theo `Asia/Ho_Chi_Minh`, định dạng `dd/MM/yyyy HH:mm`. "Ngày kinh doanh" tính theo giờ Việt Nam.
- Số lượng hàng: số nguyên theo đơn vị của sản phẩm (ổ, gói, hộp...).
- Không xóa cứng dữ liệu nghiệp vụ; dùng trạng thái hoặc `deleted_at`.
- Mọi thay đổi trên ca đã chốt, giá bán, phiếu kho, đối soát tiền phải ghi vào bảng `audit_logs` (ai, lúc nào, giá trị cũ, giá trị mới, lý do).
- Công thức tính (tồn, tiền phải có, chênh lệch) viết thành hàm riêng trong `src/lib/` và có test.
- Nút bấm trên điện thoại cao tối thiểu 44px; thao tác bán một món không quá 2 chạm.

## An toàn
- Không bao giờ đọc, in ra hoặc sửa `.env.local`, trừ khi chủ dự án yêu cầu rõ.
- Khóa `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng phía máy chủ, không bao giờ đưa vào code chạy trên trình duyệt.
- Mọi bảng mới phải bật Row Level Security kèm chính sách truy cập.
- Không chạy lệnh xóa dữ liệu, reset cơ sở dữ liệu thật hoặc `git push --force` khi chưa hỏi.

## Cách làm việc
- Việc lớn: lập kế hoạch trước, chờ duyệt rồi mới sửa code.
- Làm từng bước nhỏ; sau mỗi bước chạy `npm run lint` và `npm test`, báo kết quả, rồi đề xuất nội dung commit.
- Kết thúc mỗi tính năng: cập nhật `docs/nhat-ky-tien-do.md` (đã làm gì, còn gì, lưu ý).

## Lệnh thường dùng
- `npm run dev`: chạy thử trên máy tại http://localhost:3000
- `npm run lint`: kiểm tra lỗi cú pháp
- `npm test`: chạy kiểm thử (Vitest, các hàm trong src/lib/)
- `npm run e2e`: chạy kiểm thử luồng chính (Playwright)
- `npm run build`: build thử trước khi triển khai

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
