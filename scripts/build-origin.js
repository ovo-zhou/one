/* eslint-disable no-undef */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  // 构建客户端 UI
  console.log(chalk.blue('构建 packages/client-ui...'));
  execSync('cd packages/client-ui && yarn build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log(chalk.green('构建完成.'));

  // 复制 client-ui 到 origin 目录
  console.log(chalk.blue('复制 packages/client-ui 到 apps/origin/client-ui...'));
  const srcDir = path.join(__dirname, '..', 'packages', 'client-ui', 'dist');
  const destDir = path.join(__dirname, '..', 'apps', 'origin', 'client-ui');
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  execSync(`cp -r "${srcDir}" "${destDir}"`, { stdio: 'inherit' });
  console.log(chalk.green('复制完成.'));

  // 构建 local-index
  console.log(chalk.blue('构建 packages/local-index...'));
  execSync('cd packages/local-index && yarn build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log(chalk.green('构建完成.'));

  // 构建 origin
  console.log(chalk.blue('构建 apps/origin...'));
  execSync('cd apps/origin && yarn build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log(chalk.green('构建完成.'));
  process.exit(0);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
