require("dotenv").config();
const mysql = require("mysql2/promise");

// Debug: Hiển thị thông tin đã load từ .env (không hiển thị password)
console.log("🔍 Đang kiểm tra file .env...");
console.log("📋 Các biến môi trường đã load:");
console.log(`   DB_HOST: ${process.env.DB_HOST || "❌ CHƯA SET"}`);
console.log(`   DB_USER: ${process.env.DB_USER || "❌ CHƯA SET"}`);
console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? "✅ Đã set" : "❌ CHƯA SET"}`);
console.log(`   DB_NAME: ${process.env.DB_NAME || "❌ CHƯA SET"}`);
console.log(`   DB_PORT: ${process.env.DB_PORT || "3306 (mặc định)"}`);

// Kiểm tra các biến môi trường cần thiết
// DB_PASSWORD có thể rỗng nếu MySQL không có password
const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_NAME"];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName] || process.env[varName].trim() === "");

if (missingVars.length > 0) {
  console.error("\n❌ LỖI: Thiếu hoặc rỗng các biến môi trường sau:", missingVars.join(", "));
  console.error("📝 Vui lòng kiểm tra file .env trong thư mục be/ và đảm bảo có đầy đủ:");
  console.error(`
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=student_manager
DB_PORT=3306
JWT_SECRET=supersecret
  `);
  console.error("\n💡 Lưu ý:");
  console.error("   - Không có khoảng trắng trước/sau dấu =");
  console.error("   - Không có dấu ngoặc kép quanh giá trị (trừ khi cần)");
  console.error("   - DB_PASSWORD có thể để trống nếu MySQL không có password");
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test connection khi khởi động
console.log("\n🔌 Đang thử kết nối database...");
pool
  .getConnection()
  .then((connection) => {
    console.log("✅ Kết nối database thành công!");
    console.log(`📊 Database: ${process.env.DB_NAME} @ ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
    console.log(`👤 User: ${process.env.DB_USER}`);
    
    // Test query đơn giản
    return connection.query("SELECT 1 as test");
  })
  .then(([rows]) => {
    console.log("✅ Test query thành công!");
    console.log("🚀 Database sẵn sàng sử dụng!\n");
  })
  .catch((err) => {
    console.error("\n❌ LỖI: Không thể kết nối database!");
    console.error("Chi tiết lỗi:", err.message);
    console.error("Mã lỗi:", err.code || "N/A");
    
    console.error("\n📝 Vui lòng kiểm tra:");
    
    // Kiểm tra các lỗi phổ biến
    if (err.code === "ECONNREFUSED") {
      console.error("   ⚠️  MySQL server chưa chạy hoặc không chạy ở port này");
      console.error("   💡 Thử: net start MySQL (Windows) hoặc sudo systemctl start mysql (Linux)");
    } else if (err.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("   ⚠️  Sai username hoặc password");
      console.error("   💡 Kiểm tra lại DB_USER và DB_PASSWORD trong file .env");
    } else if (err.code === "ER_BAD_DB_ERROR") {
      console.error("   ⚠️  Database không tồn tại");
      console.error(`   💡 Tạo database: CREATE DATABASE ${process.env.DB_NAME};`);
    } else if (err.code === "ETIMEDOUT" || err.code === "ENOTFOUND") {
      console.error("   ⚠️  Không thể kết nối đến MySQL server");
      console.error(`   💡 Kiểm tra DB_HOST trong file .env (hiện tại: ${process.env.DB_HOST})`);
    } else {
      console.error("   1. MySQL server đã chạy chưa?");
      console.error("   2. Thông tin trong file .env có đúng không?");
      console.error("   3. Database đã được tạo chưa?");
      console.error("   4. User có quyền truy cập database không?");
    }
    
    process.exit(1);
  });

module.exports = pool;