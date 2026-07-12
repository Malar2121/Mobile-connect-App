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
  if (!filePath.endsWith('.js')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip DashboardScreen
  if (filePath.includes('DashboardScreen')) return;
  
  // Skip files that use noPadding, as they rely on manual padding for specific elements
  if (content.includes('noPadding')) return;
  
  // Skip files that don't use <Screen
  if (!content.includes('<Screen')) return;
  
  let changed = false;

  // Pattern 1: { paddingHorizontal: horizontalPadding, ... }
  // Pattern 2: { ..., paddingHorizontal: horizontalPadding }
  // Pattern 3: style={{ paddingHorizontal: horizontalPadding }}
  // Pattern 4: paddingHorizontal: layout.contentPadding

  const regex1 = /paddingHorizontal:\s*(horizontalPadding|layout\.contentPadding),?\s*/g;
  
  if (regex1.test(content)) {
    content = content.replace(regex1, '');
    changed = true;
  }
  
  // Cleanup empty styles like style={{ }} or style={[]} or style={[styles.foo, { }]}
  if (changed) {
    // style={{ }} -> removed
    content = content.replace(/style=\{\{\s*\}\}/g, '');
    // contentContainerStyle={{ }} -> removed
    content = content.replace(/contentContainerStyle=\{\{\s*\}\}/g, '');
    
    // style={[styles.foo, { }]} -> style={styles.foo}
    // We can do this with regex: \[\s*([^,]+),\s*\{\s*\}\s*\]
    content = content.replace(/\[\s*([^,\[\]]+),\s*\{\s*\}\s*\]/g, '$1');
    
    // style={[{ }]} -> removed
    // actually just let it be, it's harmless
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Cleaned double padding:', filePath);
  }
});
