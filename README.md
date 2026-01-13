# One - 全栈项目

一个基于 Node.js 的全栈项目，包含博客应用、UI组件库和数据库模块。

## 项目结构

```
├── apps/
│   ├── blog/          # Next.js 博客应用
│   └── origin/        # Electron 原生应用
├── packages/
│   ├── database/      # SQLite 数据库模块 (Prisma)
│   └── ui/            # React UI 组件库
└── scripts/           # 构建和部署脚本
```

## Commit 规范

项目使用 Conventional Commits 规范，commit 消息格式为：

```
<type>(<scope>): <description>
```

### 允许的 scope

- `database`: 数据库相关更改
- `ui`: UI组件库相关更改
- `blog`: 博客应用相关更改
- `origin`: origin应用相关更改
- `root`: 根目录配置相关更改

### 示例

```bash
feat(database): add conversation CRUD operations
fix(ui): resolve button styling issue
docs(root): update README
```

## 开发环境设置

### 安装依赖

```bash
yarn install
```

### 数据库设置

```bash
cd packages/database
npx prisma migrate dev --name init
npx prisma generate
```

### 运行应用

```bash
# 博客应用
cd apps/blog
yarn dev

# UI组件库开发
cd packages/ui
yarn dev
```

## 部署

### 生产环境数据库迁移

```bash
cd packages/database
npx prisma migrate deploy
npx prisma generate
