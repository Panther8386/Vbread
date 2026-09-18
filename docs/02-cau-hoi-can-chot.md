# Câu hỏi cần chốt trước khi lập trình

Trả lời ngay dưới mỗi câu, rồi chuyển các mục tương ứng trong 01-nghiep-vu-mvp.md từ [GĐ] sang [XN].

## Đã chốt

- **Tên dự án**: tạm gọi là **Vbread** (có thể đổi sau). — chốt 17/09/2026.
- **Mô hình sở hữu xe**: chuyển giao cho đối tác — đối tác tự làm chủ xe của họ. — chốt 17/09/2026, xác nhận bởi chủ dự án.
- **Đổi điểm bán trong ngày**: xe không đổi điểm bán trong ngày. — cả 2 người trả lời vòng 1 đều xác nhận giống nhau.
- **Chụp ảnh nhận/hủy hàng**: có, cần chụp ảnh. — cả 2 người trả lời vòng 1 đều xác nhận giống nhau.
- **Phương thức thanh toán**: hỗ trợ đầy đủ (tiền mặt, chuyển khoản, QR, ví điện tử...), không giới hạn. — cả 2 người trả lời vòng 1 đều xác nhận giống nhau.
- **Mạng tại điểm bán**: có mạng, không cần tính năng bán khi mất mạng cho MVP. — cả 2 người trả lời vòng 1 đều xác nhận giống nhau.
- **Global Malls = Vbread, không có bên thứ ba đứng trên**: Global Malls (Vbread) là đơn vị cung ứng bánh mì nền và các sản phẩm do chính họ sản xuất, tự chịu trách nhiệm chất lượng & ATTP cho các sản phẩm đó. Các nhà cung cấp khác (pate, chả, rau...) tự chịu trách nhiệm chất lượng & ATTP cho nguyên liệu của họ. Chủ dự án (người trả lời trong hội thoại này) chính là người xây dựng nền tảng để phát triển chuỗi — không cần chờ phê duyệt từ bên nào khác. — chốt 18/09/2026, xác nhận trực tiếp bởi chủ dự án, giải quyết dứt điểm rủi ro nêu trong `danh-gia-khao-sat.html`.
- **6 điểm mâu thuẫn ở `danh-gia-khao-sat.html` — chốt 18/09/2026 bởi chủ dự án:**
  1. **Số ca/ngày**: quy định chung cho toàn hệ thống (không để đối tác tự quyết). *Còn thiếu: số ca và giờ ca cụ thể — xem câu hỏi ở cuối file.*
  2. **Giá bán**: 1 giá chung cho toàn hệ thống (không khác theo xe/điểm bán).
  3. **In bill / hóa đơn**: bắt buộc (đúng quy định pháp lý) — đổi ngược lại giả định cũ "MVP chưa in bill".
  4. **Thiết bị bán hàng**: một phần bắt buộc (chuẩn chung), một phần đối tác tự trang bị hoặc dùng đồ có sẵn. *Còn thiếu: phần nào bắt buộc, phần nào tự do — xem câu hỏi ở cuối file.*
  5. **Ngân sách chi phí dịch vụ hằng tháng**: đối tác/chủ xe trả, không phải Vbread.
  6. **Tiền cuối ca & phí nhượng quyền**: đối tác giữ toàn bộ tiền bán hàng (không có % doanh số định kỳ); có **phí nhượng quyền trả 1 lần** khi nhận chuyển giao, và **phí dịch vụ trả hàng tháng** riêng (chính là ngân sách ở mục 5).
- **Quản lý phí nhượng quyền/phí dịch vụ**: làm trong app này (không xử lý thủ công ngoài app), nhưng **để giai đoạn sau MVP** (GĐ-08 trong lộ trình) — không chặn tiến độ GĐ-00 đến GĐ-07. — chốt 18/09/2026.

## Câu hỏi cần trả lời (đã cập nhật cho đúng mô hình đối tác)

