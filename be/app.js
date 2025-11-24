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

// Đã chuyển toàn bộ truy vấn sang dùng pool từ db.js (MySQL)
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
          return res.status(400).json({ message: "Cấu trúc XML không đúng: thiếu BAO_CAO1" });
        }
        if (!result.BAO_CAO1.DATA || !result.BAO_CAO1.DATA[0]) {
          console.error("❌ Không tìm thấy DATA trong BAO_CAO1");
          return res.status(400).json({ message: "Cấu trúc XML không đúng: thiếu DATA" });
        }
        if (!result.BAO_CAO1.DATA[0].KHOA_HOC || !result.BAO_CAO1.DATA[0].KHOA_HOC[0]) {
          console.error("❌ Không tìm thấy KHOA_HOC trong DATA");
          return res.status(400).json({ message: "Cấu trúc XML không đúng: thiếu KHOA_HOC" });
        }
        if (!result.BAO_CAO1.DATA[0].NGUOI_LXS || !result.BAO_CAO1.DATA[0].NGUOI_LXS[0]) {
          console.error("❌ Không tìm thấy NGUOI_LXS trong DATA");
          return res.status(400).json({ message: "Cấu trúc XML không đúng: thiếu NGUOI_LXS" });
        }
        
        const khoa = result.BAO_CAO1.DATA[0].KHOA_HOC[0];
        const hocvienList = result.BAO_CAO1.DATA[0].NGUOI_LXS[0].NGUOI_LX;
        console.log("✅ Tìm thấy khóa học:", khoa.MA_KHOA_HOC?.[0] || khoa.TEN_KHOA_HOC?.[0]);
        console.log("✅ Số lượng học viên:", Array.isArray(hocvienList) ? hocvienList.length : "Không phải array");
        
        if (!Array.isArray(hocvienList)) {
          console.error("❌ hocvienList không phải là array:", typeof hocvienList);
          return res.status(400).json({ message: " Không tìm thấy danh sách học viên trong XML" });
        }
        const sql =
          "INSERT INTO courses (ma_khoa_hoc, ten_khoa_hoc, ngay_khai_giang, ngay_be_giang, so_hoc_sinh, hang_gplx) VALUES (?, ?, ?, ?, ?, ?)";
        const sqlstudent = `
          INSERT INTO students (ho_va_ten, ngay_sinh, hang_gplx, so_cmt, ma_khoa_hoc, status, anh_chan_dung)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        try {
          await pool.query(`ALTER TABLE students ADD COLUMN anh_chan_dung LONGTEXT NULL`);
          console.log('✅ Đảm bảo cột anh_chan_dung tồn tại (LONGTEXT)');
        } catch (preErr) {
          if (preErr.code === 'ER_DUP_FIELDNAME') {
            try {
              await pool.query(`ALTER TABLE students MODIFY COLUMN anh_chan_dung LONGTEXT NULL`);
              console.log('✅ Đã xác nhận cột anh_chan_dung là LONGTEXT');
            } catch (modErr) {
              console.warn('⚠️ Không thể sửa cột anh_chan_dung:', modErr.message);
            }
          } else {
            console.warn('⚠️ Bỏ qua bước đảm bảo cột ảnh:', preErr.message);
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
          for (let i = 0; i < hocvienList.length; i++) {
            const hocvien = hocvienList[i];
            const studentName = hocvien.HO_VA_TEN?.[0] || `Student_${i + 1}`;
            
            // Debug: Log cấu trúc của học viên đầu tiên để xem có những trường gì
            if (i === 0) {
              console.log("\n=== DEBUG: Cấu trúc học viên đầu tiên ===");
              console.log("Tên học viên:", studentName);
              console.log("Tất cả các keys:", Object.keys(hocvien));
              console.log("Có HO_SO?", !!hocvien.HO_SO);
              if (hocvien.HO_SO) {
                const isArray = Array.isArray(hocvien.HO_SO);
                console.log("HO_SO là array?", isArray);
                if (isArray) {
                  console.log("HO_SO length:", hocvien.HO_SO.length);
                  if (hocvien.HO_SO[0]) {
                    console.log("HO_SO[0] keys:", Object.keys(hocvien.HO_SO[0]));
                    console.log("Có ANH_CHAN_DUNG?", !!hocvien.HO_SO[0].ANH_CHAN_DUNG);
                    if (hocvien.HO_SO[0].ANH_CHAN_DUNG) {
                      console.log("ANH_CHAN_DUNG[0] type:", typeof hocvien.HO_SO[0].ANH_CHAN_DUNG[0]);
                      console.log("ANH_CHAN_DUNG[0] length:", hocvien.HO_SO[0].ANH_CHAN_DUNG[0]?.length || 0);
                      console.log("ANH_CHAN_DUNG[0] preview:", hocvien.HO_SO[0].ANH_CHAN_DUNG[0]?.substring(0, 50) || "null");
                    }
                  }
                } else {
                  // HO_SO là object
                  console.log("HO_SO keys:", Object.keys(hocvien.HO_SO));
                  console.log("Có ANH_CHAN_DUNG?", !!hocvien.HO_SO.ANH_CHAN_DUNG);
                  if (hocvien.HO_SO.ANH_CHAN_DUNG) {
                    console.log("ANH_CHAN_DUNG là array?", Array.isArray(hocvien.HO_SO.ANH_CHAN_DUNG));
                    if (hocvien.HO_SO.ANH_CHAN_DUNG[0]) {
                      console.log("ANH_CHAN_DUNG[0] type:", typeof hocvien.HO_SO.ANH_CHAN_DUNG[0]);
                      console.log("ANH_CHAN_DUNG[0] length:", hocvien.HO_SO.ANH_CHAN_DUNG[0]?.length || 0);
                      console.log("ANH_CHAN_DUNG[0] preview:", hocvien.HO_SO.ANH_CHAN_DUNG[0]?.substring(0, 50) || "null");
                    }
                  }
                }
              }
            }
            
            // Xử lý ảnh từ XML - ảnh nằm trong HO_SO.ANH_CHAN_DUNG[0]
            let anhValue = null;
            
            // Kiểm tra trong HO_SO (cấu trúc XML thực tế: HO_SO là object, không phải array)
            if (hocvien.HO_SO) {
              // HO_SO có thể là array hoặc object
              if (Array.isArray(hocvien.HO_SO)) {
                // Nếu là array, lấy phần tử đầu tiên
                if (hocvien.HO_SO[0]) {
                  if (hocvien.HO_SO[0].ANH_CHAN_DUNG) {
                    if (hocvien.HO_SO[0].ANH_CHAN_DUNG[0]) {
                      anhValue = hocvien.HO_SO[0].ANH_CHAN_DUNG[0];
                      console.log(`✅ [${i + 1}/${hocvienList.length}] Tìm thấy ảnh trong HO_SO[0].ANH_CHAN_DUNG[0] (student: ${studentName})`);
                    } else {
                      if (i === 0) console.log(`⚠️  HO_SO[0].ANH_CHAN_DUNG tồn tại nhưng [0] là undefined/null`);
                    }
                  } else {
                    if (i === 0) console.log(`⚠️  HO_SO[0] không có ANH_CHAN_DUNG. Keys:`, Object.keys(hocvien.HO_SO[0]));
                  }
                } else {
                  if (i === 0) console.log(`⚠️  HO_SO là array nhưng [0] không tồn tại`);
                }
              } else {
                // HO_SO là object trực tiếp (cấu trúc thực tế từ XML)
                if (hocvien.HO_SO.ANH_CHAN_DUNG) {
                  if (Array.isArray(hocvien.HO_SO.ANH_CHAN_DUNG)) {
                    if (hocvien.HO_SO.ANH_CHAN_DUNG[0]) {
                      anhValue = hocvien.HO_SO.ANH_CHAN_DUNG[0];
                      console.log(`✅ [${i + 1}/${hocvienList.length}] Tìm thấy ảnh trong HO_SO.ANH_CHAN_DUNG[0] (student: ${studentName})`);
                    } else {
                      if (i === 0) console.log(`⚠️  HO_SO.ANH_CHAN_DUNG là array nhưng [0] là undefined/null`);
                    }
                  } else {
                    // ANH_CHAN_DUNG không phải array, có thể là string trực tiếp
                    anhValue = hocvien.HO_SO.ANH_CHAN_DUNG;
                    console.log(`✅ [${i + 1}/${hocvienList.length}] Tìm thấy ảnh trong HO_SO.ANH_CHAN_DUNG (không phải array) (student: ${studentName})`);
                  }
                } else {
                  if (i === 0) {
                    console.log(`⚠️  HO_SO không có ANH_CHAN_DUNG`);
                    console.log(`   HO_SO keys:`, Object.keys(hocvien.HO_SO));
                    // In ra một vài keys để debug
                    const sampleKeys = Object.keys(hocvien.HO_SO).slice(0, 10);
                    sampleKeys.forEach(key => {
                      const val = hocvien.HO_SO[key];
                      if (Array.isArray(val) && val[0] && typeof val[0] === 'string' && val[0].length > 100) {
                        console.log(`   - ${key}: có dữ liệu dài (${val[0].length} ký tự)`);
                      }
                    });
                  }
                }
              }
            } else {
              if (i === 0) {
                console.log(`⚠️  Học viên không có HO_SO`);
                console.log(`   Tất cả keys của học viên:`, Object.keys(hocvien));
              }
            }
            
            // Nếu không tìm thấy trong HO_SO, thử các tên trường phổ biến khác
            if (!anhValue) {
              const possibleImageFields = [
                'ANH_CHAN_DUNG', 'ANH_CHAN_DUNG_64', 'ANH_CHAN_DUNG_BASE64',
                'ANH', 'ANH_64', 'ANH_BASE64', 'IMAGE', 'PHOTO',
                'anh_chan_dung', 'anh_chan_dung_64', 'anh',
                'AnhChanDung', 'Anh', 'Image', 'Photo'
              ];
              
              for (const fieldName of possibleImageFields) {
                if (hocvien[fieldName] && hocvien[fieldName][0]) {
                  anhValue = hocvien[fieldName][0];
                  console.log(`✅ Tìm thấy ảnh ở trường: ${fieldName} (student: ${studentName})`);
                  break;
                }
              }
            }
            
            if (!anhValue && i === 0) {
              console.log("⚠️  Không tìm thấy ảnh trong các trường phổ biến. Tất cả các keys:", Object.keys(hocvien));
              for (const key in hocvien) {
                const value = hocvien[key]?.[0];
                if (value && typeof value === 'string' && value.length > 100) {
                  console.log(`  - ${key}: length=${value.length}, preview=${value.substring(0, 50)}...`);
                }
              }
            }
            if (anhValue && typeof anhValue === 'object') {
              if (anhValue._) {
                anhValue = anhValue._;
              } else if (typeof anhValue === 'object' && Object.keys(anhValue).length > 0) {
                const firstKey = Object.keys(anhValue)[0];
                anhValue = anhValue[firstKey];
              }
            }
            let anh = null;
            if (anhValue) {
              if (typeof anhValue === 'string') {
                anh = anhValue.trim().replace(/\s+/g, '');
                if (!anh || anh.length === 0) {
                  anh = null;
                } else {
                  console.log(`📸 Ảnh của ${studentName}: length=${anh.length}, startsWith=${anh.substring(0, 30)}...`);
                }
              } else {
                anh = String(anhValue);
                if (anh === 'null' || anh === 'undefined' || anh.trim().length === 0) {
                  anh = null;
                }
              }
            }
            if (!anh) {
              const valToString = (x) => {
                if (x == null) return null;
                if (Array.isArray(x)) x = x[0];
                if (typeof x === 'object') {
                  if (x._ != null) x = x._;
                  else {
                    const keys = Object.keys(x);
                    if (keys.length) {
                      let y = x[keys[0]];
                      if (Array.isArray(y)) y = y[0];
                      if (y && typeof y === 'object' && y._ != null) y = y._;
                      x = y;
                    }
                  }
                }
                if (x == null) return null;
                return typeof x === 'string' ? x : String(x);
              };
              const findImage = (obj) => {
                const stack = [];
                if (obj) stack.push(obj);
                while (stack.length) {
                  const cur = stack.pop();
                  if (!cur || typeof cur !== 'object') continue;
                  for (const key of Object.keys(cur)) {
                    const v = cur[key];
                    const k = key.toLowerCase();
                    if (k.includes('anh') && k.includes('chan') && k.includes('dung')) {
                      const s = valToString(v);
                      if (s && s.replace(/\s+/g,'').length > 100) return s;
                    }
                    if (Array.isArray(v)) {
                      for (const item of v) stack.push(item);
                    } else if (typeof v === 'object') {
                      stack.push(v);
                    }
                  }
                }
                return null;
              };
              const candidate = findImage(hocvien) || findImage(hocvien.HO_SO);
              if (candidate) {
                const normalized = candidate.trim().replace(/\s+/g,'');
                if (normalized) anh = normalized;
              }
            }
            if (!anh) {
              console.log(`⚠️  [${i + 1}/${hocvienList.length}] Không có ảnh cho học viên: ${studentName}`);
            } else {
              console.log(`💾 [${i + 1}/${hocvienList.length}] Đã lấy ảnh cho ${studentName} (length: ${anh.length})`);
            }
            
            try {
              const [result] = await conn.query(sqlstudent, [
                hocvien.HO_VA_TEN?.[0] || "",
                hocvien.NGAY_SINH?.[0] || null,
                hocvien.HANG_GPLX?.[0] || khoa.HANG_GPLX?.[0] || "",
                hocvien.SO_CMT?.[0] || "",
                khoa.MA_KHOA_HOC?.[0] || "",
                "chua thi",
                anh, // Lưu ảnh vào database (null nếu không có)
              ]);
              
              // Kiểm tra lại sau khi insert và tự sửa nếu thiếu ảnh
              if (anh && result.insertId) {
                const [check] = await conn.query(
                  "SELECT anh_chan_dung, LENGTH(anh_chan_dung) as anh_length FROM students WHERE id = ?",
                  [result.insertId]
                );
                if (check[0]) {
                  if (check[0].anh_chan_dung) {
                    console.log(`   ✅ Đã lưu thành công! Length trong DB: ${check[0].anh_length}`);
                  } else {
                    console.log(`   ⚠️  Ảnh không được lưu vào DB (NULL) → thử UPDATE trực tiếp...`);
                    try {
                      await conn.query(
                        "UPDATE students SET anh_chan_dung = ? WHERE id = ?",
                        [anh, result.insertId]
                      );
                      const [recheck] = await conn.query(
                        "SELECT LENGTH(anh_chan_dung) as anh_length FROM students WHERE id = ?",
                        [result.insertId]
                      );
                      if (recheck[0]?.anh_length > 0) {
                        console.log(`   ✅ Đã cập nhật ảnh qua UPDATE! Length: ${recheck[0].anh_length}`);
                      } else {
                        console.log(`   ❌ UPDATE ảnh vẫn không thành công (NULL)`);
                      }
                    } catch (updErr) {
                      console.error(`   ❌ Lỗi UPDATE ảnh:`, updErr.message);
                    }
                  }
                }
              }
            } catch (insertErr) {
              console.error(`❌ Lỗi khi insert học viên ${studentName}:`, insertErr.message);
              if (insertErr.message.includes('Data too long')) {
                console.error(`   ⚠️  Ảnh quá lớn! Đang tự động chuyển cột anh_chan_dung sang LONGTEXT và thử lại...`);
                try {
                  await conn.query(`ALTER TABLE students MODIFY COLUMN anh_chan_dung LONGTEXT NULL`);
                  const [retry] = await conn.query(sqlstudent, [
                    hocvien.HO_VA_TEN?.[0] || "",
                    hocvien.NGAY_SINH?.[0] || null,
                    hocvien.HANG_GPLX?.[0] || khoa.HANG_GPLX?.[0] || "",
                    hocvien.SO_CMT?.[0] || "",
                    khoa.MA_KHOA_HOC?.[0] || "",
                    "chua thi",
                    anh,
                  ]);
                  if (retry.insertId) {
                    console.log(`   ✅ Đã retry insert thành công sau khi ALTER LONGTEXT (id=${retry.insertId})`);
                  }
                } catch (alterErr) {
                  console.error(`   ❌ Retry insert thất bại:`, alterErr.message);
                  throw alterErr;
                }
              } else {
                throw insertErr;
              }
            }
          }
          await conn.commit();
          console.log(`\n✅ Hoàn thành! Đã thêm ${hocvienList.length} học viên vào database.\n`);
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
    console.error('Students API error:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
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
    const [results] = await pool.query(`SELECT ho_ten, so_dien_thoai, email, ngay_sinh, dia_chi, ma_khoa_hoc, COALESCE(anh_chan_dung, '') as anh, id, created_at, updated_at FROM students_xml ORDER BY created_at DESC`);
    res.json(results);
  } catch (err) {
    console.error("Error fetching XML students:", err);
    res.status(500).json({ message: "Lỗi lấy danh sách học viên XML", error: err.message });
  }
});

// API: Upload file XML cho học viên
app.post("/api/students/xml/upload", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  const parser = new xml2js.Parser();

  fs.readFile(filePath, async (err, data) => {
    if (err) return res.status(500).json({ message: "Lỗi đọc file", error: err.message });

    parser.parseString(data, async (err, result) => {
      if (err) return res.status(400).json({ message: "Lỗi parse XML", error: err.message });

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
          return res.status(400).json({ message: "Cấu trúc XML không đúng. Cần có <students><student>...</student></students> hoặc <HO_SO>" });
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
          await pool.query(`ALTER TABLE students_xml MODIFY COLUMN anh_chan_dung LONGTEXT`);
        } catch (alterErr) {
          console.warn("ALTER anh_chan_dung column failed, might already be LONGTEXT:", alterErr.message);
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
          if (typeof anhValue === 'string') {
            anh = anhValue || "";
          } else if (anhValue && typeof anhValue === 'object' && anhValue._) {
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
            anh
          ]);
        }

        res.json({ message: `Đã thêm ${students.length} học viên thành công!` });

      } catch (dbErr) {
        console.error("Database error:", dbErr);
        if (dbErr.code === "ER_DUP_ENTRY") {
          res.status(409).json({ message: "Một số học viên đã tồn tại trong database!" });
        } else {
          res.status(500).json({ message: "Lỗi lưu vào database", error: dbErr.message });
        }
      }
    });
  });
});

// API: Cập nhật học viên XML
app.put("/api/students/xml/:id", async (req, res) => {
  const { id } = req.params;
  const { ho_ten, so_dien_thoai, email, ngay_sinh, dia_chi, ma_khoa_hoc, anh_chan_dung } = req.body;

  try {
    await pool.query(`
      UPDATE students_xml
      SET ho_ten = ?, so_dien_thoai = ?, email = ?, ngay_sinh = ?, dia_chi = ?, ma_khoa_hoc = ?, anh_chan_dung = ?
      WHERE id = ?
    `, [ho_ten, so_dien_thoai, email, ngay_sinh, dia_chi, ma_khoa_hoc, anh_chan_dung, id]);

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
app.post('/api/schedules', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { course_id, start_time, end_time, capacity, location, notes } = req.body;
    const [result] = await pool.query(
      'INSERT INTO schedules (course_id, start_time, end_time, capacity, location, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [course_id, start_time, end_time, capacity || 0, location || null, notes || null]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách lịch (optionally filter by course_id)
app.get('/api/schedules', async (req, res) => {
  try {
    const { course_id } = req.query;
    let q = 'SELECT s.*, c.ten_khoa_hoc, c.ma_khoa_hoc FROM schedules s LEFT JOIN courses c ON s.course_id = c.id';
    const params = [];
    if (course_id) {
      q += ' WHERE s.course_id = ?';
      params.push(course_id);
    }
    q += ' ORDER BY s.start_time';
    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Chi tiết lịch kèm số đã đăng ký
app.get('/api/schedules/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [[schedule]] = await pool.query('SELECT s.*, c.ten_khoa_hoc FROM schedules s LEFT JOIN courses c ON s.course_id=c.id WHERE s.id = ?', [id]);
    if (!schedule) return res.status(404).json({ error: 'Not found' });
    const [countRows] = await pool.query('SELECT COUNT(*) AS cnt FROM registrations WHERE schedule_id = ?', [id]);
    schedule.registered = countRows[0].cnt || 0;
    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Đăng ký học viên vào 1 lịch (authenticated users)
app.post('/api/schedules/:id/register', authenticateToken, async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const { student_id } = req.body;
    // kiểm tra schedule
    const [sRows] = await pool.query('SELECT capacity FROM schedules WHERE id = ?', [scheduleId]);
    if (!sRows.length) return res.status(404).json({ error: 'Schedule not found' });
    const capacity = sRows[0].capacity || 0;
    // đếm đã đăng ký
    const [cRows] = await pool.query('SELECT COUNT(*) AS cnt FROM registrations WHERE schedule_id = ?', [scheduleId]);
    const registered = cRows[0].cnt || 0;
    if (capacity > 0 && registered >= capacity) return res.status(400).json({ error: 'Schedule is full' });
    // tạo đăng ký
    await pool.query('INSERT INTO registrations (schedule_id, student_id) VALUES (?, ?)', [scheduleId, student_id]);
    res.json({ success: true });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Already registered' });
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Hủy đăng ký
app.delete('/api/schedules/:id/register/:studentId', authenticateToken, async (req, res) => {
  try {
    const { id, studentId } = req.params;
    await pool.query('DELETE FROM registrations WHERE schedule_id = ? AND student_id = ?', [id, studentId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách học viên đã đăng ký cho 1 lịch
app.get('/api/schedules/:id/registrations', authenticateToken, checkAdmin, async (req, res) => {
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
});

// ...existing code...





app.listen(3001, () => console.log("API running on http://localhost:3001"));
