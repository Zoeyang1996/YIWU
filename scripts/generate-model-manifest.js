const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '..', 'public', 'models');
const outFile = path.join(modelsDir, 'manifest.json');

function walk(dir, base = '') {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.posix.join(base, e.name);
    if (e.isDirectory()) {
      results = results.concat(walk(full, rel));
    } else {
      const ext = path.extname(e.name).toLowerCase();
      if (ext === '.glb' || ext === '.gltf') results.push(rel);
    }
  }
  return results;
}

if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const files = walk(modelsDir, '');
fs.writeFileSync(outFile, JSON.stringify(files, null, 2), 'utf8');
console.log('Wrote', outFile, files.length, 'entries');
