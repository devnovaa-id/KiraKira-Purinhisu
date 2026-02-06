const fs = require('fs');
const path = require('path');

const FOLDERS = [
  'config.js', 
  'handler.js', 
  'index.js', 
  'main.js', 
  'plugins/main-menu.js', 
  'plugins/main-enable.js', 
  'lib'
];

// kamu pilih folder mana mau di list semua file nya
const fileName = [
  // 'plugins'
];

const OUTPUT_FILE = path.join(__dirname, 'backup.md');

// ================= CORE =================

function readAllFiles(targetPath, fileList = []) {
  if (!fs.existsSync(targetPath)) return fileList;

  const stat = fs.statSync(targetPath);

  if (stat.isFile()) {
    fileList.push(targetPath);
    return fileList;
  }

  if (stat.isDirectory()) {
    for (const file of fs.readdirSync(targetPath)) {
      readAllFiles(path.join(targetPath, file), fileList);
    }
  }

  return fileList;
}

// ================= BACKUP =================

function createBackup() {
  let output = '';

  // ================= FILE LIST DARI fileName =================

  output += `# FILE NAME LIST\n\n`;

  for (const folder of fileName) {
    const folderPath = path.join(__dirname, folder);

    const files = readAllFiles(folderPath);

    for (const filePath of files) {
      const relativePath = path
        .relative(__dirname, filePath)
        .replace(/\\/g, '/');

      output += relativePath + '\n';
    }
  }

  output += `\n---\n\n`;

  // ================= BACKUP CONTENT =================

  for (const item of FOLDERS) {
    const targetPath = path.join(__dirname, item);
    const files = readAllFiles(targetPath);

    for (const filePath of files) {
      const relativePath = path
        .relative(__dirname, filePath)
        .replace(/\\/g, '/');

      let content = '';

      try {
        content = fs.readFileSync(filePath, 'utf8');
      } catch {
        content = '[ERROR READ FILE]';
      }

      output += `// ${relativePath}\n`;
      output += content + '\n\n---\n\n';
    }
  }

  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');

  console.log('✅ Backup selesai');
}

createBackup();