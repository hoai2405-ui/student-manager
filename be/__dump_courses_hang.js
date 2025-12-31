const pool = require('./db');

(async () => {
  const [rows] = await pool.query('SELECT id, ma_khoa_hoc, ten_khoa_hoc, hang_gplx FROM courses ORDER BY id DESC');
  console.table(rows);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
