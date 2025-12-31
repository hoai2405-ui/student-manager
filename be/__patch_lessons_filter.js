const fs = require('fs');

const filePath = process.cwd() + String.raw`\be\app.js`;
let source = fs.readFileSync(filePath, 'utf8');

// Replace the license_types filter clause to match both exact and base class before dot.
const oldClause =
  "(l.license_types IS NULL OR l.license_types = '' OR l.license_types = '[]' OR JSON_CONTAINS(l.license_types, JSON_QUOTE(?)))";

const newClause =
  "(l.license_types IS NULL OR l.license_types = '' OR l.license_types = '[]' OR JSON_CONTAINS(l.license_types, JSON_QUOTE(?)) OR JSON_CONTAINS(l.license_types, JSON_QUOTE(SUBSTRING_INDEX(?, '.', 1))))";

if (!source.includes(oldClause)) {
  throw new Error('Old license_types filter clause not found');
}

source = source.replace(oldClause, newClause);

// Ensure params include the extra placeholder argument by adding a second params.push(hangGplxNormalized)
// right after the existing push.
const marker = 'params.push(hangGplxNormalized);';
const firstIdx = source.indexOf(marker);
if (firstIdx < 0) {
  throw new Error('Could not find params.push(hangGplxNormalized);');
}
// Only add if not already added
const afterSlice = source.slice(firstIdx, firstIdx + marker.length + 80);
if (!afterSlice.includes('params.push(hangGplxNormalized);\n')) {
  // nothing
}

if (!afterSlice.includes('params.push(hangGplxNormalized);\n      params.push(hangGplxNormalized);')) {
  source =
    source.slice(0, firstIdx + marker.length) +
    "\n      params.push(hangGplxNormalized);" +
    source.slice(firstIdx + marker.length);
}

fs.writeFileSync(filePath, source, 'utf8');
console.log('patched', filePath);
