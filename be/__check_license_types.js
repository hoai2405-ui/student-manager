const pool = require('./db');

(async () => {
  const [rows] = await pool.query(
    "SELECT COUNT(*) as c FROM lessons WHERE license_types IS NOT NULL AND license_types <> '' AND license_types <> '[]'"
  );
  console.log('count non-empty license_types:', rows[0].c);

  const [sample] = await pool.query(
    "SELECT id,title,license_types FROM lessons WHERE license_types IS NOT NULL AND license_types <> '' AND license_types <> '[]' LIMIT 10"
  );
  console.log(sample);

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
