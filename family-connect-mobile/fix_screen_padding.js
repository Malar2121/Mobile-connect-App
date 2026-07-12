const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('./src/screens', function(filePath) {
  if (filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Replace <Screen edges={['top']} style={{ paddingHorizontal: 0 }}> with <Screen edges={['top']} noPadding>
    const regex = /<Screen\s+edges=\{\['top'\]\}\s+style=\{\{\s*paddingHorizontal:\s*0\s*\}\}\s*>/g;
    if (regex.test(content)) {
      content = content.replace(regex, "<Screen edges={['top']} noPadding>");
      changed = true;
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed:', filePath);
    }
  }
});
