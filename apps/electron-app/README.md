# faker (electron-app)

可扩展的开发助手桌面端（Electron + React），内置模块：

- **DeepSeek Harness** — 内嵌 dsh Web UI（AI 编码助手，懒启动）
- **Whistle 代理** — 内嵌 w2 Web UI（HTTP 调试代理，固定 127.0.0.1:8899；应用菜单可开关系统代理、安装 HTTPS 根证书）

## 开发

```bash
pnpm install
pnpm dev:electron-app   # monorepo 根目录执行
```

## 打包

```bash
pnpm --filter @one/electron-app build:mac
# 产物在 apps/electron-app/dist/
```

打包时 `scripts/install-services.sh` 会把 dsh / whistle 等服务依赖
以扁平 node_modules 装进 `resources/services/`，经 extraResources 嵌入
应用，服务通过 `ELECTRON_RUN_AS_NODE` 由 Electron 二进制运行，
用户机器**无需安装 Node.js**。

## 发布

```bash
git tag v0.1.0 && git push origin v0.1.0
# GitHub Actions (.github/workflows/release.yml) 自动构建 dmg/zip
# 并发布到 GitHub Releases
```

应用菜单「检查更新…」与启动时的静默检查会对比 GitHub Releases
最新 tag，发现新版本提示前往下载。

## 首次打开（ad-hoc 签名说明）

macOS 应用未做正式签名公证，首次打开会提示"无法验证开发者"：

1. 双击打开 → 弹窗点 **"好"**（或"取消"均可）
2. 打开 **系统设置 → 隐私与安全性**，底部出现
   **"已阻止使用 faker"** → 点 **"仍要打开"**
3. 输入开机密码 / Touch ID 确认 → 应用正常启动，之后不再提示

若提示"**已损坏**"（部分 macOS 版本对无签名应用）：终端执行

```bash
xattr -cr "/Applications/faker.app"
```
