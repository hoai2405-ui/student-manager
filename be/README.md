# Student Manager Backend API

Backend API cho hệ thống quản lý học viên sử dụng Express.js và MySQL.

## Yêu cầu

- Node.js (v14 trở lên)
- MySQL (v5.7 trở lên hoặc MariaDB)
- npm hoặc yarn

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env` trong thư mục `be/` với nội dung sau:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=student_manager
DB_PORT=3306
JWT_SECRET=supersecret
```

**Lưu ý:** Thay `your_password` bằng mật khẩu MySQL của bạn.

3. Tạo database trong MySQL:

```sql
CREATE DATABASE student_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. Chạy server:

```bash
npm start
```

Hoặc chạy với nodemon (tự động restart khi có thay đổi):

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:3001`

## Cấu trúc Database

Các bảng cần thiết:
- `users` - Quản lý người dùng
- `students` - Quản lý học viên
- `courses` - Quản lý khóa học
- `schedules` - Quản lý lịch học
- `registrations` - Đăng ký lịch học
- `students_xml` - Học viên từ file XML

## API Endpoints

### Authentication
- `POST /api/login` - Đăng nhập
- `POST /api/register` - Đăng ký

### Students
- `GET /api/students` - Lấy danh sách học viên
- `POST /api/students` - Thêm học viên mới
- `PUT /api/students/:id` - Cập nhật học viên
- `DELETE /api/students/:id` - Xóa học viên
- `POST /api/students/update-status` - Cập nhật trạng thái

### Courses
- `GET /api/courses` - Lấy danh sách khóa học
- `POST /api/courses/upload` - Upload file XML/Excel
- `PUT /api/courses/:id` - Cập nhật khóa học
- `DELETE /api/courses/:id` - Xóa khóa học

### Statistics
- `GET /api/stats` - Thống kê trạng thái học viên
- `GET /api/quick-stats` - Thống kê nhanh

### Users (Admin only)
- `GET /api/users` - Lấy danh sách người dùng
- `POST /api/users` - Thêm người dùng mới
- `PUT /api/users/:id` - Cập nhật người dùng
- `DELETE /api/users/:id` - Xóa người dùng

### Schedules
- `GET /api/schedules` - Lấy danh sách lịch học
- `POST /api/schedules` - Tạo lịch mới (Admin)
- `GET /api/schedules/:id` - Chi tiết lịch
- `POST /api/schedules/:id/register` - Đăng ký lịch học
- `DELETE /api/schedules/:id/register/:studentId` - Hủy đăng ký

## Troubleshooting

### Lỗi kết nối database

1. Kiểm tra MySQL đã chạy chưa:
```bash
# Windows
net start MySQL

# Linux/Mac
sudo systemctl start mysql
```

2. Kiểm tra file `.env` có đúng thông tin không

3. Kiểm tra database đã được tạo chưa

4. Kiểm tra user có quyền truy cập database

### Lỗi thiếu biến môi trường

Nếu thấy lỗi "Thiếu các biến môi trường", vui lòng tạo file `.env` trong thư mục `be/` với đầy đủ các biến như hướng dẫn ở trên.

## License

ISC
