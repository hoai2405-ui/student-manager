const fs = require('fs');
const p = 'c:/Users/Hoai/Downloads/student-manager-main/student-manager-main/be/app.js';
const b = fs.readFileSync(p);
const s = b.toString('utf8');
console.log('len', s.length);
console.log('has /api/subjects', s.includes('/api/subjects'));
const idx = s.indexOf('/api/subjects');
console.log('snippet', s.slice(idx - 20, idx + 40));
