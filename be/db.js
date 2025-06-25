const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root", // đổi theo máy bạn
  password: "", // đổi theo máy bạn
  database: "shlx",
});

module.exports = pool;
