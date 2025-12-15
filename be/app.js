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

// Helper function to extract text from PDF
// --- 2. HÀM PHỤ TRỢ ĐỌC PDF (ĐÃ SỬA LỖI TYPE OBJECT) ---
// --- 2. HÀM PHỤ TRỢ ĐỌC PDF (PHIÊN BẢN KHÔNG CRASH) ---
async function extractPdfText(fileUrl) {
  if (!fileUrl) return "";
  try {
    const relativePath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
    const normalizedPath = relativePath.split('/').join(path.sep);
    const absolutePath = path.resolve(__dirname, normalizedPath);

    // console.log(`👉 Đang xử lý file: ${absolutePath}`);

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

      // Kiểm tra xem thư viện có dùng được không
      if (typeof pdfLib === 'function') {
          const data = await pdfLib(dataBuffer);
          return data.text ? data.text.replace(/\n\s*\n/g, '\n').trim() : "";
      } else if (pdfLib && typeof pdfLib.default === 'function') {
          const data = await pdfLib.default(dataBuffer);
          return data.text ? data.text.replace(/\n\s*\n/g, '\n').trim() : "";
      } else {
          // Nếu thư viện lạ (như log bạn gửi), bỏ qua luôn để không lỗi
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

// Serve static files từ thư mục uploads (ĐỂ TRẮNG VÀO TRƯỚC ĐỂ SERVE FILE PDF VÀ VIDEO)
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

    // Đảm bảo cột duration_minutes và content tồn tại
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
    console.log("✅ Đảm bảo table learning_history tồn tại");

    // Insert một số môn học mẫu nếu chưa có
    const [[{ count: subjectsCount }]] = await pool.query(
      "SELECT COUNT(*) as count FROM subjects"
    );
    if (subjectsCount === 0) {
      await pool.query(`
        INSERT INTO subjects (name, description) VALUES
        ('Lý thuyết lái xe B1', 'Các bài giảng lý thuyết về luật giao thông và kỹ năng lái xe an toàn'),
        ('Thực hành lái xe B1', 'Các bài thực hành kỹ năng lái xe trên đường'),
        ('Luật giao thông đường bộ', 'Kiến thức về luật giao thông và biển báo')
      `);
      console.log("✅ Đã tạo dữ liệu mẫu cho subjects");
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

// Đã chuyển toàn bộ truy vấn sang dùng pool từ db.js (MySQL)
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
// Ensure we have a JWT secret. In development, fall back to a warning default
// so the server doesn't crash when env var is missing. In production you
// should always set `JWT_SECRET` in your environment.
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  const fallback = "dev-secret-change-me";
  console.warn("⚠️ JWT_SECRET is not set. Using development fallback secret. Set JWT_SECRET in environment for production.");
  return fallback;
})();

app.post("/api/login", async (req, res) => {
  console.log("👉 ADMIN LOGIN BODY:", req.body);

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

    const isAdminValue = user.is_admin === 1 || username === 'admin';

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        is_admin: isAdminValue ? 1 : 0,
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
      },
    });
  } catch (err) {
    console.error("🔥 ADMIN LOGIN ERROR 🔥");
    console.error(err);
    res.status(500).json({
      message: "Lỗi server khi đăng nhập admin",
      error: err.message,
    });
  }
});



// API: Lấy danh sách khoá học
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

