# Hướng dẫn Debug Upload XML

## Bước 1: Đảm bảo server đã restart
```bash
cd be
# Dừng server cũ (Ctrl+C)
npm start
# hoặc
npm run dev
```

## Bước 2: Kiểm tra server đang chạy
Bạn sẽ thấy log:
```
✅ Kết nối database thành công!
📊 Database: ... @ ...
🚀 Database sẵn sàng sử dụng!
API running on http://localhost:3001
```

## Bước 3: Upload XML và xem log
Khi upload XML, bạn PHẢI thấy log trong terminal như:
```
🔵 ===== BẮT ĐẦU UPLOAD XML ===== 🔵
File path: uploads/...
✅ Đọc file thành công, kích thước: ... bytes
✅ Parse XML thành công
...
```

## Bước 4: Nếu KHÔNG thấy log
- Server chưa restart → Restart lại
- Upload không đến server → Kiểm tra network tab trong F12
- Code không chạy → Kiểm tra có lỗi syntax không

## Bước 5: Cung cấp thông tin
Nếu vẫn không hoạt động, cung cấp:
1. Toàn bộ log từ terminal khi upload
2. Một file XML mẫu nhỏ (1-2 học viên)
3. Screenshot terminal khi upload

