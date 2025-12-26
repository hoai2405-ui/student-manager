const pdfParse = require("pdf-parse");
const { execSync } = require("child_process");
const path = require("path");
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const cors = require("cors");
const fs = require("fs");
const xml2js = require("xml2js");
const xlsx = require("xlsx");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db"); // file db.js dùng mysql2



require("dotenv").config();

// JWT Secret - phải định nghĩa trước khi dùng
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  const fallback = "dev-secret-change-me";
  console.warn("⚠️ JWT_SECRET is not set. Using development fallback secret. Set JWT_SECRET in environment for production.");
  return fallback;
})();

// Helper function to extract text from PDF
// --- 2. HÀM PHỤ TRỢ ĐỌC PDF (ĐỔI SỰA TYPE OBJECT) ---
// --- 2. HÀM PHỤ TRỢ ĐỌC PDF (PHÍM BÊN KHÔNG CRASH) ---
async function extractPdfText(fileUrl) {
  if (!fileUrl) return "";
  try {
    const relativePath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
    const normalizedPath = relativePath.split('/').join(path.sep);
    const absolutePath = path.resolve(__dirname, normalizedPath);

    // console.log(`🔍 Đang xử lý file: ${absolutePath}`);

    if (fs.existsSync(absolutePath)) {
      const dataBuffer = fs.readFileSync(absolutePath);

      // Thử load thư viện
      let pdfLib;
      try {
          pdfLib = require("pdf-parse");
      } catch (e) {
          console.warn("⚠️ Không tìm thấy module pdf-parse. Bỏ qua bước đọc text.");
          return "";
      }

      // Kiểm tra xem thư viện có đúng được không
      if (typeof pdfLib === 'function') {
          const data = await pdfLib(dataBuffer);
          return data.text ? data.text.replace(/\n\s*\n/g, '\n').trim() : "";
      } else if (pdfLib && typeof pdfLib.default === 'function') {
          const data = await pdfLib.default(dataBuffer);
          return data.text ? data.text.replace(/\n\s*\n/g, '\n').trim() : "";
      } else {
          // Nếu thư viện là (như log bên gửi), bỏ qua luôn để không lỗi
          console.warn("⚠️ Thư viện PDF không tương thích cấu trúc. Bỏ qua bước đọc text.");
          return "";
      }
    }
  } catch (error) {
    // Bắt tất cả lỗi để server không bao giờ bị dừng
    console.error("⚠️ Lỗi đọc PDF (Đã bỏ qua để tiếp tục lưu):", error.message);
  }
  return ""; // Luôn trả về chuỗi rỗng nếu có lỗi
}

const app = express();
const upload = multer({ dest: "uploads/" });


// Middleware xác thực token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
        console.log("❌ [Auth] Không có token");

    return res.status(401).json({ message: "Thiếu token xác thực" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
        console.log("❌ [Auth] Token lỗi:", err.message);
      return res
        .status(403)
        .json({ message: "Token không hợp lệ hoặc hết hạn" });
    }
    req.user = user;
    next();
  });
};

// Enable CORS so the frontend (Vite dev server) can call this API.
// Allow origins used in development; adjust or restrict for production.
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    preflightContinue: false,
  })
);

app.use(express.json());

// Serve static files từ thư mục uploads (ĐỔI TRỌNG VÀO TRƯỚC ĐỔI, SERVE FILE PDF VÀ VIDEO)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/temp_images", express.static(path.join(__dirname, "temp_images")));

// Tạo admin mặc định nếu chưa có
async function createDefaultAdmin() {
  try {
    // Kiểm tra xem có user nào có is_admin = 1 chưa
    const [admins] = await pool.query(
      "SELECT id FROM users WHERE is_admin = 1 LIMIT 1"
    );
    if (admins.length === 0) {
      // Tạo admin mặc định
      const defaultAdmin = {
        username: "admin",
        password: await bcrypt.hash("admin123", 10),
        email: "admin@hoangthinh.vn",
        phone: "0123456789",
      };
      // Kiểm tra users table có cột is_admin không, nếu không thì thêm
      try {
        await pool.query(`
          ALTER TABLE users
          ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0
        `);
        console.log("✅ Đã thêm cột is_admin vào bảng users");
      } catch (err) {
        // Nếu cột đã tồn tại, bỏ qua
      }

      // Kiểm tra users table có cột role không, nếu không thì thêm
      try {
        await pool.query(`
          ALTER TABLE users
          ADD COLUMN role VARCHAR(50) DEFAULT 'employee'
        `);
        console.log("✅ Đã thêm cột role vào bảng users");
      } catch (err) {
        // Nếu cột đã tồn tại, bỏ qua
      }

      await pool.query(
        "INSERT INTO users (username, password, email, phone, is_admin) VALUES (?, ?, ?, ?, 1)",
        [
          defaultAdmin.username,
          defaultAdmin.password,
          defaultAdmin.email,
          defaultAdmin.phone,
        ]
      );
      console.log("✅ Đã tạo tài khoản admin mặc định:");
      console.log("   Username: admin");
      console.log("   Password: admin123");

    }
  } catch (err) {
    console.error("❌ Lỗi tạo admin mặc định:", err.message);
  }
}

