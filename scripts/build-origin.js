/* eslint-disable no-undef */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  console.log('构建 packages/client-ui...');
  execSync('cd packages/client-ui && yarn build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('构建完成.');

  const srcDir = path.join(__dirname, '..', 'packages', 'client-ui', 'dist');
  const destDir = path.join(__dirname, '..', 'apps', 'origin', 'client-ui');

  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }

  // 使用 cp -r 命令复制整个目录
  execSync(`cp -r "${srcDir}" "${destDir}"`, { stdio: 'inherit' });
  console.log('复制完成.');

  // 构建 local-index
  console.log('构建 packages/local-index...');
  execSync('cd packages/local-index && yarn build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('构建完成.');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
