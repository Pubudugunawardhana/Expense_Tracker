const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-dev-utils',
  'checkRequiredFiles.js'
);
const deprecatedSnippet = 'fs.accessSync(filePath, fs.F_OK);';
const fixedSnippet = 'fs.accessSync(filePath, fs.constants.F_OK);';

if (!fs.existsSync(targetFile)) {
  console.log('[patch-react-dev-utils] Skipped: react-dev-utils not installed yet.');
  process.exit(0);
}

const original = fs.readFileSync(targetFile, 'utf8');

if (original.includes(fixedSnippet)) {
  console.log('[patch-react-dev-utils] Already patched.');
  process.exit(0);
}

if (!original.includes(deprecatedSnippet)) {
  console.log('[patch-react-dev-utils] Skipped: expected snippet not found.');
  process.exit(0);
}

const updated = original.replace(deprecatedSnippet, fixedSnippet);
fs.writeFileSync(targetFile, updated, 'utf8');
console.log('[patch-react-dev-utils] Patched react-dev-utils/checkRequiredFiles.js');
