const fs = require('fs');
const path = require('path');

const root = __dirname;
const outDir = path.join(root, 'www');
const include = ['index.html', 'server.js', 'ui', 'bolimlar', 'bridge', 'build'];

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const name of include) {
  const src = path.join(root, name);
  if (fs.existsSync(src)) {
    copyRecursive(src, path.join(outDir, name));
  }
}

console.log('Prepared www for Capacitor.');
