import fs from 'fs';
import path from 'path';

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

const outputFile = path.join(publicDir, 'source-code.txt');
let output = 'Project Source Code\n===================\n\n';

function readDir(dir: string) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      readDir(fullPath);
    } else {
      output += `\n\n================================================================================\n`;
      output += `FILE: ${fullPath.replace(process.cwd() + '/', '')}\n`;
      output += `================================================================================\n\n`;
      output += fs.readFileSync(fullPath, 'utf-8');
    }
  }
}

readDir(path.join(process.cwd(), 'src'));

const rootFiles = [
  'index.html', 
  'package.json', 
  'server.ts', 
  'vite.config.ts', 
  'tsconfig.json', 
  'tsconfig.app.json', 
  'tsconfig.node.json', 
  'tailwind.config.js', 
  'postcss.config.js'
];

for (const file of rootFiles) {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    output += `\n\n================================================================================\n`;
    output += `FILE: ${file}\n`;
    output += `================================================================================\n\n`;
    output += fs.readFileSync(path.join(process.cwd(), file), 'utf-8');
  }
}

fs.writeFileSync(outputFile, output);
console.log('Successfully generated source-code.txt');
