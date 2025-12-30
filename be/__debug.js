const fs = require('fs');

const p = process.cwd() + String.raw`\be\app.js`;
const s = fs.readFileSync(p, 'utf8');

const start = s.indexOf('app.get("/api/admin/student/:id/sessions"');
const end = s.indexOf('app.get("/api/admin/exams"', start);

const block = s.slice(start, end);
const oldFrom =
  'if (from) {\n      where.push("ls.started_at >= ?");\n      params.push(new Date(from));\n    }';

console.log({ start, end, hasOldFrom: block.includes(oldFrom) });
