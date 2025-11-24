// Script để kiểm tra và sửa cấu trúc database
require("dotenv").config();
const mysql = require("mysql2/promise");

async function checkAndFixDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });

    console.log("✅ Đã kết nối database\n");

    // Kiểm tra cấu trúc bảng students
    console.log("📋 Kiểm tra cấu trúc bảng students...");
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);

    console.log("\nCác cột trong bảng students:");
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Kiểm tra cột anh_chan_dung
    const anhColumn = columns.find(col => col.COLUMN_NAME === 'anh_chan_dung');
    if (!anhColumn) {
      console.log("\n❌ Không tìm thấy cột anh_chan_dung!");
      console.log("🔧 Đang tạo cột anh_chan_dung...");
      await connection.query(`
        ALTER TABLE students 
        ADD COLUMN anh_chan_dung LONGTEXT NULL
      `);
      console.log("✅ Đã tạo cột anh_chan_dung");
    } else {
      console.log(`\n📸 Cột anh_chan_dung hiện tại: ${anhColumn.DATA_TYPE}${anhColumn.CHARACTER_MAXIMUM_LENGTH ? `(${anhColumn.CHARACTER_MAXIMUM_LENGTH})` : ''}`);
      
      // Nếu không phải LONGTEXT, sửa lại
      if (anhColumn.DATA_TYPE !== 'longtext' && anhColumn.DATA_TYPE !== 'text' && anhColumn.DATA_TYPE !== 'mediumtext') {
        console.log("⚠️  Cột anh_chan_dung quá nhỏ để lưu ảnh base64!");
        console.log("🔧 Đang sửa cột thành LONGTEXT...");
        try {
          await connection.query(`
            ALTER TABLE students 
            MODIFY COLUMN anh_chan_dung LONGTEXT NULL
          `);
          console.log("✅ Đã sửa cột anh_chan_dung thành LONGTEXT");
        } catch (err) {
          console.error("❌ Lỗi khi sửa cột:", err.message);
        }
      } else {
        console.log("✅ Cột anh_chan_dung đã đủ lớn để lưu ảnh");
      }
    }

    // Kiểm tra một vài record mẫu
    console.log("\n📊 Kiểm tra dữ liệu mẫu...");
    const [samples] = await connection.query(`
      SELECT ho_va_ten, 
             CASE 
               WHEN anh_chan_dung IS NULL THEN 'NULL'
               WHEN anh_chan_dung = '' THEN 'EMPTY'
               ELSE CONCAT('Có dữ liệu (', LENGTH(anh_chan_dung), ' ký tự)')
             END as anh_status,
             LENGTH(anh_chan_dung) as anh_length
      FROM students 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log("\n5 học viên gần nhất:");
    samples.forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.ho_va_ten}: ${row.anh_status}`);
    });

    console.log("\n✅ Hoàn thành kiểm tra!");

  } catch (error) {
    console.error("❌ Lỗi:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAndFixDatabase();

