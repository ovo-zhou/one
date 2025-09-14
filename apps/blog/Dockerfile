# 使用官方 Node.js 镜像作为构建环境
FROM node:22-alpine

# 设置工作目录
WORKDIR /app

# 首先复制包管理文件以利用 Docker 缓存层
COPY package.json ./

# 安装依赖（包括 devDependencies，因为需要构建）
RUN yarn

# 复制项目文件
COPY . .

# 环境变量
ENV NODE_ENV=production

# 使用非 root 端口
EXPOSE 3000

# 启动命令
CMD ["yarn build && yarn start"]
