---
title: "使用 Cloudflare Worker 部署 Fumadocs, 近乎免费的生产级文档站"
pubDate: 2026-02-25
updatedDate: 2026-02-25
author: "Dax"
tags: ["Next.js", "Fumadocs", "Cloudflare", "Worker", "OpenNext"]
description: "在 Cloudflare Workers 上部署 Fumadocs 文档框架，打造近乎免费的生产级文档站点，支持全球边缘节点分发。"
---

# 1. 为什么是 Fumadocs + Cloudflare Workers & R2

文档站的核心诉求是访问快、维护省心、成本低。Fumadocs 是目前最流行的 Next.js 文档框架之一，功能完善；Cloudflare Workers 则提供全球边缘网络，让用户就近访问，同时免费额度对个人项目基本够用。两者结合，是搭建生产级文档站的高性价比方案。

唯一的挑战是兼容性：Next.js 依赖 Node.js 运行时（文件系统、原生流等），而 Cloudflare Workers 运行在自研的 V8 隔离环境中，并不支持完整的 Node.js API。`@opennextjs/cloudflare` 解决了这个问题 —— 它将 Next.js 产物重新打包为 Worker 可执行的格式，并将静态资源（JS/CSS/图片等）上传到 R2 对象存储，由 Worker 按需读取，从而绕开 Worker bundle 的体积限制，同时保留 SSR/ISR 能力。

这是我搭建完成的 Demo：[https://web.daolanx.me/](https://web.daolanx.me/), 以下记录具体步骤：

# 2. 生成 Fumadocs 应用

参考 [fumadocs/quick start](https://www.fumadocs.dev/docs)，生成应用并按提示运行验证。需要注意搜索相关的选项。

```zsh
pnpm create fumadocs-app
```

![](/images/posts/14/1.webp)

![](/images/posts/14/2.webp)

# 3. 适配 Cloudflare Worker 运行环境

可以发现，Fumadocs 默认生成的是 Next.js 应用，要在 Cloudflare Worker 环境运行，可以通过 [@opennextjs/cloudflare](https://opennext.js.org/cloudflare/) 进行适配。

## 3.1 前置条件

你有一个 Cloudflare 账户，并且开通了 Cloudflare R2。R2 用于存储构建产物中的静态资源，Worker 在响应请求时会从 R2 中读取这些文件。

## 3.2 使用命令行自动适配

参考 [opennext/get-started](https://opennext.js.org/cloudflare/get-started)，在项目根目录下执行：

```zsh
pnpm dlx @opennextjs/cloudflare migrate
```

![](/images/posts/14/3.webp)
![](/images/posts/14/4.webp)

安装过程中，会提示进行 Cloudflare 的 OAuth 登录授权：

![](/images/posts/14/5.webp)

安装过程中，也会自动创建 R2 的 bucket：

![](/images/posts/14/6.webp)

# 4. 预览和本地发布

```zsh
pnpm run preview # 在本地构建并预览 Cloudflare 应用
pnpm run deploy  # 将应用部署到 Cloudflare Workers
```

执行 `pnpm run deploy` 以后，即可发布到 Cloudflare，实现线上访问：

![](/images/posts/14/7.webp)
![](/images/posts/14/8.webp)

在 **Workers & Pages** 页面也能看到这个文档应用：

![](/images/posts/14/9.webp)

# 5. 配置自定义域名

在 **Workers & Pages** 页面控制台配置自定义域名：

![](/images/posts/14/9-1.webp)

至此我们完成了 Fumadocs 通过 Cloudflare Worker 的部署，以及关联自定义域名访问！

# 6. 代码提交后自动构建 & 发布

本地直接发布不利于版本管理与变更追溯，改为 git 提交后自动触发构建和发布是更推荐的做法。

## 6.1 检查 .gitignore

添加 `.dev.vars` 和 `.wrangler/`，避免将本地凭证和构建缓存提交到仓库：

```shell
# OpenNext
.open-next
.dev.vars   # 本地环境变量，包含敏感凭证
.wrangler/  # Wrangler 构建缓存
```

## 6.2 修改 package.json 的 scripts

参考 [opennext/get-started](https://opennext.js.org/cloudflare/get-started#6-update-the-packagejson-file)，对构建和部署命令进行调整，确保 `build` 脚本仍然指向标准的 `next build`，由 Cloudflare CI 环境负责后续的打包与发布。

### Before

```json
"scripts": {
    "build": "next build",
    "dev": "next dev",
    "start": "next start",
    "types:check": "fumadocs-mdx && next typegen && tsc --noEmit",
    "postinstall": "fumadocs-mdx",
    "lint": "biome check",
    "format": "biome format --write",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "upload": "opennextjs-cloudflare build && opennextjs-cloudflare upload",
    "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
  },
```

### After

```json
"scripts": {
    "dev": "next dev",
    "start": "next start",
    "build": "next build",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "upload": "opennextjs-cloudflare build && opennextjs-cloudflare upload",
    "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts",
    "types:check": "fumadocs-mdx && next typegen && tsc --noEmit",
    "postinstall": "fumadocs-mdx",
    "lint": "biome check",
    "format": "biome format --write"
  },
```

修改完成后，提交到 git 仓库，触发 Cloudflare 自动构建流程。

## 6.3 在 Cloudflare 面板关联 GitHub 并配置构建命令

在 Cloudflare Workers & Pages 面板下找到对应 Worker 的 Settings → Build 区块，配置构建和部署命令：

```zsh
# Build
pnpm run build

# Deploy
pnpm run deploy
```

![](/images/posts/14/11.webp)

## 6.4 检查 GitHub 的 commit 是否关联了 Cloudflare 部署

![](/images/posts/14/12.webp)

可以点击查看具体的构建与部署日志。

![](/images/posts/14/13.webp)

至此，我们就完成了 git 提交自动部署到 cloudflare worker 的 Fumadocs 文档应用！

# 7. 费用说明

Workers 免费额度为每天 10 万次请求，R2 免费额度为每月 10 GB 存储，且流量出口（Egress）永久免费。对于个人文档站来说，基本不会触发收费。详见 [Cloudflare 官方定价](https://developers.cloudflare.com/r2/pricing/)。
