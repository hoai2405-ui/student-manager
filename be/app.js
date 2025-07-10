const express = require("express");
const multer = require("multer");

const cors = require("cors");
const fs = require("fs");
const xml2js = require("xml2js");
const xlsx = require("xlsx");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db"); // file db.js dùng mysql2
const app = express();
const upload = multer({ dest: "uploads/" });
app.use(cors());
app.use(express.json());

// Đã chuyển toàn bộ truy vấn sang dùng pool từ db.js (PostgreSQL)
app.use((req, res, next) => {
console.log("Nhận request:", req.method, req.url);
next();

})


// api đăng ký
app.post("/api/register", async (req, res) => {
  const { username, password, email, phone } = req.body;
  if (!username || !password || !email || !phone)
    return res.status(400).json({ message: "Thiếu thông tin đăng ký" });

  try {
    // Check username đã tồn tại chưa
    const [userRows] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    if (userRows.length > 0)
      return res.status(409).json({ message: "Tên đăng nhập đã tồn tại" });

    // Check email đã tồn tại chưa
    const [emailRows] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (emailRows.length > 0)
      return res.status(409).json({ message: "Email đã được sử dụng" });

    // Check phone đã tồn tại chưa (tuỳ yêu cầu, có thể bỏ qua nếu muốn)
    // const [phoneRows] = await pool.query("SELECT * FROM users WHERE phone = ?", [phone]);
    // if (phoneRows.length > 0)
    //   return res.status(409).json({ message: "Số điện thoại đã được sử dụng" });

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, password, email, phone) VALUES (?, ?, ?, ?)",
      [username, hash, email, phone]
    );
    return res.json({ message: "Đăng ký thành công" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
});

//api đăng nhập
const JWT_SECRET = "supersecret"; // đổi thành secret của bạn

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
    if (rows.length === 0)
      return res.status(400).json({ message: "Sai tài khoản hoặc mật khẩu" });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(400).json({ message: "Sai tài khoản hoặc mật khẩu" });

    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    return res.json({
      token,
      user: { id: user.id, username: user.username, is_admin: user.is_admin },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
});



// API: Lấy danh sách khoá học
app.get("/api/courses", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM courses");
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi DB', err });
  }
});
app.get("/", (req, res) => {
  res.send("Student Manager API is running!");
});