Bộ câu hỏi cũ (bên dưới, mục "Lưu trữ vòng 1") viết theo kiểu "1 chuỗi tự vận hành" nên một số câu hỏi sai đối tượng hoặc bắt phải chọn 1 đáp án chung trong khi thực ra mỗi đối tác có thể tự quyết khác nhau. Bộ câu hỏi dưới đây đã sửa lại, dùng cho trang khảo sát từ nay.

### Ca bán
1. ~~Số ca/ngày mỗi xe: có quy định chung cho toàn hệ thống không, hay mỗi đối tác tự quyết~~ — **ĐÃ CHỐT: quy định chung.** Còn thiếu: số ca và giờ ca cụ thể (xem mục "Còn thiếu chi tiết" cuối file).
2. Bàn giao giữa ca (đếm tiền khi đổi người): bắt buộc với tất cả đối tác, hay chỉ áp dụng khi đối tác chạy nhiều hơn 1 ca/ngày và tự chọn có bàn giao?
3. Trong 1 xe, ai phân công ca cho nhân viên: chính đối tác/chủ xe, hay người quản lý do đối tác đó thuê riêng?

### Hàng hóa
4. Đối tác có bắt buộc phải mua nguyên liệu/bánh nền từ nguồn cung do Vbread chỉ định không, hay được tự tìm nhà cung cấp riêng?
5. Hàng còn lại cuối ca: có quy định chung (để lại xe / trả kho / hủy) hay tùy mỗi đối tác tự xử lý?
6. Các lý do hao hụt thường gặp là gì (để đưa sẵn vào danh sách lý do trong app)?

### Bán hàng và tiền
7. ~~Giá bán: Vbread quy định 1 mức giá chung, hay mỗi đối tác tự đặt giá riêng~~ — **ĐÃ CHỐT: 1 giá chung toàn hệ thống.**
8. Giảm giá: đối tác tự quyết định, hay phải theo chương trình chung do Vbread đưa ra?
9. ~~Tiền bán hàng cuối ca: đối tác giữ toàn bộ, hay có phần nộp về theo % doanh số~~ — **ĐÃ CHỐT: đối tác giữ toàn bộ**, không có % doanh số định kỳ (xem câu 17).
10. Khi có chênh lệch tiền: người đứng ca chịu trách nhiệm giải trình trước, đối tác/chủ xe chịu trách nhiệm cuối cùng — cách hiểu này đúng không?
11. ~~In bill hoặc xuất hóa đơn điện tử: bắt buộc hay tự chọn~~ — **ĐÃ CHỐT: bắt buộc** (đúng quy định pháp lý).

### Thiết bị và báo cáo
12. ~~Thiết bị bán hàng: Vbread có tiêu chuẩn chung không, hay tùy đối tác~~ — **ĐÃ CHỐT: một phần bắt buộc (chuẩn chung), một phần đối tác tự trang bị/dùng đồ có sẵn.** Còn thiếu: phần nào bắt buộc cụ thể (xem mục "Còn thiếu chi tiết" cuối file).
13. Vbread (chủ đầu tư mô hình) muốn xem những con số nào đầu tiên mỗi sáng, tổng hợp từ tất cả đối tác?

### Ngân sách và kiểm tra
14. ~~Ngân sách chi phí dịch vụ hằng tháng do Vbread hay đối tác chi trả~~ — **ĐÃ CHỐT: đối tác/chủ xe trả**, dưới dạng phí dịch vụ hàng tháng (xem câu 17).
15. Có muốn thuê người kiểm tra lại code trước khi đưa vào dùng thật không?