// API: Upload file XML hoặc Excel để thêm khoá họcsửa
app.post("/api/courses/upload", upload.single("file"), async (req, res) => {
  console.log("\n🔵 ===== BẮT ĐẦU UPLOAD XML ===== 🔵");
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
        const sql =
          "INSERT INTO courses (ma_khoa_hoc, ten_khoa_hoc, ngay_khai_giang, ngay_be_giang, so_hoc_sinh, hang_gplx) VALUES (?, ?, ?, ?, ?, ?)";
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
              console.log("✅ Đã xác nhận cột anh_chan_dung là LONGTEXT");
            } catch (modErr) {
              console.warn(
                "⚠️ Không thể sửa cột anh_chan_dung:",
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
          await conn.query(sql, [
            khoa.MA_KHOA_HOC[0],
            khoa.TEN_KHOA_HOC[0],
            khoa.NGAY_KHAI_GIANG[0],
            khoa.NGAY_BE_GIANG[0],
            parseInt(khoa.SO_HOC_SINH[0]),
            khoa.HANG_GPLX?.[0] || "",
          ]);
          // Thêm học viên
          console.log(`\n📋 Bắt đầu xử lý ${hocvienList.length} học viên...`);
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
          //     if (Array.isArray(node)) return getCleanText(node[0]); // Nếu là mảng, bóc lớp vỏ mảng ra
          //     if (typeof node === "object") {
          //       // Trường hợp XML có thuộc tính (VD: <ANH format="jpg">Base64...</ANH>)
          //       if (node._) return node._;
          //       return null;
          //     }
          //     return String(node).trim(); // Trả về chuỗi sạch
          //   };

          //   // --- 2. TÌM DỮ LIỆU ẢNH (QUÉT MỌI NGÓC NGÁCH) ---
          //   let rawAnh = null;

          //   // Cách 1: Tìm trong HO_SO (Cấu trúc chuẩn thường gặp)
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
          //     // Ảnh phải có dữ liệu dài dài chút
          //     // Quan trọng: Xóa hết dấu cách, xuống dòng (\n) thì ảnh mới hiển thị được
          //     anhFinal = rawAnh.replace(/\s+/g, "");
          //     console.log(`📸 Kích thước ảnh: ${anhFinal.length} ký tự.`);
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
          //     console.log(`💾 Đã lưu thành công ID: ${result.insertId}`);
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
          //         "⚠️ Ảnh quá lớn, đang lưu lại học viên không kèm ảnh..."
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
            `\n📋 Bắt đầu xử lý ${hocvienList.length} học viên (Chế độ quét sâu)...`
          );

          // --- HÀM TÌM ẢNH ĐỆ QUY (QUÉT MỌI NGÓC NGÁCH) ---
          const findLongString = (obj, depth = 0) => {
            if (!obj || depth > 5) return null; // Tránh lặp vô hạn, chỉ quét sâu 5 cấp

            // Nếu bản thân nó là chuỗi dài > 1000 ký tự -> Khả năng cao là ảnh
            if (typeof obj === "string" && obj.length > 1000) {
              return obj;
            }

            // Nếu là Mảng hoặc Object, đệ quy tìm bên trong
            if (typeof obj === "object") {
              // Ưu tiên tìm trong key có chữ "ANH" hoặc "IMAGE" trước
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
          // --- HÀM LẤY TEXT NGẮN (GIỮ NGUYÊN) ---
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

                  // 👇👇👇 SỬA ĐƯỜNG DẪN NÀY NẾU MÁY BẠN CÀI KHÁC 👇👇👇
                  // Lưu ý: Dùng 2 dấu gạch chéo "\\"

                  const magickPath = "magick"; // Trên Linux chỉ cần gọi tên lệnh là được
                  // 👆👆👆

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
                    // Fallback: Lưu ảnh gốc (dù không hiện nhưng không mất dữ liệu)
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
              console.log(`💾 Saved ID: ${result.insertId}`);
            } catch (insertErr) {
              console.error(`❌ Lỗi Insert DB:`, insertErr.message);
              // Nếu lỗi do gói tin quá lớn
              if (
                insertErr.message.includes("packet") ||
                insertErr.message.includes("large")
              ) {
                console.log(
                  "⚠️  LỖI: Ảnh quá lớn so với cấu hình MySQL (max_allowed_packet)."
                );
                console.log(
                  "👉 Bạn cần chạy lệnh SQL: SET GLOBAL max_allowed_packet = 1073741824;"
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
      status = ?, status_ly_thuyet = ?, status_mo_phong = ?, status_duong = ?, status_truong = ?
    WHERE id = ?
  `;
  try {
    await pool.query(sql, [
      ho_va_ten,
      ngay_sinh_mysql,
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
    const [result] = await pool.query(
      "SELECT ma_khoa_hoc FROM courses WHERE id = ?",
      [courseId]
    );
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
      id,
    ]);
    // Lấy lại bản ghi mới nhất để trả về cho FE
    const [rows] = await pool.query("SELECT * FROM courses WHERE id = ?", [id]);
    res.json({ success: true, course: rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi cập nhật", err });
  }
});

// API: Tìm kiếm học viên
app.get("/api/students", async (req, res) => {
  const { name, cccd, status, ma_khoa_hoc } = req.query;
  let sql = `
    SELECT s.*,
           c.ten_khoa_hoc,
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
  ];
  if (!id || !field || !allowedFields.includes(field)) {
    return res.status(400).json({ error: "Thiếu hoặc sai thông tin update" });
  }
  const validStatuses = ["thi", "vang", "rot", "dat", "chua thi"];
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
      return res
        .status(403)
        .json({ message: "Token không hợp lệ hoặc hết hạn" });
    }
    req.user = user;
    next();
  });
};

// Middleware kiểm tra admin
const checkAdmin = async (req, res, next) => {
  console.log("[DEBUG] ID from token:", req.user?.id);
  try {
    const [rows] = await pool.query("SELECT is_admin FROM users WHERE id = ?", [
      req.user.id,
    ]);
    if (rows.length === 0 || !rows[0].is_admin) {
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
      "SELECT id, username, email, phone FROM users"
    );
    res.json(rows);
  } catch (err) {
    console.error("Lỗi truy vấn users:", err);
    res.status(500).json({ message: "Lỗi truy vấn database" });
  }
});

