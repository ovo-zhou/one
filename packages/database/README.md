## 数据库模块

此模块用于存储数据到sqlite,任何apps下面的项目都可以调用

## 功能

- ai 会话管理（支持消息记录保存）
- agent 管理

## prisma 本地开发

- 编辑 `prisma/schema.prisma` 文件

- 执行数据库迁移

```bash
npx prisma migrate dev --name init
```

## 应用更改到生产环境

- 应用更改到生产环境时，需要执行以下命令

```bash
npx prisma migrate deploy
```

- 生成 prisma 客户端

```bash
npx prisma generate
```