### Mô hình nhượng quyền (câu hỏi mới)
16. Bộ kit chuyển giao cho đối tác gồm những gì (xe, thiết bị, đào tạo, lô nguyên liệu ban đầu...)?
17. ~~Phí nhượng quyền: trả 1 lần hay theo % doanh số~~ — **ĐÃ CHỐT: trả 1 lần khi nhận chuyển giao, cộng thêm phí dịch vụ trả hàng tháng riêng** (không có % doanh số định kỳ). Còn thiếu: số tiền cụ thể của cả 2 loại phí.
18. Hợp đồng với đối tác có thời hạn bao lâu? Điều kiện chấm dứt hợp đồng là gì?
19. Giấy phép kinh doanh và an toàn thực phẩm cho từng xe: Vbread hay đối tác chịu trách nhiệm?
20. App này chủ yếu để đối tác tự quản lý xe của họ, để Vbread giám sát nhiều đối tác cùng lúc, hay cả hai mục đích?

### Phạm vi MVP
21. Hiện có bao nhiêu xe? Dự kiến bao nhiêu xe sau 6 và 12 tháng?
22. MVP có nên theo dõi kho tới từng loại nguyên liệu (pate, chả, rau, sốt...) như 2 đối tác đã đề xuất, hay giữ đơn giản (chỉ món bán + bánh nền + bao bì) rồi mở rộng sau?

## Còn thiếu chi tiết (đã chốt hướng, cần số cụ thể)

Sau khi chốt 6 điểm ở trên (18/09/2026), còn 3 chi tiết cụ thể cần chủ dự án bổ sung:

1. **Số ca/ngày và giờ ca chính xác** — đã chốt là quy định chung cho toàn hệ thống, nhưng chưa có số ca và khung giờ cụ thể (ví dụ 2 ca: sáng/chiều, hay 3 ca chạy 24/24 như Văn Kiều Trang từng đề xuất ở vòng 1?).
2. **Thiết bị nào bắt buộc, thiết bị nào tự do** — đã chốt là "một phần bắt buộc", cần liệt kê rõ: ví dụ máy quét/thanh toán bắt buộc dùng chung, còn điện thoại cá nhân thì đối tác tự lo?
3. **Số tiền phí nhượng quyền (trả 1 lần) và phí dịch vụ (trả hàng tháng)** — đã chốt cách tính (không theo % doanh số), cần số cụ thể để đưa vào bảng tài chính đối tác.

## Câu trả lời vòng 2 (bộ câu hỏi mới) — Đinh Xuân Vĩnh, 17/09 17:35

Trả lời đầy đủ, dứt khoát cả 22 câu bắt buộc và 24 câu tùy chọn. Đang chờ thêm cộng sự khác trả lời trước khi tổng hợp thành quyết định cuối — **chưa đưa vào CLAUDE.md/docs/01.**

### Ca bán
1. Không quy định chung toàn hệ thống — mỗi đối tác tự quyết.
2. Bàn giao ca: chỉ áp dụng khi đối tác chạy nhiều hơn 1 ca/ngày, tự chọn có bàn giao.
3. Ai phân công ca: chính đối tác/chủ xe.

### Hàng hóa
4. Bắt buộc mua nguyên liệu/bánh nền từ nguồn cung do Vbread chỉ định.
5. Hàng cuối ca: tùy mỗi đối tác tự xử lý.
6. Lý do hao hụt: định lượng không đều, hư hỏng do thời tiết cực đoan, sự cố ngoài dự kiến.

### Bán hàng và tiền
7. Giá bán: mỗi đối tác tự đặt giá riêng cho xe của mình.
8. Giảm giá: đối tác tự quyết — có thể theo hoặc không theo chương trình chung của Vbread.
9. Tiền cuối ca: nên xây dựng sẵn cơ chế có phần phải nộp về Vbread (phí nhượng quyền theo %), áp dụng theo từng giai đoạn.
10. Chênh lệch tiền: đúng — người đứng ca giải trình trước, đối tác/chủ xe chịu trách nhiệm cuối.
11. In bill: mỗi đối tác tự chọn có in hay không.

### Thiết bị và báo cáo
12. Thiết bị: tùy đối tác tự chọn máy, không có tiêu chuẩn chung.
13. Số liệu Vbread muốn xem mỗi sáng: số xe đang bán / không bán, doanh thu các xe mới trong 30 ngày đầu, xe chưa đạt target ngày, tổng doanh thu, % đạt mục tiêu doanh thu.