app.post("/api/users", authenticateToken, checkAdmin, async (req, res) => {
  const { username, email, phone, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO users (username, email, phone, password) VALUES (?, ?, ?, ?)",
    [username, email, phone, hashedPassword]
  );
  res.json({ message: "Thêm người dùng thành công!" });
});

app.put("/api/users/:id", authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, email, phone } = req.body;
  await pool.query(
    "UPDATE users SET username = ?, email = ?, phone = ? WHERE id = ?",
    [username, email, phone, id]
  );
  res.json({ message: "Cập nhật thành công!" });
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

// API: Tạo table students_xml nếu chưa có
app.post("/api/init-students-xml-table", async (req, res) => {
  try {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS students_xml (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ho_ten VARCHAR(255) NOT NULL,
        so_dien_thoai VARCHAR(20),
        email VARCHAR(255),
        ngay_sinh DATE,
        dia_chi TEXT,
        ma_khoa_hoc VARCHAR(50),
        anh_chan_dung LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `;
    await pool.query(createTableSQL);
    res.json({ message: "Table students_xml đã được tạo hoặc đã tồn tại!" });
  } catch (err) {
    console.error("Error creating table:", err);
    res.status(500).json({ message: "Lỗi tạo table", error: err.message });
  }
});

// API: Lấy danh sách học viên từ XML
app.get("/api/students/xml", async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT ho_ten, so_dien_thoai, email, ngay_sinh, dia_chi, ma_khoa_hoc, COALESCE(anh_chan_dung, '') as anh, id, created_at, updated_at FROM students_xml ORDER BY created_at DESC`
    );
    res.json(results);
  } catch (err) {
    console.error("Error fetching XML students:", err);
    res
      .status(500)
      .json({ message: "Lỗi lấy danh sách học viên XML", error: err.message });
  }
});

// API: Upload file XML cho học viên
app.post(
  "/api/students/xml/upload",
  upload.single("file"),
  async (req, res) => {
    const filePath = req.file.path;
    const parser = new xml2js.Parser();

    fs.readFile(filePath, async (err, data) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Lỗi đọc file", error: err.message });

      parser.parseString(data, async (err, result) => {
        if (err)
          return res
            .status(400)
            .json({ message: "Lỗi parse XML", error: err.message });

        try {
          // Kiểm tra cấu trúc XML
          let students = [];
          if (result.students && result.students.student) {
            students = Array.isArray(result.students.student)
              ? result.students.student
              : [result.students.student];
          } else if (result.HO_SO) {
            // Single HO_SO item
            students = [result.HO_SO];
          } else {
            return res.status(400).json({
              message:
                "Cấu trúc XML không đúng. Cần có <students><student>...</student></students> hoặc <HO_SO>",
            });
          }

          // Tạo table nếu chưa có
          await pool.query(`
          CREATE TABLE IF NOT EXISTS students_xml (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ho_ten VARCHAR(255) NOT NULL,
            so_dien_thoai VARCHAR(20),
            email VARCHAR(255),
            ngay_sinh DATE,
            dia_chi TEXT,
            ma_khoa_hoc VARCHAR(50),
            anh_chan_dung LONGTEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

          // Cố gắng thay đổi anh_chan_dung từ VARCHAR(500) thành LONGTEXT nếu table cũ
          try {
            await pool.query(
              `ALTER TABLE students_xml MODIFY COLUMN anh_chan_dung LONGTEXT`
            );
          } catch (alterErr) {
            console.warn(
              "ALTER anh_chan_dung column failed, might already be LONGTEXT:",
              alterErr.message
            );
          }

          // Insert học viên
          const insertSQL = `
          INSERT INTO students_xml (ho_ten, so_dien_thoai, email, ngay_sinh, dia_chi, ma_khoa_hoc, anh_chan_dung)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

          for (const student of students) {
            // Xử lý trường anh: tùy theo cấu trúc XML
            let anhValue;
            if (result.students && result.students.student) {
              anhValue = student.anh?.[0];
            } else if (result.HO_SO) {
              anhValue = student.ANH_CHAN_DUNG?.[0];
            }
            console.log("Raw anh value:", anhValue);
            let anh = "";
            if (typeof anhValue === "string") {
              anh = anhValue || "";
            } else if (anhValue && typeof anhValue === "object" && anhValue._) {
              anh = anhValue._ || "";
            } else {
              anh = anhValue || "";
            }
            console.log("Processed anh:", anh);

            await pool.query(insertSQL, [
              student.ho_ten?.[0] || "",
              student.so_dien_thoai?.[0] || "",
              student.email?.[0] || "",
              student.ngay_sinh?.[0] || null,
              student.dia_chi?.[0] || "",
              student.ma_khoa_hoc?.[0] || "",
              anh,
            ]);
          }

          res.json({
            message: `Đã thêm ${students.length} học viên thành công!`,
          });
        } catch (dbErr) {
          console.error("Database error:", dbErr);
          if (dbErr.code === "ER_DUP_ENTRY") {
            res
              .status(409)
              .json({ message: "Một số học viên đã tồn tại trong database!" });
          } else {
            res
              .status(500)
              .json({ message: "Lỗi lưu vào database", error: dbErr.message });
          }
        }
      });
    });
  }
);

