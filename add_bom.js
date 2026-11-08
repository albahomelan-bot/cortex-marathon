const fs = require('fs');
const filePath = 'C:\\Users\\Admin\\Documents\\antigravity\\radiant-rutherford\\site-cortex-marathon\\gui_updater.ps1';
let content = fs.readFileSync(filePath, 'utf8');
const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
fs.writeFileSync(filePath, Buffer.concat([bom, Buffer.from(content, 'utf8')]));
console.log('Saved with UTF-8 BOM!');