// Tạo tables cần thiết nếu chưa có
async function createTables() {
  try {
    // Tạo table subjects
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(100) DEFAULT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ Đảm bảo table subjects tồn tại");

    // Tạo table lessons
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        lesson_code VARCHAR(100),
        video_url TEXT,
        pdf_url TEXT,
        license_types TEXT NULL,
        lesson_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ Đảm bảo table lessons tồn tại");

    // Tạo table schedules cho lịch học
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        capacity INT DEFAULT 0,
        location VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo table registrations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        schedule_id INT NOT NULL,
        student_id INT NOT NULL,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('active', 'cancelled') DEFAULT 'active',
        FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Tạo table courses nếu chưa có
    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ma_khoa_hoc VARCHAR(50) NOT NULL UNIQUE,
        ten_khoa_hoc VARCHAR(255) NOT NULL,
        hang_gplx VARCHAR(50),
        ngay_khai_giang DATE,
        ngay_be_giang DATE,
        ngay_hoc DATE,
        so_ngay_hoc INT DEFAULT 0,
        so_hoc_sinh INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ Đảm bảo table courses tồn tại");

    // Tạo table students nếu chưa có
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ho_va_ten VARCHAR(255) NOT NULL,
        ngay_sinh DATE,
        hang_gplx VARCHAR(50),
        so_cmt VARCHAR(50),
        ma_khoa_hoc VARCHAR(50),
        anh_chan_dung LONGTEXT,
        face_verify_required TINYINT(1) NOT NULL DEFAULT 1,
        face_verify_disabled_reason VARCHAR(255) NULL,
        status ENUM('dat', 'rot', 'chua thi') DEFAULT 'chua thi',
        status_ly_thuyet ENUM('dat', 'rot', 'chua thi') DEFAULT 'chua thi',
        status_mo_phong ENUM('dat', 'rot', 'chua thi') DEFAULT 'chua thi',
        status_duong ENUM('dat', 'rot', 'chua thi') DEFAULT 'chua thi',
        status_truong ENUM('dat', 'rot', 'chua thi') DEFAULT 'chua thi',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ Đảm bảo table students tồn tại");

    // Đảm bảo các cột face verification tồn tại
    try {
      await pool.query("ALTER TABLE students ADD COLUMN face_verify_required TINYINT(1) NOT NULL DEFAULT 1");
    } catch (e) {
      // ignore
    }
    try {
      await pool.query("ALTER TABLE students ADD COLUMN face_verify_disabled_reason VARCHAR(255) NULL");
    } catch (e) {
      // ignore
    }

    // Face enrollment fields (không dựa vào ảnh chân dung nữa)
    try {
      await pool.query("ALTER TABLE students ADD COLUMN face_enrolled_at DATETIME NULL");
    } catch (e) {
      // ignore
    }
    try {
      await pool.query("ALTER TABLE students ADD COLUMN face_descriptor_json LONGTEXT NULL");
    } catch (e) {
      // ignore
    }

    // Đảm bảo cột duration_minutes, content, license_types tồn tại
    try {
      await pool.query("ALTER TABLE lessons ADD COLUMN duration_minutes INT DEFAULT 45");
    } catch (e) {
      // Bỏ qua nếu cột đã tồn tại
    }
    try {
      await pool.query("ALTER TABLE lessons ADD COLUMN content LONGTEXT");
    } catch (e) {
      // Bỏ qua nếu cột đã tồn tại
    }
    try {
      await pool.query("ALTER TABLE lessons ADD COLUMN license_types TEXT NULL");
    } catch (e) {
      // Bỏ qua nếu cột đã tồn tại
    }

    // Tạo bảng subject_requirements (số giờ yêu cầu cho mỗi môn theo loại bằng)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subject_requirements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject_id INT NOT NULL,
        required_hours INT DEFAULT 0,
        license_class VARCHAR(50) DEFAULT '',
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ Đảm bảo table subject_requirements tồn tại");

    // Tạo bảng lesson_progress để lưu vị trí xem (giây) từng bài học
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lesson_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        lesson_id INT NOT NULL,
        learned_seconds INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
        UNIQUE KEY unique_student_lesson (student_id, lesson_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ Đảm bảo table lesson_progress tồn tại");

    // Override thời lượng bài học theo hạng GPLX
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lesson_duration_overrides (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lesson_id INT NOT NULL,
        license_class VARCHAR(50) NOT NULL,
        duration_minutes INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
        UNIQUE KEY uq_lesson_license (lesson_id, license_class)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ Đảm bảo table lesson_duration_overrides tồn tại");

    // Tạo bảng student_lesson_progress để lưu tiến độ từng bài học
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_lesson_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        lesson_id INT NOT NULL,
        minutes_learned INT DEFAULT 0,
        completed TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
        UNIQUE KEY unique_student_lesson (student_id, lesson_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ Đảm bảo table student_lesson_progress tồn tại");

    // Tạo bảng learning_history để lưu tiến độ học của học viên
    await pool.query(`
      CREATE TABLE IF NOT EXISTS learning_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        subject_id INT NOT NULL,
        minutes INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Xóa duplicate entries trước khi thêm unique key
    try {
      await pool.query(`
        DELETE lh1 FROM learning_history lh1
        INNER JOIN learning_history lh2
        WHERE lh1.id > lh2.id
        AND lh1.student_id = lh2.student_id
        AND lh1.subject_id = lh2.subject_id
      `);
      console.log("✅ Đã xóa duplicate entries trong learning_history");
    } catch (err) {
      console.warn("⚠️ Lỗi xóa duplicates:", err.message);
    }

    // Thêm unique key nếu chưa có
    try {
      await pool.query(`
        ALTER TABLE learning_history
        ADD UNIQUE KEY unique_student_subject (student_id, subject_id)
      `);
      console.log("✅ Đã thêm unique key cho learning_history");
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log("✅ Unique key đã tồn tại");
      } else {
        console.warn("⚠️ Không thể thêm unique key:", err.message);
      }
    }

    console.log("✅ Đảm bảo table learning_history tồn tại");



    // Insert các môn học chính thức nếu chưa có (không xóa dữ liệu cũ)
    const subjects = [
      { name: "Pháp luật giao thông đường bộ", code: "PL", hours: 90 },
      { name: "Đạo đức người lái xe", code: "DD", hours: 15 },
      { name: "Cấu tạo và sửa chữa thường xuyên", code: "CT", hours: 10 },
      { name: "Kỹ thuật lái xe", code: "KT", hours: 20 },
      { name: "Tình huống mô phỏng", code: "MP", hours: 4 },
    ];

    for (const sub of subjects) {
      // Kiểm tra xem đã có chưa
      const [[existing]] = await pool.query(
        "SELECT id FROM subjects WHERE code = ?",
        [sub.code]
      );

      if (!existing) {
        await pool.query(
          "INSERT INTO subjects (name, code, total_hours) VALUES (?, ?, ?)",
          [sub.name, sub.code, sub.hours]
        );
        console.log(`✅ Đã thêm môn học: ${sub.name}`);
      }
    }

    // Thêm dữ liệu subject_requirements sau khi đã có subjects
    const subjectRequirementsData = [
      { code: 'PL', hours: 90, license_class: 'B1' },
      { code: 'DD', hours: 15, license_class: 'B1' },
      { code: 'CT', hours: 10, license_class: 'B1' },
      { code: 'KT', hours: 20, license_class: 'B1' },
      { code: 'MP', hours: 4, license_class: 'B1' },
    ];

    // Xóa requirements cũ cho license_class B1 trước khi thêm mới
    await pool.query("DELETE FROM subject_requirements WHERE license_class = 'B1'");

    for (const req of subjectRequirementsData) {
      // Tìm subject_id theo code
      const [subjectRows] = await pool.query("SELECT id FROM subjects WHERE code = ?", [req.code]);
      if (subjectRows.length > 0) {
        const subjectId = subjectRows[0].id;
        await pool.query(
          "INSERT INTO subject_requirements (subject_id, required_hours, license_class) VALUES (?, ?, ?)",
          [subjectId, req.hours, req.license_class]
        );
        console.log(`✅ Đã thêm requirement cho ${req.code}: ${req.hours}h`);
      }
    }
  } catch (err) {
    console.error("❌ Lỗi tạo tables:", err.message);
  }
}

async function initializeApp() {
  try {
    await createDefaultAdmin();
    await createTables();
    console.log("✅ Database setup completed successfully");
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  }
}

initializeApp();

// Đổi chuyển toàn bộ truy vấn sang dùng pool từ db.js (MySQL)
app.use((req, res, next) => {
  console.log("Nhận request:", req.method, req.url);
  next();
});

// 1. Cấu hình nơi lưu file (Hỗ trợ cả PDF và Video)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Tạo folder chung 'uploads/files' cho gọn
    const dir = "./uploads/files";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Giữ nguyên tên file nhưng thêm timestamp để không trùng
    // Dùng Buffer để giữ tên tiếng Việt không bị lỗi font
    const originalName = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );
    cb(null, Date.now() + "-" + originalName.replace(/\s+/g, "_") );
  },
});

// 2. Bộ lọc file (Cho phép PDF và Video)
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "application/pdf" ||
    file.mimetype.startsWith("video/") // Chấp nhận mọi loại video (mp4, webm...)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ cho phép upload PDF hoặc Video!"), false);
  }
};

// 3. Khởi tạo Upload (Tăng giới hạn lên 100MB cho video)
const uploadFile = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// 4. API Upload chung (Thay thế API upload cũ)
app.post("/api/upload/file", uploadFile.single("file"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ message: "Lỗi upload hoặc file không hợp lệ" });
  }
  // Trả về đường dẫn file
  const fileUrl = `/uploads/files/${req.file.filename}`;
  // Trả về thêm loại file để Frontend biết đường xử lý
  const fileType = req.file.mimetype.startsWith("video/") ? "video" : "pdf";

  res.json({ url: fileUrl, type: fileType });
});

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

    // Check phone đã tồn tại chưa (tùy yêu cầu, có thể bỏ qua nếu muốn)
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

app.post("/api/login", async (req, res) => {
  console.log("🔍 ADMIN LOGIN BODY:", req.body);

  try {
    const { username, password } = req.body;

    console.log("[LOGIN] Received username:", username ? username : "<empty>");

    if (!username || !password) {
      return res.status(400).json({
        message: "Thiếu username hoặc password",
      });
    }

    // Fetch user rows and log for debugging
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ? LIMIT 1",
      [username]
    );
    console.log("[LOGIN] DB returned rows:", rows);
    const user = rows && rows.length > 0 ? rows[0] : null;

    if (!user) {
      return res.status(401).json({
        message: "Sai tài khoản hoặc mật khẩu",
      });
    }

    // So sánh password với bcrypt
    const isValidPassword = user ? await bcrypt.compare(password, user.password) : false;
    console.log("[LOGIN] password match:", isValidPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        message: "Sai tài khoản hoặc mật khẩu",
      });
    }

    const isAdminValue = user.is_admin === 1 || username === 'admin' || user.role === 'admin' || user.role === 'administrator';
    const role = user.role || (isAdminValue ? 'admin' : 'employee');

    // Preserve department/sogtvt roles for back-office access with limited permissions
    const finalRole = user.role && ['department', 'sogtvt', 'employee'].includes(user.role) ? user.role : role;

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        is_admin: isAdminValue ? 1 : 0,
        role: finalRole,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        is_admin: isAdminValue,
        role: finalRole,
      },
    });
  } catch (err) {
    console.error("🔍 ADMIN LOGIN ERROR 🔍");
    console.error(err);
    res.status(500).json({
      message: "Lỗi server khi đăng nhập admin",
      error: err.message,
    });
  }
});



// API: Lấy danh sách khóa học
app.get("/api/courses", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM courses");
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Lỗi DB", err });
  }
});
app.get("/", (req, res) => {
  res.send("Student Manager API is running!");
});

// API: Tạo khóa học mới (manual create)
app.post("/api/courses", async (req, res) => {
  const {
    ma_khoa_hoc,
    ten_khoa_hoc,
    hang_gplx,
    ngay_khai_giang,
    ngay_be_giang,
    so_ngay_hoc,
    so_hoc_sinh,
  } = req.body || {};

  if (!ma_khoa_hoc || !ten_khoa_hoc) {
    return res.status(400).json({ message: "Thiếu ma_khoa_hoc hoặc ten_khoa_hoc" });
  }

  try {
    const [[hasNgayHoc]] = await pool.query(
      "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'courses' AND COLUMN_NAME = 'ngay_hoc'"
    );

    const hasNgayHocColumn = Number(hasNgayHoc?.cnt || 0) > 0;

    const sql = hasNgayHocColumn
      ? "INSERT INTO courses (ma_khoa_hoc, ten_khoa_hoc, hang_gplx, ngay_khai_giang, ngay_be_giang, ngay_hoc, so_ngay_hoc, so_hoc_sinh) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      : "INSERT INTO courses (ma_khoa_hoc, ten_khoa_hoc, hang_gplx, ngay_khai_giang, ngay_be_giang, so_ngay_hoc, so_hoc_sinh) VALUES (?, ?, ?, ?, ?, ?, ?)";

    const params = hasNgayHocColumn
      ? [
          ma_khoa_hoc,
          ten_khoa_hoc,
          hang_gplx || "",
          ngay_khai_giang || null,
          ngay_be_giang || null,
          ngay_khai_giang || null,
          Number(so_ngay_hoc) || 0,
          Number(so_hoc_sinh) || 0,
        ]
      : [
          ma_khoa_hoc,
          ten_khoa_hoc,
          hang_gplx || "",
          ngay_khai_giang || null,
          ngay_be_giang || null,
          Number(so_ngay_hoc) || 0,
          Number(so_hoc_sinh) || 0,
        ];

    const [result] = await pool.query(sql, params);

    const [rows] = await pool.query("SELECT * FROM courses WHERE id = ?", [result.insertId]);
    res.json({ success: true, course: rows[0] });
  } catch (err) {
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Mã khóa học đã tồn tại" });
    }
    console.error("[POST /api/courses] Error:", err);
    res.status(500).json({ message: "Lỗi tạo khóa học", error: err.message });
  }
});

// API: Upload file XML hoặc Excel để thêm khóa học
app.post("/api/courses/upload", upload.single("file"), async (req, res) => {
  console.log("\n🔍 ===== BẮT ĐẦU UPLOAD XML ===== 🔍");
  console.log("File path:", req.file?.path);
  const filePath = req.file.path;
  const parser = new xml2js.Parser();
  fs.readFile(filePath, async (err, data) => {
    if (err) {
      console.error("❌ Lỗi đọc file:", err);
      return res.status(500).json({ message: "Lỗi đọc file", err });
    }
    console.log("✅ Đọc file thành công, kích thước:", data.length, "bytes");

    parser.parseString(data, async (err, result) => {
      if (err) {
        console.error("❌ Lỗi parse XML:", err);
        return res.status(400).json({ message: "Lỗi parse XML", err });
      }
      console.log("✅ Parse XML thành công");
      console.log("Cấu trúc XML - Top level keys:", Object.keys(result));
      let conn;
      try {
        console.log("🔍 Đang tìm cấu trúc XML...");
        if (!result.BAO_CAO1) {
          console.error("❌ Không tìm thấy BAO_CAO1 trong XML");
          return res
            .status(400)
            .json({ message: "Cấu trúc XML không đúng: thiếu BAO_CAO1" });
        }
        if (!result.BAO_CAO1.DATA || !result.BAO_CAO1.DATA[0]) {
          console.error("❌ Không tìm thấy DATA trong BAO_CAO1");
          return res
            .status(400)
            .json({ message: "Cấu trúc XML không đúng: thiếu DATA" });
        }
        if (
          !result.BAO_CAO1.DATA[0].KHOA_HOC ||
          !result.BAO_CAO1.DATA[0].KHOA_HOC[0]
        ) {
          console.error("❌ Không tìm thấy KHOA_HOC trong DATA");
          return res
            .status(400)
            .json({ message: "Cấu trúc XML không đúng: thiếu KHOA_HOC" });
        }
        if (
          !result.BAO_CAO1.DATA[0].NGUOI_LXS ||
          !result.BAO_CAO1.DATA[0].NGUOI_LXS[0]
        ) {
          console.error("❌ Không tìm thấy NGUOI_LXS trong DATA");
          return res
            .status(400)
            .json({ message: "Cấu trúc XML không đúng: thiếu NGUOI_LXS" });
        }

        const khoa = result.BAO_CAO1.DATA[0].KHOA_HOC[0];
        const hocvienList = result.BAO_CAO1.DATA[0].NGUOI_LXS[0].NGUOI_LX;
        console.log(
          "✅ Tìm thấy khóa học:",
          khoa.MA_KHOA_HOC?.[0] || khoa.TEN_KHOA_HOC?.[0]
        );
        console.log(
          "✅ Số lượng học viên:",
          Array.isArray(hocvienList) ? hocvienList.length : "Không phải array"
        );

        if (!Array.isArray(hocvienList)) {
          console.error(
            "❌ hocvienList không phải là array:",
            typeof hocvienList
          );
          return res
            .status(400)
            .json({ message: " Không tìm thấy danh sách học viên trong XML" });
        }

        // Lấy thông tin ngày học từ request body (nếu có)
        const { ngay_hoc, so_ngay_hoc } = req.body;
        console.log("🔍 Thông tin ngày học:", { ngay_hoc, so_ngay_hoc });

        const [[hasNgayHoc]] = await pool.query(
          "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'courses' AND COLUMN_NAME = 'ngay_hoc'"
        );
        const hasNgayHocColumn = Number(hasNgayHoc?.cnt || 0) > 0;

        const sql = hasNgayHocColumn
          ? "INSERT INTO courses (ma_khoa_hoc, ten_khoa_hoc, ngay_khai_giang, ngay_be_giang, ngay_hoc, so_ngay_hoc, so_hoc_sinh, hang_gplx) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
          : "INSERT INTO courses (ma_khoa_hoc, ten_khoa_hoc, ngay_khai_giang, ngay_be_giang, so_ngay_hoc, so_hoc_sinh, hang_gplx) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const sqlstudent = `
          INSERT INTO students (ho_va_ten, ngay_sinh, hang_gplx, so_cmt, ma_khoa_hoc, status, anh_chan_dung)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        try {
          await pool.query(
            `ALTER TABLE students ADD COLUMN anh_chan_dung LONGTEXT NULL`
          );
          console.log("✅ Đảm bảo cột anh_chan_dung tồn tại (LONGTEXT)");
        } catch (preErr) {
          if (preErr.code === "ER_DUP_FIELDNAME") {
            try {
              await pool.query(
                `ALTER TABLE students MODIFY COLUMN anh_chan_dung LONGTEXT NULL`
              );
              console.log("✅ Đã xác nhận cột ảnh là LONGTEXT");
            } catch (modErr) {
              console.warn(
                "⚠️ Không thể sửa cột ảnh:",
                modErr.message
              );
            }
          } else {
            console.warn("⚠️ Bỏ qua bước đảm bảo cột ảnh:", preErr.message);
          }
        }
        conn = await pool.getConnection();
        try {
          await conn.beginTransaction();
          // Thêm khóa học
          const courseParams = hasNgayHocColumn
            ? [
                khoa.MA_KHOA_HOC[0],
                khoa.TEN_KHOA_HOC[0],
                khoa.NGAY_KHAI_GIANG[0],
                khoa.NGAY_BE_GIANG[0],
                ngay_hoc || khoa.NGAY_KHAI_GIANG[0], // Sử dụng ngay_hoc nếu có, không thì dùng ngày khai giảng
                so_ngay_hoc || 0, // Sử dụng so_ngay_hoc nếu có
                parseInt(khoa.SO_HOC_SINH[0]),
                khoa.HANG_GPLX?.[0] || "",
              ]
            : [
                khoa.MA_KHOA_HOC[0],
                khoa.TEN_KHOA_HOC[0],
                khoa.NGAY_KHAI_GIANG[0],
                khoa.NGAY_BE_GIANG[0],
                so_ngay_hoc || 0, // Sử dụng so_ngay_hoc nếu có
                parseInt(khoa.SO_HOC_SINH[0]),
                khoa.HANG_GPLX?.[0] || "",
              ];

          await conn.query(sql, courseParams);
          // Thêm học viên
          console.log(`\n🔍 Bắt đầu xử lý ${hocvienList.length} học viên...`);
          // for (let i = 0; i < hocvienList.length; i++) {
          //   const hocvien = hocvienList[i];
          //   // Lấy tên, nếu lỗi font hoặc mảng thì lấy phần tử đầu
          //   const studentName = Array.isArray(hocvien.HO_VA_TEN)
          //     ? hocvien.HO_VA_TEN[0]
          //     : hocvien.HO_VA_TEN || `Student_${i + 1}`;

          //   console.log(`\n--- Đang xử lý: ${studentName} ---`);

          //   // --- 1. HÀM HỖ TRỢ LẤY DỮ LIỆU SẠCH TỪ XML ---
          //   // Giúp lấy text bất kể nó nằm trong mảng [0] hay object có thuộc tính _
          //   const getCleanText = (node) => {
          //     if (!node) return null;
          //     if (Array.isArray(node)) return getCleanText(node[0]); // Nếu là mảng, bóc lặp về mảng ra
          //     if (typeof node === "object") {
          //       // Trường hợp XML có thuộc tính (VD: <ANH format="jpg">Base64...</ANH>)
          //       if (node._) return node._;
          //       return null;
          //     }
          //     return String(node).trim(); // Trả về chuỗi sạch
          //   };

          //   // --- 2. TÁCH DỮ LIỆU ẢNH (QUÁ TRÌNH NGƯỢC LẠI) ---
          //   let rawAnh = null;

          //   // Cách 1: Tìm trong HO_SO (Cấu trúc thường gặp)
          //   if (hocvien.HO_SO) {
          //     let hoSoNode = Array.isArray(hocvien.HO_SO)
          //       ? hocvien.HO_SO[0]
          //       : hocvien.HO_SO;
          //     // Danh sách các tên trường ảnh có thể xuất hiện
          //     const possibleKeys = [
          //       "ANH_CHAN_DUNG",
          //       "anh_chan_dung",
          //       "IMAGE",
          //       "AnhChanDung",
          //       "ANH",
          //       "anh",
          //     ];

          //     for (const key of possibleKeys) {
          //       if (hoSoNode[key]) {
          //         rawAnh = getCleanText(hoSoNode[key]);
          //         if (rawAnh) {
          //           console.log(`✅ Tìm thấy ảnh trong HO_SO.${key}`);
          //           break;
          //         }
          //       }
          //     }
          //   }

          //   // Cách 2: Tìm trực tiếp bên ngoài (nếu không có HO_SO)
          //   if (!rawAnh) {
          //     const directKeys = [
          //       "ANH_CHAN_DUNG",
          //       "anh_chan_dung",
          //       "IMAGE",
          //       "ANH",
          //     ];
          //     for (const key of directKeys) {
          //       if (hocvien[key]) {
          //         rawAnh = getCleanText(hocvien[key]);
          //         if (rawAnh) {
          //           console.log(`✅ Tìm thấy ảnh trực tiếp ở key: ${key}`);
          //           break;
          //         }
          //       }
          //     }
          //   }

          //   // --- 3. XỬ LÝ CHUỖI BASE64 ---
          //   let anhFinal = null;
          //   if (rawAnh && rawAnh.length > 100) {
          //     // Ảnh phải có dữ liệu dài dài chất
          //     // Quan trọng: Xóa hết dấu cách, xuống dòng (\n) thì ảnh mới hiển thị được
          //     anhFinal = rawAnh.replace(/\s+/g, "");
          //     console.log(`🔍 Kích thước ảnh: ${anhFinal.length} ký tự`);
          //   } else {
          //     console.log(
          //       `⚠️ CẢNH BÁO: Không tìm thấy ảnh hoặc dữ liệu quá ngắn! (Set NULL)`
          //     );
          //     // Debug: in ra các key hiện có để soi lỗi
          //     // console.log("Các trường dữ liệu đang có:", Object.keys(hocvien));
          //   }

          //   // --- 4. LƯU VÀO DATABASE ---
          //   // Lấy các thông tin khác
          //   const ngaySinh = getCleanText(hocvien.NGAY_SINH);
          //   const hangGplx =
          //     getCleanText(hocvien.HANG_GPLX) ||
          //     getCleanText(khoa.HANG_GPLX) ||
          //     "";
          //   const soCmt = getCleanText(hocvien.SO_CMT) || "";

          //   try {
          //     // Câu lệnh SQL insert
          //     const [result] = await conn.query(sqlstudent, [
          //       studentName,
          //       ngaySinh,
          //       hangGplx,
          //       soCmt,
          //       getCleanText(khoa.MA_KHOA_HOC) || "",
          //       "chua thi",
          //       anhFinal, // Truyền chuỗi ảnh đã xử lý sạch vào đây
          //     ]);
          //     console.log(`🔍 Đã lưu thành công ID: ${result.insertId}`);
          //   } catch (insertErr) {
          //     // Nếu lỗi do ảnh quá lớn (Packet too large) -> set ảnh null để lưu thông tin khác
          //     console.error(
          //       `❌ Lỗi lưu DB cho ${studentName}:`,
          //       insertErr.message
          //     );
          //     if (
          //       insertErr.message.includes("large") ||
          //       insertErr.message.includes("packet")
          //     ) {
          //       console.log(
          //         "⚠️ Ảnh quá lớn so với cấu hình MySQL (max_allowed_packet). Đang lưu lại học viên không kèm ảnh..."
          //       );
          //       await conn.query(sqlstudent, [
          //         studentName,
          //         ngaySinh,
          //         hangGplx,
          //         soCmt,
          //         getCleanText(khoa.MA_KHOA_HOC) || "",
          //         "chua thi",
          //         null,
          //       ]);
          //     }
          //   }
          // }
          console.log(
            `\n🔍 Bắt đầu xử lý ${hocvienList.length} học viên (Chỉ tóm tắt quá trình)...`
          );

          // --- HÀM TÁCH ẢNH ĐỔ QUY (QUÁ TRÌNH NGƯỢC LẠI) ---
          const findLongString = (obj, depth = 0) => {
            if (!obj || depth > 5) return null; // Tránh lặp vô hạn, chỉ quét sâu 5 cấp

            // Nếu bản thân nó là chuỗi dài > 1000 ký tự -> Khả năng cao là ảnh
            if (typeof obj === "string" && obj.length > 1000) {
              return obj;
            }

            // Nếu là Mảng hoặc Object, đệ quy tìm bên trong
            if (typeof obj === "object") {
              // Ưu tiên tìm trong key có chứa "ANH" hoặc "IMAGE" trước
              const keys = Object.keys(obj);
              const priorityKeys = keys.filter(
                (k) =>
                  k.toUpperCase().includes("ANH") ||
                  k.toUpperCase().includes("IMG")
              );
              const otherKeys = keys.filter(
                (k) =>
                  !k.toUpperCase().includes("ANH") &&
                  !k.toUpperCase().includes("IMG")
              );

              // Quét key ưu tiên trước
              for (const key of [...priorityKeys, ...otherKeys]) {
                // Bỏ qua các key hệ thống của xml2js
                if (key === "$") continue;

                const result = findLongString(obj[key], depth + 1);
                if (result) return result;
              }
            }
            return null;
          };
          // --- HÀM LẤY TEXT NGẮN (GIÚP AN TOÀN) ---
          const getText = (node) => {
            if (!node) return "";
            if (Array.isArray(node)) return getText(node[0]);
            if (typeof node === "object") return node._ || "";
            return String(node).trim();
          };
          // vòng lặp chính
          for (let i = 0; i < hocvienList.length; i++) {
            const hocvien = hocvienList[i];

            // Lấy tên (xử lý an toàn)
            let studentName = "Unknown";
            if (hocvien.HO_VA_TEN)
              studentName = Array.isArray(hocvien.HO_VA_TEN)
                ? hocvien.HO_VA_TEN[0]
                : hocvien.HO_VA_TEN;

            console.log(
              `\n--- [${i + 1}] Đang quét dữ liệu của: ${studentName} ---`
            );

            // 1. GỌI HÀM QUÉT ẢNH
            let rawAnh = findLongString(hocvien);
            let anhFinal = null;

            if (rawAnh) {
              try {
                // 1. Làm sạch chuỗi
                let cleanString = rawAnh.replace(/\s+/g, "");
                if (cleanString.includes(","))
                  cleanString = cleanString.split(",")[1];

                // 2. Tạo Buffer
                const imageBuffer = Buffer.from(cleanString, "base64");

                // 3. Kiểm tra xem có phải JPEG 2000 không (Magic bytes: 00 00 00 0C 6A 50)
                const isJP2 = imageBuffer
                  .toString("hex", 0, 12)
                  .includes("0000000c6a50");

                if (isJP2) {
                  console.log(
                    `⚠️ Phát hiện JPEG 2000 (${studentName}). Đang gọi ImageMagick...`
                  );

                  const tempDir = path.join(__dirname, "temp_images");
                  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

                  const tempFileName = `temp_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(7)}`;
                  const inputPath = path.join(tempDir, `${tempFileName}.jp2`);
                  const outputPath = path.join(tempDir, `${tempFileName}.jpg`);

                  // Ghi file tạm
                  fs.writeFileSync(inputPath, imageBuffer);

                  // 🔍🔍🔍 SỬA ĐƯỜNG DẪN NÀY NẾU MÁY BẠN KHÁC 🔍🔍🔍
                  // Lưu ý: Dùng 2 dấu gạch chéo "\\"

                  const magickPath = "magick"; // Trên Linux chỉ cần gọi tên lệnh là được
                  // 🔍🔍🔍

                  try {
                    // Kiểm tra file exe có tồn tại không trước khi chạy
                    // if (!fs.existsSync(magickPath)) {
                    //   throw new Error(
                    //     `Không tìm thấy file magick.exe tại: ${magickPath}`
                    //   );
                    // }

                    // Gọi lệnh trực tiếp vào file exe
                    execSync(
                      `"${magickPath}" "${inputPath}" -quality 90 "${outputPath}"`
                    );

                    // Đọc lại file JPG
                    if (fs.existsSync(outputPath)) {
                      const jpgData = fs.readFileSync(outputPath);
                      anhFinal = `data:image/jpeg;base64,${jpgData.toString(
                        "base64"
                      )}`;
                      console.log(
                        `✅ ImageMagick convert thành công! (Size: ${anhFinal.length})`
                      );
                    } else {
                      throw new Error(
                        "Convert xong nhưng không thấy file output jpg"
                      );
                    }
                  } catch (exeErr) {
                    console.error(`❌ Lỗi chạy ImageMagick: ${exeErr.message}`);
                    // Fallback: Lưu ảnh gốc (không hiển thị nhưng không mất dữ liệu)
                    anhFinal = `data:image/jp2;base64,${cleanString}`;
                  } finally {
                    // Dọn rác
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                  }
                } else {
                  // --- Ảnh thường (JPG/PNG) ---
                  const jpegBuffer = await sharp(imageBuffer)
                    .toFormat("jpeg")
                    .jpeg({ quality: 90 })
                    .toBuffer();
                  anhFinal = `data:image/jpeg;base64,${jpegBuffer.toString(
                    "base64"
                  )}`;
                  console.log(`✅ Sharp convert thành công!`);
                }
              } catch (convertErr) {
                console.error(`❌ Lỗi xử lý ảnh chung: ${convertErr.message}`);
                anhFinal = rawAnh; // Lưu tạm cái cũ
              }
            } else {
              console.log(`❌ KHÔNG CÓ DỮ LIỆU ẢNH`);
            }

            // 2. LẤY CÁC THÔNG TIN KHÁC (Hàm hỗ trợ lấy text ngắn)
            const getText = (node) => {
              if (!node) return "";
              if (Array.isArray(node)) return getText(node[0]);
              if (typeof node === "object") return node._ || "";
              return String(node).trim();
            };

            const ngaySinh = getText(hocvien.NGAY_SINH);
            const hangGplx =
              getText(hocvien.HANG_GPLX) || getText(khoa.HANG_GPLX) || "";
            const soCmt = getText(hocvien.SO_CMT) || "";

            // 3. LƯU VÀO DB
            try {
              const [result] = await conn.query(sqlstudent, [
                studentName,
                ngaySinh,
                hangGplx,
                soCmt,
                getText(khoa.MA_KHOA_HOC) || "",
                "chua thi",
                anhFinal, // Truyền ảnh vào
              ]);
              console.log(`🔍 Saved ID: ${result.insertId}`);
            } catch (insertErr) {
              console.error(`❌ Lỗi Insert DB:`, insertErr.message);
              // Nếu lỗi do gói tin quá lớn
              if (
                insertErr.message.includes("packet") ||
                insertErr.message.includes("large")
              ) {
                console.log(
                  "⚠️ Lỗi: Ảnh quá lớn so với cấu hình MySQL (max_allowed_packet)."
                );
                console.log(
                  "🔍 Bạn cần chạy lệnh SQL: SET GLOBAL max_allowed_packet = 1073741824;"
                );
              }
            }
          }
          await conn.commit();
          console.log(
            `\n✅ Hoàn thành! Đã thêm ${hocvienList.length} học viên vào database.\n`
          );
          res.json({ success: true });
        } catch (err) {
          if (conn) await conn.rollback();
          // MySQL duplicate entry error code: 'ER_DUP_ENTRY'
          if (err.code === "ER_DUP_ENTRY") {
            return res
              .status(409)
              .json({ message: "Khóa học hoặc học viên đã tồn tại!" });
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
//xóa học viên
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

  } = req.body;

  const formatDateToMySQL = (dateInput) => {
    if (!dateInput) return null;
    try {
      return new Date(dateInput).toISOString().split("T")[0];
    } catch (e) {
      return null;
    }
  };

  const ngay_sinh_mysql = formatDateToMySQL(ngay_sinh);

  const sql = `
    UPDATE students SET
      ho_va_ten = ?, ngay_sinh = ?, hang_gplx = ?, so_cmt = ?, ma_khoa_hoc = ?,

    WHERE id = ?
  `;
  try {
    await pool.query(sql, [
      ho_va_ten,
      ngay_sinh_mysql,
      hang_gplx,
      so_cmt,
      ma_khoa_hoc,

      id,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error("PUT /api/students/:id error:", err);
    res.status(500).json({
      message: "Lỗi khi cập nhật",
      error: err.message,
      code: err.code,
    });
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

  } = req.body;
  try {
    await pool.query(
      `INSERT INTO students
       (ho_va_ten, ngay_sinh, hang_gplx, so_cmt, ma_khoa_hoc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ho_va_ten,
        ngay_sinh,
        hang_gplx,
        so_cmt,
        ma_khoa_hoc,

      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// xóa khóa học
app.delete("/api/courses/:id", async (req, res) => {
  const courseId = req.params.id;
  try {
    const [result] = await pool.query(
      "SELECT ma_khoa_hoc FROM courses WHERE id = ?",
      [courseId]
    );
    if (!result || result.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }
    const maKhoaHoc = result[0].ma_khoa_hoc;
    await pool.query("DELETE FROM students WHERE ma_khoa_hoc = ?", [maKhoaHoc]);
    await pool.query("DELETE FROM courses WHERE id = ?", [courseId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa khóa học", error: err });
  }
});

// sửa khóa học
app.put("/api/courses/:id", async (req, res) => {
  const { id } = req.params;
  const {
    ma_khoa_hoc,
    ten_khoa_hoc,
    ngay_khai_giang,
    ngay_be_giang,
    so_ngay_hoc,
    so_hoc_sinh,
  } = req.body;
  console.log("[PUT /courses/:id] Dữ liệu nhận:", req.body);
  console.log("[PUT /courses/:id] so_ngay_hoc type:", typeof so_ngay_hoc, "value:", so_ngay_hoc);

  const sql = `
    UPDATE courses
    SET ma_khoa_hoc = ?, ten_khoa_hoc = ?, ngay_khai_giang = ?, ngay_be_giang = ?, so_ngay_hoc = ?, so_hoc_sinh = ?
    WHERE id = ?
  `;

  try {
    const [result] = await pool.query(sql, [
      ma_khoa_hoc,
      ten_khoa_hoc,
      ngay_khai_giang,
      ngay_be_giang,
      so_ngay_hoc,
      so_hoc_sinh,
      id,
    ]);

    console.log("[PUT /courses/:id] Update result:", result);

    // Lấy lại bản ghi mới nhất để trả về cho FE
    const [rows] = await pool.query("SELECT * FROM courses WHERE id = ?", [id]);
    console.log("[PUT /courses/:id] Updated course:", rows[0]);

    res.json({ success: true, course: rows[0] });
  } catch (err) {
    console.error("[PUT /courses/:id] Error:", err);
    console.error("[PUT /courses/:id] Error code:", err.code);
    console.error("[PUT /courses/:id] Error message:", err.message);
    res.status(500).json({ message: "Lỗi khi cập nhật", error: err.message, code: err.code });
  }
});

// API: Tìm kiếm học viên
app.get("/api/students", async (req, res) => {
  const { name, cccd, status, ma_khoa_hoc } = req.query;
  let sql = `
    SELECT s.*,
           c.ten_khoa_hoc,
           c.ma_khoa_hoc as course_code,
           COALESCE(s.anh_chan_dung, '') as anh
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
    console.error("Students API error:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

//// Cập nhật trạng thái học viên
app.post("/api/students/update-status", async (req, res) => {
  const { id, field, value } = req.body;
  const allowedFields = [
    "status_ly_thuyet",
    "status_mo_phong",
    "status_duong",
    "status_truong",
    "status",
    "face_verify_required",
    "face_verify_disabled_reason",
    "face_enrolled_at",
  ];
  if (!id || !field || !allowedFields.includes(field)) {
    return res.status(400).json({ error: "Thiếu hoặc sai thông tin update" });
  }
  const validStatuses = ["thi", "vang", "rot", "dat", "chua thi"];

  if (field === "face_verify_required") {
    const v = Number(value);
    if (!(v === 0 || v === 1)) {
      return res.status(400).json({ error: "Giá trị face_verify_required không hợp lệ" });
    }
    const sql = `UPDATE students SET ${field} = ? WHERE id = ?`;
    try {
      await pool.query(sql, [v, id]);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (field === "face_verify_disabled_reason") {
    const sql = `UPDATE students SET ${field} = ? WHERE id = ?`;
    try {
      await pool.query(sql, [value || null, id]);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (field === "face_enrolled_at") {
    // admin can force student to re-enroll by setting null
    const sql = `UPDATE students SET face_enrolled_at = ?, face_descriptor_json = ? WHERE id = ?`;
    try {
      const v = value ? String(value) : null;
      // If setting to null -> clear descriptor too
      await pool.query(sql, [v, null, id]);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (!validStatuses.includes(value)) {
    return res.status(400).json({ error: "Trạng thái không hợp lệ" });
  }
  const sql = `UPDATE students SET ${field} = ? WHERE id = ?`;
  try {
    await pool.query(sql, [value, id]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// API: Thống kê học tập (thay thế thống kê thi cũ)
app.get("/api/learning-stats", async (req, res) => {
  try {
    // 1. Thống kê tổng quan
    const [[{ total_students }]] = await pool.query("SELECT COUNT(*) as total_students FROM students");
    const [[{ total_courses }]] = await pool.query("SELECT COUNT(*) as total_courses FROM courses");
    const [[{ total_subjects }]] = await pool.query("SELECT COUNT(*) as total_subjects FROM subjects");
    const [[{ total_lessons }]] = await pool.query("SELECT COUNT(*) as total_lessons FROM lessons");

    // 2. Thống kê tiến độ học viên
    const [studentProgress] = await pool.query(`
      SELECT
        s.id,
        s.ho_va_ten,
        s.so_cmt,
        s.hang_gplx,
        COALESCE(SUM(lh.minutes), 0) / 60 as learned_hours,
        COUNT(DISTINCT lh.subject_id) as subjects_started,
        (SELECT COUNT(*) FROM subjects) as total_subjects
      FROM students s
      LEFT JOIN learning_history lh ON s.id = lh.student_id
      GROUP BY s.id, s.ho_va_ten, s.so_cmt, s.hang_gplx
      ORDER BY learned_hours DESC
      LIMIT 20
    `);

    // 3. Thống kê tiến độ môn học
    const [subjectProgress] = await pool.query(`
      SELECT
        sub.id,
        sub.name as subject_name,
        sub.code,
        COUNT(DISTINCT l.id) as total_lessons,
        COUNT(DISTINCT CASE WHEN slp.completed = 1 THEN slp.lesson_id END) as completed_lessons,
        COALESCE(SUM(lh.minutes), 0) / 60 as total_learned_hours,
        AVG(CASE WHEN slp.completed = 1 THEN 100 ELSE
          CASE WHEN slp.minutes_learned > 0 THEN
            LEAST((slp.minutes_learned / (l.duration_minutes * 60)) * 100, 99)
          ELSE 0 END
        END) as avg_completion_rate
      FROM subjects sub
      LEFT JOIN lessons l ON sub.id = l.subject_id
      LEFT JOIN student_lesson_progress slp ON l.id = slp.lesson_id
      LEFT JOIN learning_history lh ON sub.id = lh.subject_id
      GROUP BY sub.id, sub.name, sub.code
      ORDER BY total_learned_hours DESC
    `);

    // 4. Thống kê khóa học
    const [courseStats] = await pool.query(`
      SELECT
        c.id,
        c.ten_khoa_hoc,
        c.ma_khoa_hoc,
        c.hang_gplx,
        COUNT(DISTINCT s.id) as total_students,
        COUNT(DISTINCT CASE WHEN s.status = 'dat' THEN s.id END) as passed_students,
        COUNT(DISTINCT CASE WHEN s.status = 'rot' THEN s.id END) as failed_students,
        AVG(CASE WHEN lh.minutes > 0 THEN lh.minutes / 60 ELSE 0 END) as avg_study_hours
      FROM courses c
      LEFT JOIN students s ON c.ma_khoa_hoc = s.ma_khoa_hoc
      LEFT JOIN learning_history lh ON s.id = lh.student_id
      GROUP BY c.id, c.ten_khoa_hoc, c.ma_khoa_hoc, c.hang_gplx
      ORDER BY total_students DESC
    `);

    res.json({
      overview: {
        total_students,
        total_courses,
        total_subjects,
        total_lessons
      },
      student_progress: studentProgress,
      subject_progress: subjectProgress,
      course_stats: courseStats
    });
  } catch (err) {
    console.error("Learning stats error:", err);
    res.status(500).json({ error: err.message });
  }
});


// Middleware kiểm tra admin (chỉ admin mới có quyền quản lý users)
const checkAdmin = async (req, res, next) => {
  console.log("[DEBUG] ID from token:", req.user?.id);
  try {
    const [rows] = await pool.query("SELECT is_admin, role FROM users WHERE id = ?", [
      req.user.id,
    ]);
    const userRow = rows[0];
    const isAdmin = userRow?.is_admin === 1 || userRow?.role === 'admin' || userRow?.role === 'administrator';

    if (rows.length === 0 || !isAdmin) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Middleware kiểm tra admin hoặc department (cho các chức năng khác)
const checkAdminOrDepartment = async (req, res, next) => {
  console.log("[DEBUG] ID from token:", req.user?.id);
  try {
    const [rows] = await pool.query("SELECT is_admin, role FROM users WHERE id = ?", [
      req.user.id,
    ]);
    const userRow = rows[0];
    const isAdmin = userRow?.is_admin === 1 || userRow?.role === 'admin' || userRow?.role === 'administrator';
    const isDepartment = userRow?.role === 'department' || userRow?.role === 'sogtvt' || userRow?.role === 'employee';
    const hasAccess = isAdmin || isDepartment;

    if (rows.length === 0 || !hasAccess) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Route lấy danh sách người dùng
app.get("/api/users", authenticateToken, checkAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, email, phone, role FROM users"
    );
    res.json(rows);
  } catch (err) {
    console.error("Lỗi truy vấn users:", err);
    res.status(500).json({ message: "Lỗi truy vấn database" });
  }
});

app.post("/api/users", authenticateToken, checkAdmin, async (req, res) => {
  const { username, email, phone, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const [[dup]] = await pool.query(
      "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
      [username, email]
    );
    if (dup) return res.status(409).json({ message: "Tên đăng nhập hoặc email đã tồn tại" });

    await pool.query(
      "INSERT INTO users (username, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
      [username, email, phone, hashedPassword, role || "employee"]
    );
    res.json({ message: "Thêm người dùng thành công!" });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Tên đăng nhập hoặc email đã tồn tại" });
    console.error("Lỗi tạo user:", err);
    res.status(500).json({ message: "Lỗi server khi thêm user" });
  }
});

app.put("/api/users/:id", authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, email, phone, role } = req.body;
  try {
    const [[dup]] = await pool.query(
      "SELECT id FROM users WHERE (username = ? OR email = ?) AND id <> ? LIMIT 1",
      [username, email, id]
    );
    if (dup) return res.status(409).json({ message: "Tên đăng nhập hoặc email đã tồn tại" });

    const [[existing]] = await pool.query("SELECT role FROM users WHERE id = ? LIMIT 1", [id]);
    const finalRole = role || existing?.role || "employee";

    await pool.query(
      "UPDATE users SET username = ?, email = ?, phone = ?, role = ? WHERE id = ?",
      [username, email, phone, finalRole, id]
    );
    res.json({ message: "Cập nhật thành công!" });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Tên đăng nhập hoặc email đã tồn tại" });
    console.error("Lỗi cập nhật user:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật user" });
  }
});
app.delete(
  "/api/users/:id",
  authenticateToken,
  checkAdmin,
  async (req, res) => {
    const { id } = req.params;
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "Xóa thành công!" });
  }
);

// Thêm vào file app.js (BE)
app.get("/api/quick-stats", async (req, res) => {
  try {
    const [[{ count: studentCount }]] = await pool.query(
      "SELECT COUNT(*) as count FROM students"
    );
    const [[{ count: courseCount }]] = await pool.query(
      "SELECT COUNT(*) as count FROM courses"
    );
    res.json({
      students: studentCount,
      courses: courseCount,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy thống kê nhanh!" });
  }
});



// đăng ký lịch học
// ...existing code...

// Tạo lịch mới (admin)
app.post("/api/schedules", authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { course_id, start_time, end_time, capacity, location, notes } =
      req.body;
    const [result] = await pool.query(
      "INSERT INTO schedules (course_id, start_time, end_time, capacity, location, notes) VALUES (?, ?, ?, ?, ?, ?)",
      [
        course_id,
        start_time,
        end_time,
        capacity || 0,
        location || null,
        notes || null,
      ]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách lịch (optionally filter by course_id)
app.get("/api/schedules", async (req, res) => {
  try {
    const { course_id } = req.query;
    let q =
      "SELECT s.*, c.ten_khoa_hoc, c.ma_khoa_hoc FROM schedules s LEFT JOIN courses c ON s.course_id = c.id";
    const params = [];
    if (course_id) {
      q += " WHERE s.course_id = ?";
      params.push(course_id);
    }
    q += " ORDER BY s.start_time";
    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Chi tiết lịch kèm số đăng ký
app.get("/api/schedules/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [[schedule]] = await pool.query(
      "SELECT s.*, c.ten_khoa_hoc FROM schedules s LEFT JOIN courses c ON s.course_id=c.id WHERE s.id = ?",
      [id]
    );
    if (!schedule) return res.status(404).json({ error: "Not found" });
    const [countRows] = await pool.query(
      "SELECT COUNT(*) AS cnt FROM registrations WHERE schedule_id = ?",
      [id]
    );
    schedule.registered = countRows[0].cnt || 0;
    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Đăng ký học viên vào 1 lịch (authenticated users)
app.post("/api/schedules/:id/register", authenticateToken, async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const { student_id } = req.body;
    // kiểm tra schedule
    const [sRows] = await pool.query(
      "SELECT capacity FROM schedules WHERE id = ?",
      [scheduleId]
    );
    if (!sRows.length)
      return res.status(404).json({ error: "Schedule not found" });
    const capacity = sRows[0].capacity || 0;
    // đếm đăng ký
    const [cRows] = await pool.query(
      "SELECT COUNT(*) AS cnt FROM registrations WHERE schedule_id = ?",
      [scheduleId]
    );
    const registered = cRows[0].cnt || 0;
    if (capacity > 0 && registered >= capacity)
      return res.status(400).json({ error: "Schedule is full" });
    // tạo đăng ký
    await pool.query(
      "INSERT INTO registrations (schedule_id, student_id) VALUES (?, ?)",
      [scheduleId, student_id]
    );
    res.json({ success: true });
  } catch (err) {
    if (err && err.code === "ER_DUP_ENTRY")
      return res.status(400).json({ error: "Already registered" });
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Hủy đăng ký
app.delete(
  "/api/schedules/:id/register/:studentId",
  authenticateToken,
  async (req, res) => {
    try {
      const { id, studentId } = req.params;
      await pool.query(
        "DELETE FROM registrations WHERE schedule_id = ? AND student_id = ?",
        [id, studentId]
      );
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

// Lấy danh sách học viên đăng ký cho 1 lịch
app.get(
  "/api/schedules/:id/registrations",
  authenticateToken,
  checkAdmin,
  async (req, res) => {
    try {
      const scheduleId = req.params.id;
      const [rows] = await pool.query(
        `SELECT r.*, st.ho_va_ten, st.so_cmt, st.hang_gplx
       FROM registrations r
       JOIN students st ON r.student_id = st.id
       WHERE r.schedule_id = ?
       ORDER BY r.registered_at`,
        [scheduleId]
      );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

// API: Lấy danh sách tất cả đăng ký lịch học (cho trang quản lý)
app.get(
  "/api/schedule-registrations",
  authenticateToken,
  checkAdmin,
  async (req, res) => {
    try {
      const [rows] = await pool.query(`
      SELECT
        r.id,
        r.registered_at,
        r.status,
        s.ho_va_ten as student_name,
        s.so_cmt as student_username,
        c.ten_khoa_hoc as course_name,
        c.ma_khoa_hoc as course_code,
        sch.start_time,
        sch.end_time,
        sch.location
      FROM registrations r
      JOIN students s ON r.student_id = s.id
      JOIN schedules sch ON r.schedule_id = sch.id
      LEFT JOIN courses c ON sch.course_id = c.id
      ORDER BY r.registered_at DESC
    `);

      // Group by registration to create selected_slots structure
      const groupedData = rows.reduce((acc, row) => {
        const key = `${row.student_name}-${row.course_name}`;
        if (!acc[key]) {
          acc[key] = {
            id: row.id,
            student_name: row.student_name,
            student_username: row.student_username,
            course_name: row.course_name,
            course_code: row.course_code,
            registered_at: row.registered_at,
            status: row.status || "active",
            selected_slots: [],
          };
        }

        // Add slot information
        acc[key].selected_slots.push({
          date: new Date(row.start_time).toISOString().split("T")[0],
          period:
            new Date(row.start_time).getHours() < 12 ? "morning" : "afternoon",
          start_time: row.start_time,
          end_time: row.end_time,
          location: row.location,
        });

        return acc;
      }, {});

      const result = Object.values(groupedData);
      res.json(result);
    } catch (err) {
      console.error("Error fetching schedule registrations:", err);
      res.status(500).json({
        message: "Lỗi lấy danh sách đăng ký lịch học",
        error: err.message,
      });
    }
  }
);

// API: Lấy yêu cầu môn học theo subject_id
app.get("/api/subject-requirements", async (req, res) => {
  try {
    const { subject_id } = req.query;

    if (!subject_id) {
      return res.status(400).json({ message: "Thiếu subject_id" });
    }

    const [rows] = await pool.query(
      "SELECT * FROM subject_requirements WHERE subject_id = ?",
      [subject_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching subject requirements:", err);
    res.status(500).json({
      message: "Lỗi lấy yêu cầu môn học",
      error: err.message,
    });
  }
});





// ...existing code...
// dành cho trang học viên

// be/app.js

app.post("/api/student/login", async (req, res) => {
  try {
    const { so_cmt } = req.body;

    console.log("🔍 so_cmt nhận được:", so_cmt);

    if (!so_cmt || so_cmt.trim() === "") {
      return res.status(400).json({
        message: "CCCD rỗng hoặc không hợp lệ",
        body: req.body,
      });
    }

    // Join with courses to fetch course name if available
    const [[student]] = await pool.query(
      `SELECT s.*, c.ten_khoa_hoc AS course_name, c.ma_khoa_hoc AS course_code
       FROM students s
       LEFT JOIN courses c ON s.ma_khoa_hoc = c.ma_khoa_hoc
       WHERE s.so_cmt = ?
       LIMIT 1`,
      [so_cmt]
    );

    if (!student) {
      return res.status(401).json({ message: "Không tìm thấy học viên" });
    }

    // Debug log: show DB row returned for student
    console.log("[STUDENT LOGIN] student row:", student);

    // Normalize course fields: prefer explicit course_name, fallback to existing student.ten_khoa_hoc
    const ten_khoa_hoc = student.course_name || student.ten_khoa_hoc || null;
    const ma_khoa_hoc = student.ma_khoa_hoc || student.course_code || null;

    const token = jwt.sign(
      {
        id: student.id,
        username: student.so_cmt, // Use so_cmt as username for students
        is_admin: 0, // Students are not admins
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      user: {
        id: student.id,
        ho_va_ten: student.ho_va_ten,
        ngay_sinh: student.ngay_sinh,
        so_cmt: student.so_cmt,
        hang_gplx: student.hang_gplx,
        ten_khoa_hoc,
        ma_khoa_hoc,
        anh_chan_dung: student.anh_chan_dung || null,
        face_verify_required: Number(student.face_verify_required ?? 1),
        face_verify_disabled_reason: student.face_verify_disabled_reason || null,
        face_enrolled_at: student.face_enrolled_at || null,
        role: "student",
      },
      token: token,
    });
  } catch (err) {
    console.error("🔍 LOGIN ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Student: face enrollment status
app.get("/api/student/face-status", authenticateToken, async (req, res) => {
  const studentId = req.user.id;
  try {
    const [[s]] = await pool.query(
      "SELECT face_verify_required, face_verify_disabled_reason, face_enrolled_at FROM students WHERE id = ? LIMIT 1",
      [studentId]
    );

    if (!s) return res.status(404).json({ message: "Student not found" });

    const required = Number(s.face_verify_required ?? 1) === 1;
    const enrolled = Boolean(s.face_enrolled_at);
    const reason = s.face_verify_disabled_reason || null;

    res.json({
      required,
      enrolled,
      must_enroll: required && !enrolled,
      reason,
    });
  } catch (e) {
    res.status(500).json({ message: "Lỗi lấy trạng thái xác thực", error: e.message });
  }
});

// Student: enroll face sample (descriptor)
app.post("/api/student/face-enroll", authenticateToken, async (req, res) => {
  const studentId = req.user.id;
  const { descriptor } = req.body || {};

  // descriptor is Float32Array serialized as number[] length 128
  if (!Array.isArray(descriptor) || descriptor.length !== 128) {
    return res.status(400).json({ message: "descriptor không hợp lệ (cần mảng 128 số)" });
  }

  try {
    const [[s]] = await pool.query(
      "SELECT face_verify_required, face_verify_disabled_reason FROM students WHERE id = ? LIMIT 1",
      [studentId]
    );
    if (!s) return res.status(404).json({ message: "Student not found" });

    const required = Number(s.face_verify_required ?? 1) === 1;
    if (!required) {
      return res.json({ success: true, skipped: true });
    }

    await pool.query(
      "UPDATE students SET face_descriptor_json = ?, face_enrolled_at = NOW() WHERE id = ?",
      [JSON.stringify(descriptor), studentId]
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: "Lỗi lưu ảnh mẫu", error: e.message });
  }
});

// Student: verify live face against enrolled descriptor
app.post("/api/student/face-verify", authenticateToken, async (req, res) => {
  const studentId = req.user.id;
  const { descriptor, threshold } = req.body || {};

  if (!Array.isArray(descriptor) || descriptor.length !== 128) {
    return res.status(400).json({ message: "descriptor không hợp lệ (cần mảng 128 số)" });
  }

  const th = Math.min(1, Math.max(0.2, Number(threshold) || 0.55));

  try {
    const [[s]] = await pool.query(
      "SELECT face_verify_required, face_verify_disabled_reason, face_descriptor_json, face_enrolled_at FROM students WHERE id = ? LIMIT 1",
      [studentId]
    );
    if (!s) return res.status(404).json({ message: "Student not found" });

    const required = Number(s.face_verify_required ?? 1) === 1;
    if (!required) {
      return res.json({ success: true, skipped: true });
    }

    if (!s.face_enrolled_at || !s.face_descriptor_json) {
      return res.status(409).json({ message: "Chưa có ảnh mẫu, cần enroll trước" });
    }

    let ref;
    try {
      ref = JSON.parse(s.face_descriptor_json);
    } catch {
      ref = null;
    }
    if (!Array.isArray(ref) || ref.length !== 128) {
      return res.status(500).json({ message: "Ảnh mẫu bị lỗi, vui lòng enroll lại" });
    }

    let sum = 0;
    for (let i = 0; i < 128; i++) {
      const d = Number(ref[i]) - Number(descriptor[i]);
      sum += d * d;
    }
    const distance = Math.sqrt(sum);

    res.json({
      success: distance <= th,
      distance,
      threshold: th,
    });
  } catch (e) {
    res.status(500).json({ message: "Lỗi xác thực", error: e.message });
  }
});

// Student: learning history (resume-ready)
app.get("/api/student/learning-history", authenticateToken, async (req, res) => {
  const studentId = req.user.id;
  try {
    const [rows] = await pool.query(
      `SELECT
         l.id AS lesson_id,
         COALESCE(lp.learned_seconds, 0) AS learned_seconds,
         lp.last_updated AS last_activity_at,
         l.title,
         l.subject_id,
         s.name AS subject_name,
         l.duration_minutes AS duration_minutes,
         CASE
           WHEN COALESCE(lp.learned_seconds, 0) <= 0 THEN 'not_started'
           WHEN COALESCE(lp.learned_seconds, 0) >= (l.duration_minutes * 60) THEN 'completed'
           ELSE 'in_progress'
         END AS status
       FROM lessons l
       JOIN subjects s ON s.id = l.subject_id
       LEFT JOIN lesson_progress lp
         ON lp.lesson_id = l.id
         AND lp.student_id = ?
       ORDER BY
         CASE
           WHEN lp.last_updated IS NULL THEN 1
           ELSE 0
         END ASC,
         lp.last_updated DESC,
         l.subject_id ASC,
         l.lesson_order ASC
       LIMIT 200`,
      [studentId]
    );

    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "Lỗi lấy lịch sử học", error: e.message });
  }
});

// GET student full info (including course name) by id
app.get("/api/student/:id", async (req, res) => {
  // Prevent this route from swallowing other /api/student/* routes like /api/student/exams, /api/student/learning-history
  if (!/^\d+$/.test(String(req.params.id || ''))) {
    return res.status(404).json({ message: "Student not found" });
  }
  try {
    const studentId = req.params.id;
    const [[student]] = await pool.query(
      `SELECT s.*, c.ten_khoa_hoc AS course_name, c.ma_khoa_hoc AS course_code
       FROM students s
       LEFT JOIN courses c ON s.ma_khoa_hoc = c.ma_khoa_hoc
       WHERE s.id = ? LIMIT 1`,
      [studentId]
    );

    // Debug: also fetch course row independently if ma_khoa_hoc present
    if (student && student.ma_khoa_hoc) {
      try {
        const [courseRows] = await pool.query("SELECT * FROM courses WHERE ma_khoa_hoc = ? LIMIT 1", [student.ma_khoa_hoc]);
        console.log('[DEBUG] matched course row:', courseRows[0] || null);
      } catch (e) {
        console.warn('[DEBUG] error fetching course row:', e.message);
      }
    }

    console.log('[DEBUG] /api/student/:id returning student (joined):', student);

    if (!student) return res.status(404).json({ message: "Student not found" });

    // If no course info via ma_khoa_hoc, try to find course via registrations -> schedules -> courses
    let finalCourseName = student.course_name || student.ten_khoa_hoc || null;
    let finalMaKhoaHoc = student.ma_khoa_hoc || student.course_code || null;

    if (!finalCourseName) {
      try {
        const [rows] = await pool.query(
          `SELECT c.ten_khoa_hoc, c.ma_khoa_hoc
           FROM registrations r
           JOIN schedules s ON r.schedule_id = s.id
           JOIN courses c ON s.course_id = c.id
           WHERE r.student_id = ?
           LIMIT 1`,
          [student.id]
        );
        if (rows && rows.length > 0) {
          finalCourseName = rows[0].ten_khoa_hoc || finalCourseName;
          finalMaKhoaHoc = rows[0].ma_khoa_hoc || finalMaKhoaHoc;
          console.log('[DEBUG] found course via registrations:', rows[0]);
        }
      } catch (e) {
        console.warn('[DEBUG] error finding course via registrations:', e.message);
      }
    }

    res.json({
      id: student.id,
      ho_va_ten: student.ho_va_ten,
      ngay_sinh: student.ngay_sinh,
      so_cmt: student.so_cmt,
      hang_gplx: student.hang_gplx,
      ten_khoa_hoc: finalCourseName,
      ma_khoa_hoc: finalMaKhoaHoc,
      anh_chan_dung: student.anh_chan_dung || null,
      created_at: student.created_at,
      updated_at: student.updated_at,
    });
  } catch (err) {
    console.error("/api/student/:id error", err);
    res.status(500).json({ error: err.message });
  }
});



// --- API QUẢN LÝ BÀI GIẢNG ---

// 1. Lấy danh sách tất cả môn học
app.get("/api/subjects", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM subjects");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Lấy danh sách bài giảng theo Môn học (Dùng cho cả Admin và Học viên)
app.get("/api/lessons", async (req, res) => {
  const { subject_id, hang_gplx } = req.query;
  try {
    let sql = `
      SELECT l.*, COALESCE(ldo.duration_minutes, l.duration_minutes) AS effective_duration_minutes
      FROM lessons l
      LEFT JOIN lesson_duration_overrides ldo
        ON ldo.lesson_id = l.id
        AND ldo.license_class = ?
    `;

    const params = [String(hang_gplx || '')];
    const where = [];

    if (subject_id) {
      const sid = Number(subject_id);
      if (Number.isNaN(sid)) {
        return res.status(400).json({ error: "subject_id must be a number" });
      }
      where.push("l.subject_id = ?");
      params.push(sid);

      try {
        const [[countRow]] = await pool.query("SELECT COUNT(*) as c FROM lessons WHERE subject_id = ?", [sid]);
        console.log(`🔍 API /api/lessons debug: subject_id=${sid} count=${countRow.c}`);
      } catch (e) {
        console.warn("Could not run lessons count debug", e.message);
      }
    }

    const hangGplxNormalized = String(hang_gplx || '').trim();
    if (hangGplxNormalized) {
      where.push("(l.license_types IS NULL OR l.license_types = '' OR l.license_types = '[]' OR JSON_CONTAINS(l.license_types, JSON_QUOTE(?)))");
      params.push(hangGplxNormalized);
    }

    if (where.length) {
      sql += " WHERE " + where.join(" AND ");
    }
    sql += " ORDER BY l.lesson_order ASC";

    const [rows] = await pool.query(sql, params);
    console.log(`🔍 API /api/lessons query: subject_id=${subject_id}, hang_gplx=${hang_gplx || ''}, trả về ${rows.length} lessons`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug: Xem tất cả lessons với subject_id
app.get("/api/debug/lessons-all", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, title, subject_id FROM lessons ORDER BY subject_id, lesson_order");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Thêm bài giảng mới (Dành cho Admin)
// API Thêm bài giảng (Đã sửa lại theo tham số chuẩn 100%)
app.post("/api/lessons", async (req, res) => {
  const {
    subject_id,
    title,
    lesson_code,
    video_url,
    pdf_url,
    lesson_order,
    duration_minutes,
    license_types,
    duration_overrides,
  } = req.body;
  let { content } = req.body;

  try {
    // Gọi hàm phụ trợ để lấy nội dung nếu cần
    if (pdf_url && (!content || content.trim() === "")) {
      try {
        // Xử lý đường dẫn an toàn hơn
        let cleanUrl = pdf_url.startsWith("/") ? pdf_url.substring(1) : pdf_url;
        // Nếu chạy trên Windows, thay / thành \ cho đúng chuẩn
        cleanUrl = cleanUrl.replace(/\//g, path.sep);

        const absolutePath = path.resolve(__dirname, cleanUrl);

        if (fs.existsSync(absolutePath)) {
          const dataBuffer = fs.readFileSync(absolutePath);
          const pdfData = await pdfParse(dataBuffer);
          if (pdfData.text) {
            content = pdfData.text.replace(/\n\s*\n/g, "\n").trim();
          }
        } else {
          console.warn("⚠️ File PDF không tồn tại:", absolutePath);
          // Không throw lỗi, vẫn cho lưu bài giảng nhưng content rỗng
        }
      } catch (e) {
        console.error("⚠️ Lỗi đọc PDF (Bỏ qua để lưu):", e.message);
        // Bắt lỗi ở đây để code chạy tiếp xuống dưới
      }
    }

    let finalOrder = lesson_order;
    if (!finalOrder) {
      const [rows] = await pool.query(
        "SELECT MAX(lesson_order) as maxOrder FROM lessons WHERE subject_id = ?",
        [subject_id]
      );
      finalOrder = (rows[0].maxOrder || 0) + 1;
    }

    const sql = `
      INSERT INTO lessons
      (subject_id, title, lesson_code, video_url, pdf_url, license_types, lesson_order, duration_minutes, content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [insertRes] = await pool.query(sql, [
      subject_id,
      title,
      lesson_code || "",
      video_url || "",
      pdf_url || "",
      license_types ? JSON.stringify(license_types) : null,
      finalOrder,
      duration_minutes || 45,
      content || "",
    ]);

    const lessonId = insertRes.insertId;

    if (lessonId && Array.isArray(duration_overrides)) {
      for (const o of duration_overrides) {
        if (!o || !o.license_class || o.duration_minutes == null) continue;
        await pool.query(
          `INSERT INTO lesson_duration_overrides (lesson_id, license_class, duration_minutes)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE duration_minutes = VALUES(duration_minutes)`,
          [lessonId, String(o.license_class), Number(o.duration_minutes)]
        );
      }
    }

    res.json({ message: "Thêm thành công", id: lessonId });
  } catch (err) {
    console.error("Lỗi POST:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3.1. Lấy chi tiết bài giảng theo ID (Dành cho Học viên)
// 🔍 THÊM API NÀY: Lấy chi tiết 1 bài giảng theo ID
app.get("/api/lessons/:id", async (req, res) => {
  const { hang_gplx } = req.query;
  try {
    const [rows] = await pool.query(
      `SELECT l.*, COALESCE(ldo.duration_minutes, l.duration_minutes) AS effective_duration_minutes
       FROM lessons l
       LEFT JOIN lesson_duration_overrides ldo
         ON ldo.lesson_id = l.id
         AND ldo.license_class = ?
       WHERE l.id = ?`,
      [String(hang_gplx || ''), req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bài giảng" });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Xóa bài giảng
app.delete("/api/lessons/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM lessons WHERE id = ?", [req.params.id]);
    res.json({ message: "Đã xóa bài giảng" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 5. Sửa bài giảng (Thêm đoạn này vào be/app.js)
// --- API SỬA BÀI GIẢNG (PUT) ---
app.put("/api/lessons/:id", async (req, res) => {
  const { id } = req.params;
  const {
    subject_id,
    title,
    lesson_code,
    video_url,
    pdf_url,
    lesson_order,
    duration_minutes,
    license_types,
    duration_overrides,
  } = req.body;
  let { content } = req.body;

  try {
    // Gọi hàm phụ trợ khi sửa
    if (pdf_url && (!content || content.trim() === "")) {
      const extracted = await extractPdfText(pdf_url);
      if (extracted) content = extracted; // Chỉ cập nhật nếu đã được
    }

    const sql = `
      UPDATE lessons SET
        subject_id = ?, title = ?, lesson_code = ?, video_url = ?, pdf_url = ?, license_types = ?,
        lesson_order = ?, duration_minutes = ?, content = ?
      WHERE id = ?
    `;
    await pool.query(sql, [
      subject_id,
      title,
      lesson_code,
      video_url,
      pdf_url,
      license_types ? JSON.stringify(license_types) : null,
      lesson_order,
      duration_minutes,
      content,
      id,
    ]);

    if (Array.isArray(duration_overrides)) {
      for (const o of duration_overrides) {
        if (!o || !o.license_class || o.duration_minutes == null) continue;
        await pool.query(
          `INSERT INTO lesson_duration_overrides (lesson_id, license_class, duration_minutes)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE duration_minutes = VALUES(duration_minutes)`,
          [id, String(o.license_class), Number(o.duration_minutes)]
        );
      }
    }

    res.json({ message: "Cập nhật thành công" });
  } catch (err) {
    console.error("Lỗi PUT:", err);
    res.status(500).json({ error: err.message });
  }
});


// API tạo dữ liệu mẫu môn học
app.get("/api/init-subjects", async (req, res) => {
  const subjects = [
    { name: "Pháp luật giao thông đường bộ", code: "PL", hours: 90 },
    { name: "Đạo đức người lái xe", code: "DD", hours: 15 },
    { name: "Cấu tạo và sửa chữa thường xuyên", code: "CT", hours: 10 },
    { name: "Kỹ thuật lái xe", code: "KT", hours: 20 },
    { name: "Tình huống mô phỏng", code: "MP", hours: 4 },
  ];

  try {
    // 1. Đảm bảo bảng có cột
    try {
      await pool.query("ALTER TABLE subjects ADD COLUMN code VARCHAR(50) NULL");
      await pool.query(
        "ALTER TABLE subjects ADD COLUMN total_hours INT DEFAULT 0"
      );
    } catch (e) {
      // Bỏ qua nếu cột đã tồn tại
    }

    // 2. Xóa cũ thêm mới
    await pool.query("DELETE FROM subjects");

    for (const sub of subjects) {
      await pool.query(
        "INSERT INTO subjects (name, code, total_hours) VALUES (?, ?, ?)",
        [sub.name, sub.code, sub.hours]
      );
    }
    res.send("✅ Đã tạo thành công 5 môn học!");
  } catch (err) {
    res.status(500).send("Lỗi: " + err.message);
  }
});

// tiến độ môn học - CẬP NHẬT: Hỗ trợ cả lessons và simulations
app.post("/api/student/lesson-progress", async (req, res) => {
  const { student_id, lesson_id, watched_seconds, duration_minutes, subject_id } = req.body;

  if (!student_id || !watched_seconds || !duration_minutes) {
    return res.status(400).json({ message: "Thiếu dữ liệu" });
  }

  try {
    // Tính số phút học, tối thiểu 1 phút nếu học >= 30 giây
    const minutesLearned = watched_seconds >= 30 ? Math.max(1, Math.round(watched_seconds / 60)) : 0;

    // Nếu học dưới 30 giây thì bỏ qua (tránh spam)
    if (watched_seconds < 30) {
      return res.json({
        success: false,
        message: "Thời gian học quá ngắn",
      });
    }

    let subjectId;

    // Nếu có subject_id trực tiếp (cho simulations), dùng luôn
    if (subject_id) {
      subjectId = subject_id;
    } else if (lesson_id) {
      // Lấy thông tin bài học để biết subject_id (cho lessons)
      const [lessonRows] = await pool.query(
        "SELECT subject_id FROM lessons WHERE id = ?",
        [lesson_id]
      );

      if (lessonRows.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy bài học" });
      }

      subjectId = lessonRows[0].subject_id;
    } else {
      return res.status(400).json({ message: "Thiếu lesson_id hoặc subject_id" });
    }

    // Cộng dồn thời gian vào learning_history
    await pool.query(
      `
      INSERT INTO learning_history (student_id, subject_id, minutes)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        minutes = minutes + VALUES(minutes)
      `,
      [student_id, subjectId, minutesLearned]
    );

    // Chỉ lưu vào student_lesson_progress nếu là lesson thật (không phải simulation)
    // Simulations dùng fake lesson_id negative nên không cần student_lesson_progress
    let isCompleted = false;
    if (lesson_id && lesson_id > 0) {
      const percentWatched = watched_seconds / (duration_minutes * 60);
      isCompleted = percentWatched >= 0.8;

      await pool.query(
        `
        INSERT INTO student_lesson_progress (student_id, lesson_id, minutes_learned, completed)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          minutes_learned = GREATEST(minutes_learned, VALUES(minutes_learned)),
          completed = GREATEST(completed, VALUES(completed))
        `,
        [student_id, lesson_id, minutesLearned, isCompleted ? 1 : 0]
      );
    }

    res.json({
      success: true,
      minutes_added: minutesLearned,
      completed: isCompleted
    });
  } catch (err) {
    console.error("lesson-progress error:", err);
    console.error("Error details:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({ message: "Lỗi lưu tiến độ học", error: err.message });
  }
});


app.get("/api/student/dashboard/:id", async (req, res) => {
  try {
    const studentId = req.params.id;

    // Lấy hạng GPLX của học viên để chọn requirement phù hợp.
    const [[studentRow]] = await pool.query(
      `SELECT hang_gplx FROM students WHERE id = ? LIMIT 1`,
      [studentId]
    );
    const hangGplx = (studentRow && studentRow.hang_gplx) || "";
    console.log(`[DASHBOARD] studentId=${studentId} hang_gplx=${hangGplx}`);

    const [rows] = await pool.query(`
      SELECT
        sub.id AS subject_id,
        sub.code,
        sub.name AS subject_name,
        sr.required_hours,
        COALESCE(SUM(lh.minutes), 0) / 60 AS learned_hours,
        CASE
          WHEN COALESCE(SUM(lh.minutes), 0) / 60 >= sr.required_hours THEN 'Hoàn thành'
          ELSE 'Chưa hoàn thành'
        END AS status
      FROM subjects sub
      LEFT JOIN subject_requirements sr
        ON sr.subject_id = sub.id
        AND (sr.license_class = ? OR sr.license_class = '')
      LEFT JOIN learning_history lh
        ON lh.subject_id = sub.id
        AND lh.student_id = ?
      GROUP BY sub.id, sub.code, sub.name, sr.required_hours
    `, [hangGplx, studentId]);

    res.json(rows || []);
  } catch (err) {
    console.error("🔍 DASHBOARD ERROR", err);
    console.error("SQL Message:", err.sqlMessage || err.message);
    res.status(500).json({ error: err.sqlMessage || err.message });
  }
});



// =======================================
// API: Lấy tổng giờ học + tổng giờ quy định
// =======================================
app.get("/api/student/summary/:id", async (req, res) => {
  try {
    const studentId = req.params.id;

    // Lấy thông tin học viên trước
    const [[studentInfo]] = await pool.query(
      "SELECT hang_gplx FROM students WHERE id = ?",
      [studentId]
    );

    if (!studentInfo) {
      return res.status(404).json({ message: "Student not found" });
    }

    const hangGplx = studentInfo.hang_gplx;

    // Lấy tổng giờ đã học
    const [[learnedRow]] = await pool.query(`
      SELECT COALESCE(SUM(minutes), 0) / 60 AS learned_hours
      FROM learning_history
      WHERE student_id = ?
    `, [studentId]);

    // Lấy tổng giờ yêu cầu cho hạng GPLX (normalize license class)
    const normalizedHangGplx = String(hangGplx || '').replace(/\s+/g, '').replace('.', '');
    const [[requiredRow]] = await pool.query(`
      SELECT COALESCE(SUM(required_hours), 0) AS required_hours
      FROM subject_requirements
      WHERE license_class IN (?, ?, ?)
    `, [hangGplx, normalizedHangGplx, String(hangGplx || '').trim()]);

    // Normalize response to match frontend expectations
    const total_learned = Number(learnedRow?.learned_hours || 0);
    const total_required = Number(requiredRow?.required_hours || 0);
    const progress = total_required > 0 ? Math.round((total_learned / total_required) * 100) : 0;

    res.json({
      total_learned,
      total_required,
      progress,
      hang_gplx: hangGplx,
    });
  } catch (err) {
    console.error("🔍 SUMMARY ERROR", err);
    console.error("SQL Message:", err.sqlMessage || err.message);
    res.status(500).json({ error: err.sqlMessage || err.message });
  }
});

// Lưu tiến độ bài học (Dùng tên cột learned_seconds)
app.post("/api/progress/save", authenticateToken, async (req, res) => {
    const { lesson_id, learned_seconds } = req.body;
    const student_id = req.user.id;
      console.log(`🔍 Saving: Student ${student_id} | Lesson ${lesson_id} | Seconds: ${learned_seconds}`);

    try {
        const sql = `
          INSERT INTO lesson_progress (student_id, lesson_id, learned_seconds)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE learned_seconds = ?
        `;
        await pool.query(sql, [student_id, lesson_id, learned_seconds, learned_seconds]);
        res.json({ success: true });
    } catch (err) {
          console.error("Lỗi Save:", err);
res.status(500).json({ error: err.message }); }
});

// Lấy tiến độ 1 bài
app.get("/api/progress/:lessonId", authenticateToken, async (req, res) => {
    const studentId = req.user.id;
    const lessonId = req.params.lessonId;
    try {
        const [rows] = await pool.query(
          "SELECT learned_seconds FROM lesson_progress WHERE student_id = ? AND lesson_id = ?",
         [studentId, lessonId]
        );
        const time = rows.length > 0 ? rows[0].learned_seconds : 0;
            console.log(`🔍 Load: Bài ${lessonId} - Giây: ${time}`);

         res.json({ learned_seconds: time });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Debug: Check subjects and learning_history
app.get("/api/debug/data-check", async (req, res) => {
  try {
    const [subjects] = await pool.query("SELECT id, name, code FROM subjects");
    const [history] = await pool.query(
      `SELECT lh.student_id, s.ho_va_ten AS student_name, lh.subject_id, sub.name AS subject_name, lh.minutes
       FROM learning_history lh
       JOIN students s ON s.id = lh.student_id
       JOIN subjects sub ON sub.id = lh.subject_id
       ORDER BY lh.id DESC
       LIMIT 20`
    );

    const subjectIds = subjects.map(s => s.id);
    const historySubjectIds = [...new Set(history.map(h => h.subject_id))];
    const mismatches = historySubjectIds.filter(id => !subjectIds.includes(id));

    res.json({
      subjects,
      learning_history: history,
      subject_ids: subjectIds,
      history_subject_ids: historySubjectIds,
      mismatches
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API MÔ PHỎNG 120 TÌNH HUỐNG ---
app.get("/api/simulations", async (req, res) => {
  try {
    // Lấy toàn bộ 120 câu, sắp xếp theo số thứ tự
    const [rows] = await pool.query("SELECT * FROM simulations ORDER BY stt ASC");
    res.json(rows);
  } catch (err) {
    console.error("Lỗi lấy simulation:", err);
    res.status(500).json({ error: err.message });
  }
});
// --- ASSESSMENT APIs ---

const requireAdminOrDepartment = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Thiếu token xác thực" });
    const [[u]] = await pool.query("SELECT is_admin, role FROM users WHERE id = ? LIMIT 1", [userId]);
    const ok = Boolean(
      u &&
        (u.is_admin === 1 || u.role === 'admin' || u.role === 'administrator' || u.role === 'department' || u.role === 'sogtvt')
    );
    if (!ok) return res.status(403).json({ message: "Không có quyền truy cập" });
    next();
  } catch (e) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Admin: CRUD Questions (MCQ + choices)
app.get("/api/admin/questions", authenticateToken, requireAdminOrDepartment, async (req, res) => {
  const { subject_id } = req.query;
  try {
    const params = [];
    let where = "";
    if (subject_id) {
      where = "WHERE q.subject_id = ?";
      params.push(Number(subject_id));
    }

    const [questions] = await pool.query(
      `SELECT q.id, q.subject_id, q.type, q.content, q.explanation, q.difficulty, q.created_at, q.updated_at
       FROM questions q
       ${where}
       ORDER BY q.id DESC`,
      params
    );

    const ids = questions.map((q) => q.id);
    let choicesByQid = {};
    if (ids.length) {
      const [choices] = await pool.query(
        `SELECT id, question_id, label, content, is_correct
         FROM question_choices
         WHERE question_id IN (${ids.map(() => '?').join(',')})
         ORDER BY id ASC`,
        ids
      );
      for (const c of choices) {
        if (!choicesByQid[c.question_id]) choicesByQid[c.question_id] = [];
        choicesByQid[c.question_id].push(c);
      }
    }

    res.json(questions.map((q) => ({ ...q, choices: choicesByQid[q.id] || [] })));
  } catch (e) {
    res.status(500).json({ message: "Lỗi lấy câu hỏi", error: e.message });
  }
});

app.post("/api/admin/questions", authenticateToken, requireAdminOrDepartment, async (req, res) => {
  const { subject_id, type = 'mcq', content, explanation, difficulty, choices } = req.body;
  if (!content) return res.status(400).json({ message: "Thiếu nội dung câu hỏi" });
  try {
    const [result] = await pool.query(
      "INSERT INTO questions (subject_id, type, content, explanation, difficulty) VALUES (?, ?, ?, ?, ?)",
      [subject_id ?? null, type, content, explanation ?? null, difficulty ?? null]
    );
    const questionId = result.insertId;

    if (type === 'mcq' && Array.isArray(choices) && choices.length) {
      for (const ch of choices) {
        await pool.query(
          "INSERT INTO question_choices (question_id, label, content, is_correct) VALUES (?, ?, ?, ?)",
          [questionId, ch.label ?? null, ch.content, ch.is_correct ? 1 : 0]
        );
      }
    }

    res.json({ success: true, id: questionId });
  } catch (e) {
    res.status(500).json({ message: "Lỗi tạo câu hỏi", error: e.message });
  }
});

app.put("/api/admin/questions/:id", authenticateToken, requireAdminOrDepartment, async (req, res) => {
  const { id } = req.params;
  const { subject_id, type, content, explanation, difficulty, choices } = req.body;
  if (!content) return res.status(400).json({ message: "Thiếu nội dung câu hỏi" });
  try {
    await pool.query(
      "UPDATE questions SET subject_id = ?, type = ?, content = ?, explanation = ?, difficulty = ? WHERE id = ?",
      [subject_id ?? null, type, content, explanation ?? null, difficulty ?? null, id]
    );

    if (type === 'mcq') {
      await pool.query("DELETE FROM question_choices WHERE question_id = ?", [id]);
      if (Array.isArray(choices)) {
        for (const ch of choices) {
          await pool.query(
            "INSERT INTO question_choices (question_id, label, content, is_correct) VALUES (?, ?, ?, ?)",
            [id, ch.label ?? null, ch.content, ch.is_correct ? 1 : 0]
          );
        }
      }
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: "Lỗi cập nhật câu hỏi", error: e.message });
  }
});

app.delete("/api/admin/questions/:id", authenticateToken, requireAdminOrDepartment, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM questions WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: "Lỗi xóa câu hỏi", error: e.message });
  }
});

// Admin: Exams (create + attach questions)
app.get("/api/admin/exams", authenticateToken, requireAdminOrDepartment, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM exams ORDER BY id DESC");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "Lỗi lấy đề thi", error: e.message });
  }
});

app.post("/api/admin/exams", authenticateToken, requireAdminOrDepartment, async (req, res) => {
  const { subject_id, title, duration_minutes = 15, total_questions = 20, randomized = 1, passing_score = 80, question_ids } = req.body;
  if (!title) return res.status(400).json({ message: "Thiếu tiêu đề đề thi" });
  try {
    const [result] = await pool.query(
      "INSERT INTO exams (subject_id, title, duration_minutes, total_questions, randomized, passing_score) VALUES (?, ?, ?, ?, ?, ?)",
      [subject_id ?? null, title, duration_minutes, total_questions, randomized ? 1 : 0, passing_score]
    );
    const examId = result.insertId;

    if (Array.isArray(question_ids) && question_ids.length) {
      let i = 1;
      for (const qid of question_ids) {
        await pool.query(
          "INSERT INTO exam_questions (exam_id, question_id, question_order) VALUES (?, ?, ?)",
          [examId, qid, i++]
        );
      }
    }

    res.json({ success: true, id: examId });
  } catch (e) {
    res.status(500).json({ message: "Lỗi tạo đề thi", error: e.message });
  }
});

// Student: question bank (for practice)
app.get("/api/student/questions", authenticateToken, async (req, res) => {
  const { subject_id, limit } = req.query;
  try {
    const params = [];
    let where = "";
    if (subject_id) {
      where = "WHERE q.subject_id = ?";
      params.push(Number(subject_id));
    }
    const max = Math.min(200, Math.max(1, Number(limit) || 50));

    const [questions] = await pool.query(
      `SELECT q.id, q.subject_id, q.type, q.content, q.explanation, q.difficulty
       FROM questions q
       ${where}
       ORDER BY q.id DESC
       LIMIT ${max}`,
      params
    );

    const ids = questions.map((q) => q.id);
    let choicesByQid = {};
    if (ids.length) {
      const [choices] = await pool.query(
        `SELECT id, question_id, label, content
         FROM question_choices
         WHERE question_id IN (${ids.map(() => '?').join(',')})
         ORDER BY id ASC`,
        ids
      );
      for (const c of choices) {
        if (!choicesByQid[c.question_id]) choicesByQid[c.question_id] = [];
        choicesByQid[c.question_id].push(c);
      }
    }

    res.json(questions.map((q) => ({ ...q, choices: choicesByQid[q.id] || [] })));
  } catch (e) {
    res.status(500).json({ message: "Lỗi lấy ngân hàng câu hỏi", error: e.message });
  }
});

// Student: list exams
app.get("/api/student/exams", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, subject_id, title, duration_minutes, total_questions, passing_score FROM exams ORDER BY id DESC");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "Lỗi lấy danh sách đề thi", error: e.message });
  }
});

// Student: start attempt -> returns questions (without answers)
app.post("/api/student/exams/:examId/start", authenticateToken, async (req, res) => {
  const { examId } = req.params;
  const studentId = req.user.id;
  try {
    const [[exam]] = await pool.query("SELECT * FROM exams WHERE id = ? LIMIT 1", [examId]);
    if (!exam) return res.status(404).json({ message: "Không tìm thấy đề thi" });

    const [eqRows] = await pool.query(
      "SELECT question_id FROM exam_questions WHERE exam_id = ? ORDER BY question_order ASC",
      [examId]
    );

    let questionIds = eqRows.map((r) => r.question_id);
    if (exam.randomized && questionIds.length) {
      // simple shuffle
      questionIds = questionIds.sort(() => Math.random() - 0.5);
    }
    questionIds = questionIds.slice(0, exam.total_questions);

    const [attemptRes] = await pool.query(
      "INSERT INTO exam_attempts (exam_id, student_id) VALUES (?, ?)",
      [examId, studentId]
    );
    const attemptId = attemptRes.insertId;

    if (!questionIds.length) return res.json({ attempt_id: attemptId, exam, questions: [] });

    const [questions] = await pool.query(
      `SELECT id, subject_id, type, content, explanation, difficulty FROM questions WHERE id IN (${questionIds
        .map(() => '?')
        .join(',')})`,
      questionIds
    );

    const [choices] = await pool.query(
      `SELECT id, question_id, label, content FROM question_choices WHERE question_id IN (${questionIds
        .map(() => '?')
        .join(',')})`,
      questionIds
    );

    const choicesByQid = {};
    for (const c of choices) {
      if (!choicesByQid[c.question_id]) choicesByQid[c.question_id] = [];
      choicesByQid[c.question_id].push(c);
    }

    const questionsById = {};
    for (const q of questions) questionsById[q.id] = q;

    res.json({
      attempt_id: attemptId,
      exam: {
        id: exam.id,
        title: exam.title,
        duration_minutes: exam.duration_minutes,
        passing_score: exam.passing_score,
      },
      questions: questionIds
        .map((id) => questionsById[id])
        .filter(Boolean)
        .map((q) => ({ ...q, choices: choicesByQid[q.id] || [] })),
    });
  } catch (e) {
    res.status(500).json({ message: "Lỗi bắt đầu thi", error: e.message });
  }
});

// Student: submit attempt answers
app.post("/api/student/attempts/:attemptId/submit", authenticateToken, async (req, res) => {
  const { attemptId } = req.params;
  const studentId = req.user.id;
  const { answers, time_spent_seconds = 0 } = req.body;

  try {
    const [[attempt]] = await pool.query(
      "SELECT * FROM exam_attempts WHERE id = ? AND student_id = ? LIMIT 1",
      [attemptId, studentId]
    );
    if (!attempt) return res.status(404).json({ message: "Không tìm thấy lượt thi" });

    const [[exam]] = await pool.query("SELECT * FROM exams WHERE id = ? LIMIT 1", [attempt.exam_id]);
    if (!exam) return res.status(404).json({ message: "Không tìm thấy đề thi" });

    const a = Array.isArray(answers) ? answers : [];

    let correct = 0;
    let total = 0;

    for (const item of a) {
      if (!item?.question_id) continue;
      total += 1;

      let isCorrect = null;
      if (item.choice_id) {
        const [[row]] = await pool.query(
          "SELECT is_correct FROM question_choices WHERE id = ? AND question_id = ? LIMIT 1",
          [item.choice_id, item.question_id]
        );
        isCorrect = row ? row.is_correct === 1 : 0;
        if (isCorrect) correct += 1;
      }

      await pool.query(
        "INSERT INTO attempt_answers (attempt_id, question_id, choice_id, essay_answer, is_correct) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE choice_id = VALUES(choice_id), essay_answer = VALUES(essay_answer), is_correct = VALUES(is_correct)",
        [attemptId, item.question_id, item.choice_id ?? null, item.essay_answer ?? null, isCorrect]
      );
    }

    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = score >= (exam.passing_score || 80);

    await pool.query(
      "UPDATE exam_attempts SET submitted_at = NOW(), score = ?, passed = ?, time_spent_seconds = ? WHERE id = ?",
      [score, passed ? 1 : 0, Number(time_spent_seconds) || 0, attemptId]
    );

    res.json({ success: true, score, passed });
  } catch (e) {
    res.status(500).json({ message: "Lỗi nộp bài", error: e.message });
  }
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
