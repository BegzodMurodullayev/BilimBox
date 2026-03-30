const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'www');
fs.rmSync(outDir, { recursive: true, force: true });
console.log('Removed generated www directory.');
