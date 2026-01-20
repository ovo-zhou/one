/* eslint-disable no-undef */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  console.log('Building packages/ui...');
  execSync('cd packages/ui && yarn build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('Build completed.');

  const srcDir = path.join(__dirname, '..', 'packages', 'ui', 'dist');
  const destDir = path.join(__dirname, '..', 'apps', 'origin', 'client');

  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }

  // 使用 cp -r 命令复制整个目录
  execSync(`cp -r "${srcDir}" "${destDir}"`, { stdio: 'inherit' });
  console.log('Copied dist to apps/origin/client');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
