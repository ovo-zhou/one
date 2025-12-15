# 项目简介

个人站点项目，基于 Next.js 构建，托管在腾讯云开发

## 开发

数据托管于腾讯云开发数据库，在开发之前需要先初始化腾讯云开发 sdk

在本地开发时，初始化腾讯云开发 sdk 需要的密钥保存在 .env 文件中

在构建和部署时，不应该存在 .env 文件，应该使用环境变量来提供

```bash
yarn dev # 本地开发
```
## 构建和部署

基于 github actions 自动化构建，构建完成后将 docker 镜像推送到 dockerhub

部署时，在腾讯云开发中拉去 docker 镜像部署，并提供环境变量

## 技术栈

- Next.js
- TailwindCSS
