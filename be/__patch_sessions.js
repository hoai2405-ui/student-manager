const fs = require('fs');

const filePath = process.cwd() + String.raw`\be\app.js`;
let source = fs.readFileSync(filePath, 'utf8');

const start = source.indexOf('app.get("/api/admin/student/:id/sessions"');
const end = source.indexOf('app.get("/api/admin/exams"', start);
if (start < 0 || end < 0) {
  throw new Error('Could not locate /api/admin/student/:id/sessions block');
}

let block = source.slice(start, end);

const oldFrom =
  'if (from) {\n      where.push("ls.started_at >= ?");\n      params.push(new Date(from));\n    }';
const oldTo =
  'if (to) {\n      where.push("ls.started_at <= ?");\n      params.push(new Date(to));\n    }';

if (!block.includes(oldFrom) || !block.includes(oldTo)) {
  throw new Error('Expected from/to clauses not found; file may have changed');
}

const newFrom =
  'if (from) {\n      const fromDate = new Date(from);\n      if (Number.isNaN(fromDate.getTime())) {\n        return res.status(400).json({ message: "from không hợp lệ" });\n      }\n      where.push("ls.started_at >= ?");\n      params.push(fromDate);\n    }';
const newTo =
  'if (to) {\n      const toDate = new Date(to);\n      if (Number.isNaN(toDate.getTime())) {\n        return res.status(400).json({ message: "to không hợp lệ" });\n      }\n      where.push("ls.started_at <= ?");\n      params.push(toDate);\n    }';

block = block.replace(oldFrom, newFrom).replace(oldTo, newTo);
source = source.slice(0, start) + block + source.slice(end);

fs.writeFileSync(filePath, source, 'utf8');
console.log('patched', filePath);
