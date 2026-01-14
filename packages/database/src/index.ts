export * from "./ai";
import envPaths from 'env-paths';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const APP_NAME = 'local-db';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export default class DatabaseClient {
  constructor() {
    const paths = envPaths(APP_NAME);
    const dataDir = paths.data; // 目录
    const dbPath = path.join(dataDir, 'database.sqlite'); // 数据库文件名
    // 确保数据目录存在
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const connectionUrl = `file:${dbPath}`;
    const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
    try {
      // 寻找 prisma 可执行文件 (优先使用本地安装的，比 npx 快)
      // 通常在 my-lib/node_modules/.bin/prisma
      const prismaBin = path.resolve(__dirname, '../../node_modules/.bin/prisma');

      // 兼容性处理：如果找不到本地 bin (比如在某些 monorepo 结构中)，回退到 npx
      let command = `"${prismaBin}" migrate deploy --schema "${schemaPath}"`;
      if (!fs.existsSync(prismaBin)) {
        command = `npx prisma migrate deploy --schema "${schemaPath}"`;
      }

      execSync(command, {
        env: {
          ...process.env,
          // 强制覆盖 schema 中的环境变量
          DATABASE_URL: connectionUrl
        },
        stdio: 'inherit' // 在控制台显示迁移日志
      });

    } catch (error) {
      console.error('数据库自动迁移失败，请检查 schema 路径或权限。');
      throw error;
    }
  }
}