const fs = require('fs');
const p = 'c:/Users/Hoai/Downloads/student-manager-main/student-manager-main/be/app.js';
const buf = fs.readFileSync(p);
console.log('bom', buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf);