// API: Cập nhật học viên XML
app.put("/api/students/xml/:id", async (req, res) => {
  const { id } = req.params;
  const {
    ho_ten,
    so_dien_thoai,
    email,
    ngay_sinh,
    dia_chi,
    ma_khoa_hoc,
    anh_chan_dung,
  } = req.body;

  try {
    await pool.query(
      `
      UPDATE students_xml
      SET ho_ten = ?, so_dien_thoai = ?, email = ?, ngay_sinh = ?, dia_chi = ?, ma_khoa_hoc = ?, anh_chan_dung = ?
      WHERE id = ?
    `,
      [
        ho_ten,
        so_dien_thoai,
        email,
        ngay_sinh,
        dia_chi,
        ma_khoa_hoc,
        anh_chan_dung,
        id,
      ]
    );

    res.json({ message: "Cập nhật thành công!" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Lỗi cập nhật", error: err.message });
  }
});

// API: Xóa học viên XML
app.delete("/api/students/xml/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM students_xml WHERE id = ?", [id]);
    res.json({ message: "Đã xóa học viên!" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Lỗi xóa học viên", error: err.message });
  }
});

// đăng ký lích học
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

// Chi tiết lịch kèm số đã đăng ký
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
    // đếm đã đăng ký
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

// Lấy danh sách học viên đã đăng ký cho 1 lịch
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

// ...existing code...
// dành cho trang học viên

// be/app.js

app.post("/api/student/login", async (req, res) => {
  try {
    const { so_cmt } = req.body;

    console.log("👉 so_cmt nhận được:", so_cmt);

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

    res.json({
      user: {
        id: student.id,
        ho_va_ten: student.ho_va_ten,
        ngay_sinh: student.ngay_sinh,
        so_cmt: student.so_cmt,
        hang_gplx: student.hang_gplx,
        ten_khoa_hoc,
        ma_khoa_hoc,
        role: "student",
      },
      token: "dev-token",
    });
  } catch (err) {
    console.error("🔥 LOGIN ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET student full info (including course name) by id
app.get("/api/student/:id", async (req, res) => {
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
  const { subject_id } = req.query;
  try {
    let sql = "SELECT * FROM lessons";
    const params = [];
    if (subject_id) {
      // normalize subject_id to integer to avoid accidental mismatches
      const sid = Number(subject_id);
      if (Number.isNaN(sid)) {
        return res.status(400).json({ error: "subject_id must be a number" });
      }
      sql += " WHERE subject_id = ? ORDER BY lesson_order ASC";
      params.push(sid);

      // debug: count rows for this subject_id
      try {
        const [[countRow]] = await pool.query("SELECT COUNT(*) as c FROM lessons WHERE subject_id = ?", [sid]);
        console.log(`👉 API /api/lessons debug: subject_id=${sid} count=${countRow.c}`);
      } catch (e) {
        console.warn("Could not run lessons count debug", e.message);
      }
    }
    const [rows] = await pool.query(sql, params);
    console.log(`👉 API /api/lessons query: subject_id=${subject_id}, trả về ${rows.length} lessons`);
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
// API Thêm bài giảng (Đã sửa lại thứ tự tham số chuẩn 100%)
app.post("/api/lessons", async (req, res) => {
  const {
    subject_id,
    title,
    lesson_code,
    video_url,
    pdf_url,
    lesson_order,
    duration_minutes,
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
        // Bắt lỗi ở đây và KHÔNG làm gì cả để code chạy tiếp xuống dưới
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
      (subject_id, title, lesson_code, video_url, pdf_url, lesson_order, duration_minutes, content) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.query(sql, [
      subject_id,
      title,
      lesson_code || "",
      video_url || "",
      pdf_url || "",
      finalOrder,
      duration_minutes || 45,
      content || "",
    ]);

    res.json({ message: "Thêm thành công" });
  } catch (err) {
    console.error("Lỗi POST:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3.1. Lấy chi tiết bài giảng theo ID (Dành cho Học viên)
// 👇 THÊM API NÀY: Lấy chi tiết 1 bài giảng theo ID
app.get("/api/lessons/:id", async (req, res) => {
  // const { id } = req.params;
  try {
  const [rows] = await pool.query("SELECT * FROM lessons WHERE id = ?", [req.params.id]);
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
  } = req.body;
  let { content } = req.body;

  try {
    // Gọi hàm phụ trợ khi sửa
    if (pdf_url && (!content || content.trim() === "")) {
      const extracted = await extractPdfText(pdf_url);
      if (extracted) content = extracted; // Chỉ cập nhật nếu đọc được
    }

    const sql = `
      UPDATE lessons SET 
        subject_id = ?, title = ?, lesson_code = ?, video_url = ?, pdf_url = ?, 
        lesson_order = ?, duration_minutes = ?, content = ?
      WHERE id = ?
    `;
    await pool.query(sql, [
      subject_id,
      title,
      lesson_code,
      video_url,
      pdf_url,
      lesson_order,
      duration_minutes,
      content,
      id,
    ]);

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
    { name: "Cấu tạo và sửa chữa thông thường", code: "CT", hours: 10 },
    { name: "Kỹ thuật lái xe", code: "KT", hours: 20 },
    { name: "Tình huống mô phỏng", code: "MP", hours: 4 },
  ];

  try {
    // 1. Đảm bảo bảng có đủ cột
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

// tiến độ môn học
app.post("/api/student/lesson-progress", async (req, res) => {
  const { student_id, lesson_id, watched_seconds, duration_minutes } = req.body;

  if (!student_id || !lesson_id || !watched_seconds || !duration_minutes) {
    return res.status(400).json({ message: "Thiếu dữ liệu" });
  }

  try {
    // 👉 chỉ tính giờ nếu xem >= 80% bài
    const percentWatched =
      watched_seconds / (duration_minutes * 60);

    if (percentWatched < 0.8) {
      return res.json({
        success: false,
        message: "Chưa xem đủ 80%, không tính giờ",
      });
    }

    const minutesLearned = Math.round(watched_seconds / 60);

    await pool.query(
      `
      INSERT INTO student_lesson_progress (student_id, lesson_id, minutes_learned, completed)
      VALUES (?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        minutes_learned = GREATEST(minutes_learned, VALUES(minutes_learned)),
        completed = 1
      `,
      [student_id, lesson_id, minutesLearned]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("lesson-progress error:", err);
    res.status(500).json({ message: "Lỗi lưu tiến độ học" });
  }
});


app.get("/api/student/dashboard/:id", async (req, res) => {
  try {
    const studentId = req.params.id;

    // Lấy hạng GPLX của học viên để chỉ lấy requirement phù hợp.
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
        COALESCE(SUM(lh.minutes), 0) / 60 AS learned_hours
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
    console.error("🔥 DASHBOARD ERROR", err);
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

    const [[row]] = await pool.query(`
      SELECT
        COALESCE(SUM(lh.minutes), 0) / 60 AS learned_hours,
        COALESCE(SUM(sr.required_hours), 0) AS required_hours,
        s.hang_gplx
      FROM students s
      LEFT JOIN learning_history lh ON lh.student_id = s.id
      LEFT JOIN subject_requirements sr 
        ON sr.license_class = s.hang_gplx
      WHERE s.id = ?
    `, [studentId]);

    // Normalize response to match frontend expectations
    const total_learned = Number(row?.learned_hours || 0);
    const total_required = Number(row?.required_hours || 0);
    const progress = total_required > 0 ? Math.round((total_learned / total_required) * 100) : 0;

    res.json({
      total_learned,
      total_required,
      progress,
      hang_gplx: row?.hang_gplx || null,
    });
  } catch (err) {
    console.error("🔥 SUMMARY ERROR", err);
    console.error("SQL Message:", err.sqlMessage || err.message);
    res.status(500).json({ error: err.sqlMessage || err.message });
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
app.listen(3001, () => console.log("API running on http://localhost:3001"));