### Ngân sách và kiểm tra
14. Ngân sách dịch vụ: khoảng 3.000.000 ₫/tháng.
15. Có, muốn thuê người kiểm tra code trước khi dùng thật.

### Mô hình nhượng quyền
16. Kit chuyển giao: cần màn hình quản lý danh mục (thêm/sửa/xóa) và build thành combo áp dụng theo từng thời điểm.
17. Phí nhượng quyền: cho chọn 1 trong 2 phương án — trả 1 lần, hoặc trả định kỳ (% ban đầu + % hàng tháng trong N tháng) — cần cho thiết lập chi tiết từng tùy chọn.
18. Hợp đồng: thời hạn 12/24/36 tháng tùy đối tác chọn; điều kiện chấm dứt là đối tác không còn công nợ.
19. Giấy phép kinh doanh/ATTP: Vbread chịu trách nhiệm.
20. Mục đích app: cả hai — đối tác tự quản lý xe, và Vbread giám sát nhiều đối tác cùng lúc.

### Phạm vi MVP
21. Hiện có 0 xe. Dự kiến 30–50 xe sau 6–12 tháng.
22. MVP nên theo dõi kho tới từng loại nguyên liệu (không giữ đơn giản).

### Phần 2: Định hướng sau MVP
- **01 Đặt hàng online**: tất cả kênh; xác nhận đơn cả 2 cách (ưu tiên xe nhận trực tiếp); có cả giao tận nơi (thu phí) và tự đến lấy, khách chọn lúc đặt.
- **02 QC/chấm điểm**: cả quản lý và khách chấm; tiêu chí: chất lượng sản phẩm, thái độ, tốc độ phục vụ; ảnh hưởng cả 3 (thưởng phạt, xếp hạng, theo dõi).
- **03 Quản lý tài sản**: theo dõi vật tư/thiết bị trong kit ban đầu (bảo hành, bảo trì, vòng đời); cần lịch bảo trì/khấu hao; đối tác/chủ xe chịu trách nhiệm khi hư/mất.
- **04 KPI**: đo thời gian hoạt động, hiệu quả theo múi giờ, tốc độ xử lý đơn, đánh giá quản lý & khách; tính theo cả ca; dùng cho cả 3 mục đích.
- **05 Bếp trung tâm**: chưa có, còn dự kiến; định mức chưa có — cần màn hình tự thêm/sửa/xóa; giá vốn biến động theo thị trường.
- **06 Lương**: cho chọn tùy phương án (giờ/ca/doanh số); có phụ cấp/thưởng; cần xuất bảng lương theo kỳ.
- **07 Khách hàng thân thiết**: nhận diện qua cả 3 cách; khách tự đổi thưởng khi đủ điểm; cho đối tác/chủ xe tự chọn có áp dụng hay không.
- **08 Tích hợp**: ưu tiên OTA, Facebook, Zalo; cần đồng bộ 2 chiều; chủ nền tảng (Vbread) quản lý tài khoản/API key.

## Câu trả lời vòng 2 (bộ câu hỏi mới) — Văn Kiều Trang, 17/09 17:53

**Khớp gần như hoàn toàn với Đinh Xuân Vĩnh** ở mọi câu cả hai cùng trả lời (câu 1–12, 15, 18–21) — cùng kết luận: mỗi đối tác tự quyết ca/giá/giảm giá/thiết bị, bắt buộc mua nguyên liệu từ Vbread, có phần tiền nộp về theo giai đoạn, hợp đồng 12/24/36 tháng, Vbread chịu trách nhiệm giấy phép, app dùng cho cả đối tác lẫn Vbread giám sát, dự kiến 20–30 xe (Vĩnh: 30–50 xe) sau 6–12 tháng.

Câu chưa trả lời (để trống, chưa có ý kiến khác Vĩnh): 13 (số liệu dashboard), 14 (ngân sách), 16 (kit chuyển giao), 17 (phí nhượng quyền %), 22 (phạm vi theo dõi kho).

