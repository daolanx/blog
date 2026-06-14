---
title: "Next.js + Cloudflare #1: 使用 R2 提升性能并降低成本"
pubDate: 2026-02-03
updatedDate: 2026-02-03
author: "Dax"
tags: ["Next.js", "Cloudflare", "Vercel", "GitHub", "性能优化"]
description: "将 Next.js 静态资源迁移到 Cloudflare R2 的实战教程，提升性能并显著降低 Vercel 带宽成本。"
---

先看效果，站点部署在 Vercel 上面，静态资源和图片都是存储在 R2 上，通过 R2 配置的 **assets** 子域名访问。

![](/images/posts/12/1.webp)

这样处理有几个显著好处:

1. **性能更好**: 虽然 Vercel 官方节点已足够快，但 Cloudflare 拥有全球最庞大的网络之一，CDN 节点密度更高，且提供了更细颗粒度的边缘配置能力。
2. **潜在费用极大节省**: 通过 Cloudflare R2 分发资源 **没有出站流量费 (Egress Fee)**。而 Vercel 流量超出免费额度后费用昂贵，将静态资源剥离能大幅减少 Vercel 的带宽压力。

# 实现思路

## 之前流程

所有的构建（Build）和部署（Deploy）过程均在 Vercel 内部自动完成。

## 改造后流程

- GitHub Workflow 进行构建：在 GitHub 环境下完成 Next.js 的生产打包。
- 静态资源同步：将构建产物中的静态资源部分上传至 Cloudflare R2。
- 部署产物外发：将构建产物发送给 Vercel。
- Vercel 预构建部署：Vercel 接收产物并直接上线，不再重复执行构建过程。

# 具体操作

## 1. 在 Cloudflare R2 上创建 Bucket

在 [Cloudflare R2](https://developers.cloudflare.com/r2) 上创建 Bucket，这里以名字 **assets** 为例。

![](/images/posts/12/2.webp)

在 **assets** Bucket 的 **Settings** 配置 **Custom Domains**.
![](/images/posts/12/3.webp)

配置完成后，建议通过控制台手动上传一个文件并尝试用自定义域名访问，确保 CDN 已打通。

![](/images/posts/12/4.webp)

![](/images/posts/12/5.webp)

在 R2 bucket 的 **Settings -> CORS Policy** 增加跨域配置

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

## 2. 修改 Next.js App 配置

修改 **next.config.ts** 文件，配置 **assetPrefix** 修改静态资源的前缀，并开启自定义图片加载器。

```ts
// next.config.ts
import type { NextConfig } from "next"

const isProd = process.env.NODE_ENV === "production"
const nextConfig: NextConfig = {
  // assetPrefix 修改静态资源前缀
  assetPrefix: isProd ? "https://assets.your-domain.com" : undefined,
  // 图片采用自定义加载方案
  images: {
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
  },
}

export default nextConfig
```

新增 **lib/image-loader.ts** 生产环境图片资源加上 CDN 前缀

```ts
// lib/image-loader.ts
export default function myImageLoader({ src }: { src: string }) {
  // // 如果是绝对路径或非生产环境，保持原样
  if (src.startsWith("http") || process.env.NODE_ENV !== "production") {
    return src
  }
  // 拼接 Cloudflare R2 的加速域名
  return `https://assets.your-domain.com${src}`
}
```

## 3. 关闭 Vercel 的 代码提交自动化部署

为了避免 Vercel 监听 Git 提交后重复构建，我们需要关闭其自动流水线。

在 Vercel 项目的 **Settings > Build and Deployment** 下找到 **Ignored Build Step**，选择 **Don‘t build anthing**, 确保代码提交不再触发 Vercel 自带的构建。

![](/images/posts/12/6.webp)

## 4. 配置 GitHub Workflow 环境变量

在 GitHub 仓库的 **Settings > Secrets and variables > Actions** 中配置必要的密钥。

### 4.1 配置 R2 变量

在 Cloudflare R2 控制台新建 **Account API Token**，权限务必选择 **Admin Read & Write.**

![](/images/posts/12/8.webp)
![](/images/posts/12/9.webp)

将生成的 **Access Key ID**, **Secret Access Key** 以及 **Endpoint** 分别配置到 GitHub 的 Secrets 中：**R2_ACCESS_KEY_ID**, **R2_SECRET_ACCESS_KEY**, **R2_ENDPOINT**。

![](/images/posts/12/10.webp)
![](/images/posts/12/11.webp)

### 4.2 配置 Vercel 变量

#### 获取 VERCEL_TOKEN

在 Vercel 的 **Account Settings > Tokens** 下新建一个 Token

![](/images/posts/12/12.webp)
![](/images/posts/12/13.webp)

#### 获取 VERCEL_PROJECT_ID 和 VERCEL_ORG_ID

VERCEL_PROJECT_ID: **Settings > General** 中直接查看。
![](/images/posts/12/14.webp)

VERCEL_ORG_ID: 在项目面板中通过网络请求查看，或在本地运行 vercel link 后查看生成的 .vercel/project.json

![](/images/posts/12/15.webp)

至此，GitHub Actions 所有的变量已准备就绪。

### 4.3 检查配置变量

![](/images/posts/12/16.webp)

## 5. 编写 GitHub Workflow

在仓库根目录新增 **.github/workflows/deploy-prod.yml**（注意路径必须包含 workflows 目录）。

```yml
// .github/deploy-prod.yml
name: Deploy Production

on:
  push:
    branches:
      - main

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  deploy:
    name: Build, Sync and Deploy
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      # 1. 环境准备
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      # 2. Vercel 构建阶段 (预编译产物)
      - name: Pull and Build Vercel Artifacts
        run: |
          pnpx vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
          pnpx vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      # 3. 静态资源同步到 Cloudflare R2
      - name: Upload Static Assets to R2
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --follow-symlinks --delete
        env:
          SOURCE_DIR: '.vercel/output/static/'
          AWS_S3_BUCKET: 'assets'
          AWS_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          AWS_REGION: 'auto'
          AWS_S3_ENDPOINT: ${{ secrets.R2_ENDPOINT }}

      # 4. 最终部署 (使用预构建产物部署至 Vercel)
      - name: Deploy to Vercel
        run: pnpx vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Post-deployment Notification
        if: success()
        run: echo "Successfully deployed to production and synced to R2."
```

推送代码到 GitHub 后，Workflow 会自动运行。你可以点击仓库顶部的 **Actions** 实时查看进度。

![](/images/posts/12/17.webp)

执行到 **Deploy to Vercel** 步骤时，你会发现 Vercel 控制台使用了 **prebuilt** 模式进行部署。这意味着 Vercel 仅负责最后的节点部署。

![](/images/posts/12/18.webp)

![](/images/posts/12/19.webp)

## 6. 在 Cloudflare 后台配置 Cache Rules

针对 R2 绑定的自定义域名配置 Cache Rules。还可以根据业务需求手动设置 **Edge TTL**（边缘缓存时间）和 **Browser TTL**（浏览器缓存时间）。

因为 Next.js 静态资源构建后是 hash 的，其他图片也不经常变更，通过显著延长 TTL，可以最大化 Cloudflare 的缓存命中率，让资源尽可能驻留在边缘节点，从而极大地减少回源 R2 的请求，进一步降低延迟并节省 API 调用成本，也提高访问速度。

![](/images/posts/12/20.webp)
![](/images/posts/12/21.webp)
