## 数据库模块

此模块用于存储数据到 sqlite,任何apps下面的项目都可以调用

> database 模块只适用于 node 环境的本地数据存储需求，不建议在node server 中使用。

## 功能

- ai 会话管理（支持消息记录保存）
- agent 管理

## 本地开发

### 安装依赖

package.json 中配置了 postinstall 脚本，会在安装依赖后自动执行 prisma generate 命令，帮助生成 prisma 客户端

```bash
yarn install
```
> 注意：如果 migrations 目录下有未应用的迁移文件或者本地开发时没有sqlite本地数据库文件，需要执行 prisma migrate dev 命令来更新数据库迁移文件，prisma migrate dev 命令同时也会自动执行 prisma generate 命令生成 prisma 客户端。

### 开发阶段更新数据库架构标准流程

- 编辑 `prisma/schema.prisma` 文件

- 执行数据库迁移

  ```bash
  npx prisma migrate dev --name init
  ```

> 在提交代码前，应该提交prisma/migrations目录下的所有迁移文件，以及 prisma/schema.prisma 文件。不应该提交本地数据库文件

## 应用更改到生产环境

在生产环境中，初始化database模块时，会自动执行 prisma migrate deploy 命令，将数据库迁移到最新版本，数据库文件会自动创建在userdata 目录下。