→ **2/2 người trả lời vòng 2 đồng thuận tuyệt đối** trên toàn bộ câu hỏi họ cùng trả lời. (Cập nhật: xem mục tiếp theo — thế đồng thuận này đã bị vỡ bởi người trả lời thứ 3.)

## Câu trả lời vòng 2 (bộ câu hỏi mới) — Quỳnh, 17/09 18:16

**Làm vỡ thế đồng thuận với Vĩnh/Trang** — ngược lại ở nhiều câu quan trọng:

| Câu | Vĩnh + Trang | Quỳnh |
|---|---|---|
| 1. Số ca/ngày | Mỗi đối tác tự quyết | **Có quy định chung** cho toàn hệ thống |
| 7. Giá bán | Mỗi đối tác tự đặt giá riêng | **1 giá chung** toàn hệ thống |
| 11. In bill | Đối tác tự chọn | **Nên bắt buộc** (hợp quy định pháp lý) |
| 12. Thiết bị | Tùy đối tác chọn | **Nên đưa chung vào mô hình** (tiêu chuẩn chung) |
| 14. Ai trả ngân sách dịch vụ | Vbread trả (Vĩnh: 3 triệu/tháng) | **Nên tính vào chi phí của chủ xe** (đối tác trả) |

Các câu còn lại tương đối khớp hướng chung (đối tác/chủ xe tự phân ca, tự chịu trách nhiệm chênh lệch, hợp đồng có cam kết thu hồi, Vbread/chủ sở hữu mô hình chịu trách nhiệm giấy phép, cần theo dõi nguyên liệu để đồng nhất chất lượng).

**Điểm cần hỏi lại rõ ràng** (câu 13, Quỳnh viết): *"Ko phải vbread chủ đầu tư là đơn vị hợp tác chuyển nhượng"* — câu này khó hiểu, có thể ý là **Vbread không phải là chủ đầu tư cuối cùng**, mà còn có một **"đơn vị hợp tác chuyển nhượng"** khác ở trên (nhớ lại docs/01 có ghi "bánh cấp đông của Vbread (Global Malls)" — có thể Global Malls là bên nhượng quyền gốc, Vbread chỉ là thương hiệu vận hành). Cần hỏi thẳng Quỳnh hoặc chủ dự án: **Vbread có phải là chủ đầu tư mô hình cuối cùng không, hay còn một bên khác (ví dụ Global Malls) đứng trên?**

Số liệu quy mô: Quỳnh nói "50 điểm khu vực SG" (khác cách nói vùng miền so với Vĩnh "30–50 xe" / Trang "20–30 xe" — có thể là cùng một con số, chỉ khác cách diễn đạt phạm vi).

→ **Không nên chốt vào CLAUDE.md/docs/01 lúc này** — cần chủ dự án quyết định trực tiếp 5 điểm mâu thuẫn trong bảng trên, và làm rõ câu hỏi về "đơn vị hợp tác chuyển nhượng".

## Lưu trữ vòng 1 (bộ câu hỏi cũ, đã có người trả lời — giữ lại làm tư liệu)

### Thương hiệu và quy mô
1. Hiện có bao nhiêu xe? Dự kiến bao nhiêu xe sau 6 và 12 tháng?
   - **Lê Quỳnh** (17/09 11:42): 0 xe hiện tại.
   - **Văn Kiều Trang** (17/09 13:54): 25–30 xe sau 12 tháng.
2. Xe thuộc sở hữu của chuỗi, hay là đối tác nhận chuyển giao mô hình? Đối tác có tự xem báo cáo của mình không?
   - **Lê Quỳnh**: đối tác — dự kiến có thể tự xem báo cáo.
   - **Văn Kiều Trang**: đối tác nhận chuyển giao — đối tác có thể tự xem báo cáo.