// API: Upload file XML hoặc Excel để thêm khoá học
app.post("/api/courses/upload", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  const parser = new xml2js.Parser();
  fs.readFile(filePath, async (err, data) => {
    if (err) return res.status(500).json({ message: "Lỗi đọc file", err });

    parser.parseString(data, async (err, result) => {
      if (err) return res.status(400).json({ message: "Lỗi parse XML", err });
      console.log("kết quả parse XML:", JSON.stringify(result, null, 2));
      let conn;
      try {
        const khoa = result.BAO_CAO1.DATA[0].KHOA_HOC[0];
        const hocvienList = result.BAO_CAO1.DATA[0].NGUOI_LXS[0].NGUOI_LX;
        if (!Array.isArray(hocvienList)) {
          return res.status(400).json({ message: " Không tìm thấy danh sách học viên trong XML" });
        }
        const sql =
          "INSERT INTO courses (ma_khoa_hoc, ten_khoa_hoc, ngay_khai_giang, ngay_be_giang, so_hoc_sinh, hang_gplx) VALUES (?, ?, ?, ?, ?, ?)";
        const sqlstudent = `
          INSERT INTO students (ho_va_ten, ngay_sinh, hang_gplx, so_cmt, ma_khoa_hoc, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        conn = await pool.getConnection();
        try {
          await conn.beginTransaction();
          // Thêm khóa học
          await conn.query(sql, [
            khoa.MA_KHOA_HOC[0],
            khoa.TEN_KHOA_HOC[0],
            khoa.NGAY_KHAI_GIANG[0],
            khoa.NGAY_BE_GIANG[0],
            parseInt(khoa.SO_HOC_SINH[0]),
            khoa.HANG_GPLX?.[0] || "",
          ]);
          // Thêm học viên
          for (const hocvien of hocvienList) {
            await conn.query(sqlstudent, [
              hocvien.HO_VA_TEN?.[0] || "",
              hocvien.NGAY_SINH?.[0] || null,
              hocvien.HANG_GPLX?.[0] || khoa.HANG_GPLX?.[0] || "",
              hocvien.SO_CMT?.[0] || "",
              khoa.MA_KHOA_HOC?.[0] || "",
              "chua thi",
            ]);
          }
          await conn.commit();
          res.json({ success: true });
        } catch (err) {
          if (conn) await conn.rollback();
          // MySQL duplicate entry error code: 'ER_DUP_ENTRY'
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Khóa học hoặc học viên đã tồn tại!" });
          }
          return res.status(500).json({ message: "Lỗi DB", err });
        } finally {
          if (conn) conn.release();
        }
      } catch (e) {
        res.status(400).json({ message: "Sai cấu trúc XML", error: e });
      }
    });
  });
});
//xoá học viên
app.delete("/api/students/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query("DELETE FROM students WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa học viên", error: err });
  }
});

// sửa học viên
app.put("/api/students/:id", async (req, res) => {
  const { id } = req.params;
  const {
    ho_va_ten,
    ngay_sinh,
    hang_gplx,
    so_cmt,
    ma_khoa_hoc,
    status,
    status_ly_thuyet,
    status_mo_phong,
    status_duong,
    status_truong,
  } = req.body;
  const sql = `
    UPDATE students SET
      ho_va_ten = ?, ngay_sinh = ?, hang_gplx = ?, so_cmt = ?, ma_khoa_hoc = ?,
      status = ?, status_ly_thuyet = ?, status_mo_phong = ?, status_duong = ?, status_truong = ?
    WHERE id = ?
  `;
  try {
    await pool.query(sql, [
      ho_va_ten,
      ngay_sinh,
      hang_gplx,
      so_cmt,
      ma_khoa_hoc,
      status,
      status_ly_thuyet,
      status_mo_phong,
      status_duong,
      status_truong,
      id,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/students/:id error:', err);
    res.status(500).json({ message: "Lỗi khi cập nhật", error: err.message, code: err.code });
  }
});


// thêm học viên
app.post("/api/students", async (req, res) => {
  const {
    ho_va_ten,
    ngay_sinh,
    hang_gplx,
    so_cmt,
    ma_khoa_hoc,
    status_ly_thuyet,
    status_mo_phong,
    status_duong,
    status_truong,
  } = req.body;
  try {
    await pool.query(
      `INSERT INTO students 
       (ho_va_ten, ngay_sinh, hang_gplx, so_cmt, ma_khoa_hoc, status_ly_thuyet, status_mo_phong, status_duong, status_truong)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ho_va_ten,
        ngay_sinh,
        hang_gplx,
        so_cmt,
        ma_khoa_hoc,
        status_ly_thuyet || "chua thi",
        status_mo_phong || "chua thi",
        status_duong || "chua thi",
        status_truong || "chua thi",
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// xoá khoá học
app.delete("/api/courses/:id", async (req, res) => {
  const courseId = req.params.id;
  try {
    const [result] = await pool.query("SELECT ma_khoa_hoc FROM courses WHERE id = ?", [courseId]);
    if (!result || result.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy khoá học" });
    }
    const maKhoaHoc = result[0].ma_khoa_hoc;
    await pool.query("DELETE FROM students WHERE ma_khoa_hoc = ?", [maKhoaHoc]);
    await pool.query("DELETE FROM courses WHERE id = ?", [courseId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xoá khoá học", error: err });
  }
});




// sửa khoá học
app.put("/api/courses/:id", async (req, res) => {
  const { id } = req.params;
  const {
    ma_khoa_hoc,
    ten_khoa_hoc,
    ngay_khai_giang,
    ngay_be_giang,
    so_hoc_sinh,
    
  } = req.body;
  console.log("[PUT /courses/:id] Dữ liệu nhận:", req.body);
  const sql = `
    UPDATE courses
    SET ma_khoa_hoc = ?, ten_khoa_hoc = ?, ngay_khai_giang = ?, ngay_be_giang = ?, so_hoc_sinh = ?
    WHERE id = ?
  `;
  try {
    await pool.query(sql, [
      ma_khoa_hoc,
      ten_khoa_hoc,
      ngay_khai_giang,
      ngay_be_giang,
      so_hoc_sinh,
      trang_thai,
      id,
    ]);
    // Lấy lại bản ghi mới nhất để trả về cho FE
    const [rows] = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);
    res.json({ success: true, course: rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi cập nhật", err });
  }
});

// API: Tìm kiếm học viên
app.get("/api/students", async (req, res) => {
  const { name, cccd, status, ma_khoa_hoc } = req.query;
  let sql = `
    SELECT s.*, c.ten_khoa_hoc
    FROM students s
    LEFT JOIN courses c ON s.ma_khoa_hoc = c.ma_khoa_hoc
    WHERE 1=1
  `;
  const params = [];
  if (name) {
    sql += " AND s.ho_va_ten LIKE ?";
    params.push(`%${name}%`);
  }
  if (cccd) {
    sql += " AND s.so_cmt LIKE ?";
    params.push(`%${cccd}%`);
  }
  if (status) {
    sql += " AND s.status = ?";
    params.push(status);
  }
  if (ma_khoa_hoc) {
    sql += " AND s.ma_khoa_hoc = ? ";
    params.push(ma_khoa_hoc);
  }
  try {
    const [results] = await pool.query(sql, params);
    res.json(results);
  } catch (err) {
    res.status(500).json(err);
  }
});

//// Cập nhật trạng thái học viên
app.post('/api/students/update-status', async (req, res) => {
  const { id, field, value } = req.body;
  const allowedFields = [
    'status_ly_thuyet',
    'status_mo_phong',
    'status_duong',
    'status_truong',
    'status'
  ];
  if (!id || !field || !allowedFields.includes(field)) {
    return res.status(400).json({ error: "Thiếu hoặc sai thông tin update" });
  }
  const validStatuses = ['thi', 'vang', 'rot', 'dat', 'chua thi'];
  if (!validStatuses.includes(value)) {
    return res.status(400).json({ error: "Trạng thái không hợp lệ" });
  }
  const sql = `UPDATE students SET ${field} = ? WHERE id = ?`;
  try {
    await pool.query(sql, [value, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// API: Thống kê trạng thái học viên (cho biểu đồ)
app.get("/api/stats", async (req, res) => {
  const query = `
    SELECT 'status_ly_thuyet' AS type, status_ly_thuyet as status, COUNT(*) as count FROM students GROUP BY status_ly_thuyet
    UNION ALL
    SELECT 'status_mo_phong' AS type, status_mo_phong as status, COUNT(*) as count FROM students GROUP BY status_mo_phong
    UNION ALL
    SELECT 'status_duong' AS type, status_duong as status, COUNT(*) as count FROM students GROUP BY status_duong
    UNION ALL
    SELECT 'status_truong' AS type, status_truong as status, COUNT(*) as count FROM students GROUP BY status_truong
  `;
  try {
    const [results] = await pool.query(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware xác thực token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Thiếu token xác thực" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token không hợp lệ hoặc hết hạn" });
    }
    req.user = user;
    next();
  });
};

// Middleware kiểm tra admin
const checkAdmin = async (req, res, next) => {
  console.log("[DEBUG] ID from token:", req.user?.id);
  try {
    const [rows] = await pool.query('SELECT is_admin FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0 || !rows[0].is_admin) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Route lấy danh sách người dùng
app.get('/api/users', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, email, phone FROM users');
    res.json(rows);
  } catch (err) {
    console.error("Lỗi truy vấn users:", err);
    res.status(500).json({ message: "Lỗi truy vấn database" });
  }
});



app.post('/api/users', authenticateToken, checkAdmin, async (req, res) => {
  const { username, email, phone, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO users (username, email, phone, password) VALUES (?, ?, ?, ?)', [username, email, phone, hashedPassword]);
  res.json({ message: 'Thêm người dùng thành công!' });
});

app.put('/api/users/:id', authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, email, phone } = req.body;
  await pool.query('UPDATE users SET username = ?, email = ?, phone = ? WHERE id = ?', [username, email, phone, id]);
  res.json({ message: 'Cập nhật thành công!' });
});

app.delete('/api/users/:id', authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
  res.json({ message: 'Xóa thành công!' });
});

// Thêm vào file app.js (BE)
app.get("/api/quick-stats", async (req, res) => {
  try {
    const [[{ count: studentCount }]] = await pool.query("SELECT COUNT(*) as count FROM students");
    const [[{ count: courseCount }]] = await pool.query("SELECT COUNT(*) as count FROM courses");
    res.json({
      students: studentCount,
      courses: courseCount,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy thống kê nhanh!" });
  }
});






app.listen(3001, () => console.log("API running on http://localhost:3001"));
