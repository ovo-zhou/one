## 本地开发

运行`npm serve`启动本地开发，会同时开启 next.js 本地开发和 tailwind.css 编译

由于登录时，cookie和现网域名绑定，需要使用代理将现网域名代理到本地端口，同时开启热更新

```
https://www.ryandev.cn http://localhost:3000
wss://www.ryandev.cn/_next/webpack-hmr ws://127.0.0.1:3000/_next/webpack-hmr
```

## 数据库修改

- 先修改 prisma/schema.prisma 下的文件，确保字段，类型配置正确
- 运行迁移命令`npx prisma migrate dev --name <迁移名称>`，此命令会生成迁移文件，并且修改数据库
- 将迁移文件提交到 git 仓库，便于将数据库修改同步到生产环境


## 部署

- 在生产环境运动`npx prisma generate`，生成 prisma 客户端
- 在生产环境运行`npx prisma migrate deploy`，将数据库迁移文件中的更改同步到生产数据库
- 运行`npm run build`构建项目
- 运行`npm run start`启动项目