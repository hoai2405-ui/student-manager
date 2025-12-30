const fs = require('fs');

const filePath = process.cwd() + String.raw`\be\app.js`;
let source = fs.readFileSync(filePath, 'utf8');

const start = source.indexOf('app.get("/api/admin/student/:id/sessions"');
const end = source.indexOf('app.get("/api/admin/exams"', start);
if (start < 0 || end < 0) {
  throw new Error('Could not locate /api/admin/student/:id/sessions block');
}

let block = source.slice(start, end);

// Ensure there is a comma between face_verified_out and created_at in the SELECT list.
block = block.replace(
  /ls\.face_verified_out\s*\n\s*ls\.created_at/g,
  'ls.face_verified_out,\n         ls.created_at'
);

source = source.slice(0, start) + block + source.slice(end);
fs.writeFileSync(filePath, source, 'utf8');
console.log('patched', filePath);
