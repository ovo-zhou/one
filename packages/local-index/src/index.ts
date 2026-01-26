import path from 'path';
import envPaths from 'env-paths';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import AgentConfig from "./ai/prompt";
import Messages from "./ai/message";
import Conversations from "./ai/conversation";

const APP_NAME = 'local-db';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export default class DatabaseClient {
  private static instance: DatabaseClient;
  private client: PrismaClient;

  private constructor(isDev: boolean = false) {
    // 如果是在开发环境，使用本地数据库文件，文件在包目录下
    if (isDev) {
      const connectionString = `file:${path.join(__dirname, '../dev.db')}`;
      const adapter = new PrismaBetterSqlite3({ url: connectionString });
      this.client = new PrismaClient({
        adapter,
      });
      return;
    }
    // 在生产环境，使用系统默认数据目录，文件在用户目录下
    const paths = envPaths(APP_NAME);
    const dataDir = paths.data; // 目录
    const dbPath = path.join(dataDir, 'database.db'); // 数据库文件名
    // 确保数据目录存在
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const connectionUrl = `file:${dbPath}`;
    const adapter = new PrismaBetterSqlite3({ url: connectionUrl });

    try {
      const command = `npx prisma migrate deploy`;
      execSync(command, {
        env: {
          ...process.env,
          DATABASE_URL: connectionUrl
        },
        stdio: 'inherit', // 在控制台显示迁移日志
        cwd: path.resolve(__dirname, '..'),
      });
    } catch (error) {
      console.error('数据库自动迁移失败，请检查 schema 路径或权限。');
      throw error;
    }
    this.client = new PrismaClient({
      adapter,
    });
  }

  public static getInstance(isDev: boolean = false): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient(isDev);
    }
    return DatabaseClient.instance;
  }

  public getClient(): PrismaClient {
    return this.client;
  }

  agentConfig() {
    return AgentConfig.getInstance(this.client)
  }
  message() {
    return Messages.getInstance(this.client)
  }
  conversation() {
    return Conversations.getInstance(this.client)
  }
}