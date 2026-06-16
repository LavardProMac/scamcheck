# Nhật Ký Thử và Đánh Giá Prompt

Ghi lại quá trình thử nghiệm, điều chỉnh và đánh giá chất lượng các prompt trong thư mục `prompts/`.

---

## Cách dùng file này

Mỗi lần thử một phiên bản prompt mới, thêm một entry theo mẫu bên dưới.  
Đặt tên phiên bản theo dạng `<vai>-v<số>`, ví dụ `detective-v1`, `psychologist-v2`.

---

## Mẫu entry

```
### [Vai]-v[Số] — [Ngày]

**Thay đổi so với phiên bản trước:**
- ...

**Kết quả kiểm tra (dùng bộ mẫu trong data/sample-messages.md):**

| Mã tin | Kết quả mong đợi | Kết quả thực tế | Đúng? |
|--------|-----------------|----------------|-------|
| M-001  | critical / ≥85  | critical / 92  | ✅     |
| M-009  | safe / ≤20      | safe / 8       | ✅     |

**Nhận xét:**
- Điểm mạnh: ...
- Điểm yếu: ...
- Cần cải thiện: ...
```

---

## Lịch sử đánh giá

*(Thêm entry mới lên đầu)*

---

### detective-v1 — [Ngày khởi tạo]

**Thay đổi so với phiên bản trước:**
- Phiên bản đầu tiên

**Kết quả kiểm tra:**
*(Chưa có — cần chạy thử với bộ mẫu)*

**Nhận xét:**
- Cần chạy qua toàn bộ 10 mẫu trong `data/sample-messages.md` để có baseline
