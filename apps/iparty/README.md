# iparty

面向 SPA、美容、家政等服务行业的店铺与服务人员展示小程序，使用 **TypeScript + WXML + WXSS**。当前完成第一阶段：页面骨架、本地入驻草稿、管理与详情预览。后端仍仅提供 Ping，不包含测试。

## 当前功能范围

- 介绍首页 → 填写店铺 → 添加第一位人员 → 登录引导弹窗 → 管理预览。
- 店铺资料编辑、人员新增 / 编辑 / 删除、独立的人员详情预览。
- 表单输入保存在当前设备的本地 Storage，返回或重新打开可继续。清除缓存或更换设备后不会保留，不作为正式商家资料。
- 首页提供带明确标识的虚构名片示例；管理页保留后端连接检查。
- **尚未实现**：手机号登录、云端保存、照片上传、发布 / 上下架、真实分享 / 短链、预约登记、管理员功能。登录按钮明确禁用，不伪造登录状态。预约入口只解释功能，未收集客户手机号。
- 本地预览不会生成分享链接，也不会把本地 ID 当作公开 ID。后续普通客户的详情页面必须按公开 ID 从后端加载，且不依赖登录或本地草稿。

## 开发

1. 在仓库根目录运行 `pnpm install`。
2. 安装并打开微信开发者工具，导入 **`apps/iparty`** 目录，而不是仓库根目录或 `miniprogram` 目录。
3. `project.config.json` 保留已配置的小程序 AppID。请使用有项目权限的微信账号登录；不要将 AppSecret 放入客户端配置。
4. 在根目录运行 `pnpm dev:worker-api`，启动本地后端。
5. 仅在本地开发时，在开发者工具的「详情 → 本地设置」勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」。公共配置默认保持域名校验开启，本地设置不会提交到 Git。
6. 编译后从首页点击「开始推广」，填写店铺和人员资料。登录引导弹窗中可选择「先预览管理页面」；检查后端连接按钮位于管理页底部，正常时返回 `pong`。

微信开发者工具通过内置 TypeScript 插件编译项目，无需额外的开发服务器或 `pnpm build`，也无需为当前模板执行「构建 npm」。依赖仅用于本地类型检查，不会作为小程序运行时依赖打包。

## 目录

```text
iparty/
├── project.config.json       # 开发者工具配置
├── tsconfig.json
└── miniprogram/
    ├── app.ts                # 应用入口
    ├── app.json              # 页面注册、窗口配置
    ├── app.wxss              # 全局样式
    ├── sitemap.json          # 暂不开放页面索引
    ├── config/api.ts         # 开发版、体验版、正式版 API 地址
    ├── utils/request.ts      # 请求封装、超时、HTTP/网络错误处理
    ├── api/system.ts         # Ping 接口和响应类型
    ├── models/draft.ts       # 店铺、人员和本地草稿类型
    ├── utils/draft.ts        # 草稿读写及必填校验
    ├── data/demo.ts          # 明确标识的虚构展示资料
    ├── components/login-sheet/ # 登录引导（未接入真实登录）
    └── pages/
        ├── index/           # 产品介绍首页
        ├── onboarding/      # 店铺和人员表单，同时用于本地编辑
        ├── manage/          # 管理预览、人员列表、预约占位页
        └── staff/detail/    # 独立详情页：示例 / 本地预览
```

## API 环境

在 `miniprogram/config/api.ts` 中配置 API 根地址，客户端根据 `wx.getAccountInfoSync().miniProgram.envVersion` 选择环境：

| 环境      | API 地址                 | 用途             |
| --------- | ------------------------ | ---------------- |
| `develop` | `http://localhost:8787`  | 本地开发         |
| `trial`   | `https://api.ryandev.cn` | 体验版，线上后端 |
| `release` | `https://api.ryandev.cn` | 正式版，线上后端 |

客户端自动根据微信版本环境选择地址，无需在发布前手动切换。体验版和正式版目前共用线上后端及其数据，并非独立的预发布环境。

- 开发版真机预览同样属于 `develop`，不会自动切到线上。手机上的 localhost 指手机本身，不能访问电脑的后端。局域网联调需将开发地址改为电脑的局域网 IP，并显式让 Wrangler 监听局域网：`pnpm --filter @one/worker-api dev --ip 0.0.0.0`。仅在可信网络使用，并检查防火墙和开发工具的调试限制。如需开发版访问线上，可临时将 `develop` 地址改为 `https://api.ryandev.cn`，注意避免误操作线上数据。
- 在微信公众平台的服务器域名配置中，将 `https://api.ryandev.cn` 添加为 **request 合法域名**；域名须满足微信平台的备案、证书等要求。本地关闭域名校验不代表线上已配置完成。
- AppID 不是密钥，可以填写在项目配置中；AppSecret、数据库凭据和其他服务端密钥绝不能放进小程序代码。
- 当前只调用公开的 `GET /ping`，没有预设登录、Token 存储或统一业务响应格式。

## 代码检查

在仓库根目录运行：

```bash
pnpm --filter @one/iparty typecheck
pnpm --filter @one/iparty lint
```

根目录的 `pnpm typecheck` 和 `pnpm lint` 也会包含这个项目。
