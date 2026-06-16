# ScamChecker — Phát Hiện Lừa Đảo

Công cụ phát hiện lừa đảo trực tuyến dành cho người dùng Việt Nam.  
Dán nội dung tin nhắn đáng ngờ → AI phân tích tức thì → Nhận đánh giá rủi ro chi tiết.

> **Lưu ý**: Đây là công cụ hỗ trợ tham khảo. Kết quả AI có thể sai. Khi nghi ngờ, hãy kiểm tra thêm và liên hệ cơ quan chức năng.

---

## Tính năng

- Phân tích bằng AI (OpenAI gpt-4o-mini) với kết quả streaming
- Hai góc nhìn phân tích: **Thám tử** (phát hiện dấu hiệu) + **Tâm lý** (chiến thuật thao túng)
- Đồng hồ rủi ro trực quan (0–100)
- Highlight các từ khoá nguy hiểm trong tin nhắn gốc
- Cảnh báo khẩn + đường dây hỗ trợ khi rủi ro cao
- Lịch sử các lần kiểm tra (lưu cục bộ trong trình duyệt)
- Thống kê tổng hợp
- Chế độ Sáng / Tối

---

## Cách chạy

### 1. Cài đặt khoá API

```bash
cp config.example.js config.js
```

Mở `config.js` và thay `sk-REPLACE_WITH_YOUR_KEY` bằng khoá OpenAI thật của bạn.  
Lấy khoá tại: https://platform.openai.com/api-keys

### 2. Mở trong trình duyệt

```bash
# Cách đơn giản nhất — mở trực tiếp
open index.html

# Hoặc dùng live server (VS Code extension / Python)
python3 -m http.server 8080
# Truy cập http://localhost:8080
```

> **Lưu ý bắt buộc**: Vì `app.js` gọi OpenAI API trực tiếp từ trình duyệt, bạn cần mở file qua HTTP (không phải `file://`) nếu trình duyệt chặn mixed content. Dùng VS Code Live Server hoặc `python3 -m http.server` là cách nhanh nhất.

---

## Cấu trúc thư mục

```
scamcheck/
├── index.html          Giao diện chính
├── style.css           CSS tuỳ chỉnh (dark/light mode, layout)
├── app.js              Logic: OpenAI streaming, render, localStorage
├── config.js           Khoá API — KHÔNG đưa lên Git ⚠️
├── config.example.js   Mẫu config không có khoá thật
├── .gitignore
├── CLAUDE.md           Ngữ cảnh dự án cho công cụ AI
├── prompts/            System prompt cho từng vai AI
├── data/               Tin nhắn mẫu và danh sách tổng đài
├── nhat-ky/            Nhật ký hàng ngày của nhóm
├── prompt-eval.md      Nhật ký thử và đánh giá prompt
├── vibe-evidence.md    Bằng chứng dùng AI để sinh giao diện
└── README.md
```

---

## Bảo mật

- Khoá API **không bao giờ** được gửi lên server — chỉ gọi thẳng từ trình duyệt đến OpenAI
- `config.js` đã được liệt kê trong `.gitignore`, sẽ không bị đưa lên Git
- Toàn bộ lịch sử kiểm tra chỉ lưu trong `localStorage` của trình duyệt — không có backend

---

## Liên hệ khi bị lừa đảo

| Đơn vị | Liên hệ |
|--------|---------|
| Công an (khẩn cấp) | 113 |
| Cục BVNTD | 1900 6099 |
| Cục An toàn TT | 1800 1533 |
| Báo cáo online | canhbao.ncsc.gov.vn |

---

## Giấy phép

MIT — Tự do sử dụng, chỉnh sửa và phân phối với điều kiện giữ nguyên ghi chú nguồn gốc.
