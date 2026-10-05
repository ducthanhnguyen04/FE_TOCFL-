const fs = require('fs');
const path = require('path');

function replaceContent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Avoid replacing things in node_modules or .git
  const newContent = content
    .replace(/HSK/g, 'TOCFL')
    .replace(/hsk/g, 'tocfl')
    .replace(/tiếng Trung/g, 'tiếng Đài Loan');
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === '.git') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
      // Rename directory if it contains HSK
      if (file.includes('HSK') || file.includes('hsk')) {
        const newName = file.replace(/HSK/g, 'TOCFL').replace(/hsk/g, 'tocfl');
        fs.renameSync(fullPath, path.join(dir, newName));
      }
    } else {
      // Process file content
      if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.css') || fullPath.endsWith('.json')) {
        replaceContent(fullPath);
      }
      // Rename file if it contains HSK
      if (file.includes('HSK') || file.includes('hsk')) {
        const newName = file.replace(/HSK/g, 'TOCFL').replace(/hsk/g, 'tocfl');
        fs.renameSync(fullPath, path.join(dir, newName));
      }
    }
  }
}

walkDir(path.join(__dirname, 'src'));
console.log('Done replacing and renaming');