### Ca bán và nhân sự
3. Mỗi xe bán mấy ca/ngày, khung giờ nào? Một ca có mấy nhân viên?
   - **Lê Quỳnh**: 1 nhân sự/ca.
   - **Văn Kiều Trang**: ~1 nhân viên/ca; 3 ca/ngày — Ca 1: 5h–13h, Ca 2: 13h–21h, Ca 3: 21h–5h.
4. Một xe có đổi điểm bán trong ngày không?
   - **Lê Quỳnh**: Không.
   - **Văn Kiều Trang**: Không.
5. Có bàn giao giữa ca không? Có đếm tiền khi bàn giao không?
   - **Lê Quỳnh**: không cần, chủ sở hữu mô hình tự quản.
   - **Văn Kiều Trang**: có, có đếm tiền.
6. Ai phân công ca: quản lý hay chủ chuỗi? Phân công trước bao lâu?
   - **Lê Quỳnh**: chủ xe bánh mì.
   - **Văn Kiều Trang**: quản lý, phân công trước 1 tuần.

### Hàng hóa
7. Xe nhận hàng từ đâu? Ai giao? Giao mấy lần/ngày?
   - **Lê Quỳnh**: từ nhà cung cấp, tùy theo doanh số mỗi điểm.
   - **Văn Kiều Trang**: từ nhà cung cấp, nhà cung cấp giao, cần khi nào giao khi đó.
8. Hàng nào cần theo dõi? Đơn vị tính là gì?
   - **Lê Quỳnh**: tất cả, theo từng loại nguyên liệu.
   - **Văn Kiều Trang**: tất cả.
9. Hàng còn lại cuối ca được xử lý thế nào?
   - **Lê Quỳnh**: bảo quản tại điểm.
   - **Văn Kiều Trang**: tùy tình hình.
10. Các lý do hao hụt thường gặp?
    - **Lê Quỳnh**: định lượng chưa chính xác.
11. Có cần chụp ảnh khi nhận hàng hoặc hủy hàng không?
    - **Lê Quỳnh**: có.
    - **Văn Kiều Trang**: cần.

### Bán hàng và tiền
12. Giá có khác nhau theo xe hoặc điểm bán không?
    - **Lê Quỳnh**: không khác.
    - **Văn Kiều Trang**: có khác.
13. Giảm giá kiểu nào? Ai được phép giảm?
    - **Lê Quỳnh**: chủ quầy xe quyết.
    - **Văn Kiều Trang**: tùy chương trình, quản lý đưa ra chương trình.
14. Phương thức thanh toán?
    - **Lê Quỳnh**: có đủ.
    - **Văn Kiều Trang**: tất cả.
15. Tiền lẻ đầu ca thường bao nhiêu? Tiền cuối ca nộp cho ai?
    - **Lê Quỳnh**: chủ xe tự quản.
    - **Văn Kiều Trang**: nộp cho quản lý.
16. Chênh lệch bao nhiêu thì phải báo quản lý? Ai chịu trách nhiệm?
    - **Lê Quỳnh**: chủ xe.
    - **Văn Kiều Trang**: người đứng ca chịu trách nhiệm.
17. Có cần in bill hoặc xuất hóa đơn điện tử không?
    - **Lê Quỳnh**: có.
    - **Văn Kiều Trang**: không cần.

### Thiết bị và vận hành
18. Nhân viên dùng điện thoại riêng hay máy của chuỗi?
    - **Lê Quỳnh**: nên là máy kết hợp của người bán hàng.
    - **Văn Kiều Trang**: tùy tình hình.
19. Tại điểm bán có hay mất mạng không?
    - **Lê Quỳnh**: có sử dụng mạng tại điểm.
    - **Văn Kiều Trang**: phải có mạng.
20. Chủ chuỗi muốn xem những con số nào đầu tiên mỗi sáng?
    - **Lê Quỳnh**: dự toán bán hàng của mỗi điểm.

### Ngân sách
21. Ngân sách chi phí dịch vụ hằng tháng dự kiến?
    - **Lê Quỳnh**: chủ đầu tư mô hình quyết định.
