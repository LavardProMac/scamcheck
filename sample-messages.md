# Bộ Tin Nhắn Mẫu

Dùng để kiểm tra chất lượng prompt và đánh giá độ chính xác của mô hình.  
Mỗi mẫu có nhãn kết quả mong đợi để so sánh với output thực tế.

---

## Nhóm 1: Lừa đảo trúng thưởng (Lottery Scam)

### M-001 — Trúng thưởng giả mạo ngân hàng
**Kết quả mong đợi**: `critical`, điểm ≥ 85

> Chúc mừng! Tài khoản Vietcombank của bạn đã được chọn ngẫu nhiên trúng thưởng 50.000.000 VNĐ trong chương trình tri ân khách hàng. Để nhận thưởng, vui lòng cung cấp: Họ tên, CMND/CCCD, số tài khoản và mã OTP nhận được. Hạn cuối: HÔM NAY trước 17:00. Hotline: 0909.xxx.xxx

**Từ khoá cần phát hiện**: trúng thưởng, CMND/CCCD, mã OTP, hạn cuối, hôm nay

---

### M-002 — Trúng thưởng Facebook
**Kết quả mong đợi**: `critical`, điểm ≥ 80

> Tài khoản Facebook của bạn đã được Meta lựa chọn nhận thưởng $1,000 trong chương trình kỷ niệm 20 năm. Click vào link sau để xác nhận trong 2 tiếng: http://meta-reward-2024.xyz/claim

**Từ khoá cần phát hiện**: link lạ, deadline 2 tiếng, $1000, xác nhận

---

## Nhóm 2: Mạo danh cơ quan nhà nước

### M-003 — Mạo danh công an
**Kết quả mong đợi**: `critical`, điểm ≥ 90

> Đây là Phòng Cảnh sát điều tra tội phạm công nghệ cao (PC02). Tài khoản ngân hàng của bạn liên quan đến đường dây rửa tiền đang bị điều tra. Để tránh bị phong tỏa tài sản, bạn cần chuyển toàn bộ số dư vào tài khoản an toàn do chúng tôi cung cấp trong 30 phút. Liên hệ: 0912.xxx.xxx

**Từ khoá**: PC02, rửa tiền, phong tỏa tài sản, 30 phút, chuyển tiền

---

### M-004 — Mạo danh bưu điện / hải quan
**Kết quả mong đợi**: `high`, điểm 65–80

> Bưu điện Việt Nam thông báo: Bạn có 1 kiện hàng từ nước ngoài đang bị giữ tại hải quan do chưa đóng thuế 350.000 VNĐ. Vui lòng thanh toán trong 24h để tránh bị trả về. Link thanh toán: vnpost-customs.net/pay

---

## Nhóm 3: Việc làm & đầu tư

### M-005 — Việc làm online lương cao
**Kết quả mong đợi**: `high`, điểm ≥ 70

> Tuyển nhân viên làm thêm tại nhà, không cần kinh nghiệm. Công việc: Like, Share bài viết trên mạng xã hội. Thu nhập: 500.000–2.000.000 VNĐ/ngày. Yêu cầu: nộp phí đặt cọc 300.000 VNĐ để nhận tài khoản làm việc. Zalo: 0x0x.xxx.xxx

**Từ khoá**: phí đặt cọc, thu nhập bất thường, không cần kinh nghiệm, Like/Share

---

### M-006 — Đầu tư tiền ảo lợi nhuận cao
**Kết quả mong đợi**: `critical`, điểm ≥ 85

> Cơ hội đầu tư vàng! Sàn giao dịch XYZ Trade đảm bảo lợi nhuận 15%/tháng, rút tiền bất kỳ lúc nào. Đã có 50,000 thành viên. Đầu tư tối thiểu 5 triệu. Tham gia ngay hôm nay, chỉ còn 3 suất cuối. Zalo: 0x0x

---

## Nhóm 4: Mạo danh người quen / tình cảm

### M-007 — Mạo danh người thân cần tiền gấp
**Kết quả mong đợi**: `high`, điểm ≥ 70

> Con ơi, đây là mẹ. Mẹ đang bị mất điện thoại, đang dùng máy của người quen nhắn. Con chuyển gấp cho mẹ 3 triệu vào số tài khoản 19036xxxxxx Vietinbank tên Nguyễn Thị X. Mẹ cần trả tiền viện phí gấp. Chuyển xong nhắn mẹ nhé.

---

### M-008 — Scam tình cảm (Romance scam)
**Kết quả mong đợi**: `medium`–`high`

> Chào em, anh là kỹ sư đang làm việc tại Đức. Anh thấy profile em rất xinh và muốn kết bạn. Anh đang có một dự án lớn và cần chuyển một số tiền về Việt Nam nhờ em giữ hộ, anh sẽ trả phí 10% cho em.

---

## Nhóm 5: Tin nhắn bình thường (kiểm tra false positive)

### M-009 — Tin nhắn từ ngân hàng thật
**Kết quả mong đợi**: `safe` hoặc `low`, điểm ≤ 20

> [Vietcombank] Tai khoan 19036xxxxxx cua ban vua phat sinh giao dich tru 250,000 VND luc 14:35 10/06/2024. So du hien tai: 1,250,000 VND. Neu ban khong thuc hien GD nay, lien he 1800 1234.

---

### M-010 — Tin nhắn hàng ngày
**Kết quả mong đợi**: `safe`, điểm ≤ 10

> Ơi bạn, tối nay có đi ăn không? Tụi mình định ra quán bò né gần nhà bạn Minh đó, khoảng 7h. Nhớ reply nhé!