22. Có muốn thuê người kiểm tra lại code trước khi dùng thật không?
    - **Lê Quỳnh**: để chủ đầu tư xem xét.
    - **Văn Kiều Trang**: không.

## Phần 2: Định hướng sau MVP (tùy chọn, chưa chặn GĐ-00)

### 01 · Đặt hàng online & điều phối đơn
- Đặt qua kênh nào? — **Lê Quỳnh**: nên là Zalo. **Văn Kiều Trang**: tất cả kênh.
- Ai xác nhận đơn? — **Lê Quỳnh**: xe chọn đơn gần nhất để giao. **Văn Kiều Trang**: có người điều phối.
- Có giao tận nơi không? — **Lê Quỳnh**: nên có. **Văn Kiều Trang**: có, trong bán kính cho phép.

### 02 · QC / chấm điểm điểm bán
- Ai chấm điểm? — **Lê Quỳnh**: có kiểm tra giám sát. **Văn Kiều Trang**: cả quản lý và khách hàng.
- Tiêu chí gồm gì? — **Lê Quỳnh**: có bảng điểm chấm vệ sinh.
- Điểm số ảnh hưởng gì? — **Lê Quỳnh**: có thưởng phạt theo hệ thống. **Văn Kiều Trang**: thưởng phạt, xếp hạng.

### 03 · Quản lý tài sản
- Danh mục tài sản? — **Lê Quỳnh**: tài sản mô hình, chủ xe quản lý.
- Cần lịch bảo trì/khấu hao? — **Lê Quỳnh**: không cần. **Văn Kiều Trang**: cần.
- Ai chịu trách nhiệm khi hư/mất? — **Lê Quỳnh**: chủ điểm bán. **Văn Kiều Trang**: người đứng ca.

### 04 · KPI nhân viên
- Đo trên chỉ số nào? — **Lê Quỳnh**: tăng số lượng dịch vụ/sản phẩm của mô hình. **Văn Kiều Trang**: doanh số, đánh giá khách hàng.
- Theo cá nhân hay theo ca? — **Lê Quỳnh**: theo điểm bán. **Văn Kiều Trang**: theo cả ca.
- Dùng để làm gì? — **Lê Quỳnh**: thưởng, kích hoạt điểm bán năng động hơn. **Văn Kiều Trang**: tất cả (thưởng, xếp lịch, nhắc nhở).

### 05 · Bếp trung tâm & công thức / giá vốn
- Đã hoạt động chưa? — **Lê Quỳnh**: không cần bếp trung tâm.
- Định mức chuẩn? — **Lê Quỳnh**: có định mức. **Văn Kiều Trang**: sẽ có file định mức.
- Giá vốn cố định hay biến động? — **Lê Quỳnh**: cố định. **Văn Kiều Trang**: biến động theo thị trường.

### 06 · Tính lương
- Theo giờ, ca cố định, hay doanh số? — **Lê Quỳnh**: không tính lương (đối tác tự trả). **Văn Kiều Trang**: theo ca cố định.
- Phụ cấp/thưởng thêm? — Cả hai: không.
- Xuất bảng lương theo kỳ? — **Lê Quỳnh**: không. **Văn Kiều Trang**: cần.

### 07 · Khách hàng thân thiết
- Nhận diện khách qua gì? — Cả hai: số điện thoại.
- Cơ chế tích điểm? — **Lê Quỳnh**: nếu có nên thiết lập. **Văn Kiều Trang**: tích điểm đổi quà hoặc giảm giá.
- Áp dụng phạm vi nào? — **Lê Quỳnh**: áp dụng cho mỗi điểm xe. **Văn Kiều Trang**: tất cả.

### 08 · Tích hợp bên ngoài
- Ưu tiên hệ thống nào? — **Lê Quỳnh**: do quản trị mô hình quyết.
- Đồng bộ hai chiều? — Cả hai: có.
- Ai quản lý tài khoản/API key? — **Lê Quỳnh**: chủ đầu tư xem xét.
