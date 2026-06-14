---
title: "Next.js + Cloudflare #3: R2 + Proxy 静态资源管理方案总结"
pubDate: 2026-05-06
updatedDate: 2026-05-06
author: "Dax"
tags: ["Next.js", "Cloudflare", "Vercel", "GitHub",  "性能优化"]
description: "Next.js + Cloudflare R2 + Proxy 静态资源管理方案完整总结，独立开发者的性能与成本最优解。"
---

# 1. 为什么研究这个方案？

简单来说，这是一个**开发体验友好、成本极低且性能出色的生产级方案**，非常适合独立开发者或小团队产品。

在 Vercel 部署 Next.js 是公认的最佳实践，但其带宽流量（Data Transfer）超出免费额度后价格较高。Cloudflare 作为领先的 CDN 厂商，节点覆盖广且资费更具优势。因此，将 Next.js 应用部署在 Vercel 以获得最佳的框架兼容性，同时将静态资源（JS/CSS/Assets）流量迁移至 Cloudflare R2 + CDN，可以在保证稳定性的前提下，显著提升加载性能并降低成本。

虽然将整个应用部署在 Cloudflare Pages/Workers 理论上能获得更一致的体验，但考虑到 Worker 环境对运行时 API 的诸多限制，将应用本体保留在 Vercel 依然是目前兼容性最强的通用选择。

# 2. 核心改动说明

## 2.1 Next.js 

- 配置 [next.config.ts](https://github.com/daolanx/work/blob/1.0/next.config.ts) 配置 `assetPrefix` 属性，将静态资源请求拦截并重定向至目标 CDN URL。同时配置 `images.loader` 为 custom，以便配合自定义 Image Loader 对图片进行尺寸优化。
- 配置 [image-loader.ts](https://github.com/daolanx/work/blob/1.0/lib/image-loader.ts), 编写自定义加载器逻辑，对接 Cloudflare 的图片处理能力或特定的代理路径。

## 2.2 Github 

新增 [.github/workflows/deploy-prod.yml](https://github.com/daolanx/work/blob/1.0/.github/workflows/deploy-prod.yml)，实现当代码推送到分支后，GitHub Actions 会执行生产环境构建，随后将生成的静态产物（.next/static）同步至 Cloudflare R2，最后触发 Vercel 的 API 完成应用部署。

## 2.3 Cloudflare 
- 新增[worker.js](https://github.com/daolanx/work/blob/1.0/workers/remote-assets/src/index.js)，比起直接暴露 R2 自定义域名，使用 Worker 代理能进一步优化 TTFB 性能，并提高连接复用率。(注：期间尝试过 Cache API + R2 Binding 方案，实测提速不明显，因此最终选择了最简洁的 fetch 方案)
- 开启 Tiered Cache，这能显著提高缓存命中率，减少回源开销，性能提升明显。

## 效果演示

可以访问 [demo.daolanx.com](https://demo.daolanx.com/) 查看项目运行效果。

以 [Landing Page](https://demo.daolanx.com/landing) 为例，它采用 [React Compiler](https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler) 进行默认性能优化和配合 [next/dynamic](https://nextjs.org/docs/pages/guides/lazy-loading) 和默认导入实现模块延迟，没有额外的性能调优，目前Lighthouse 测试在移动端和 PC 端基本都能保持在 90 分以上。

也就是说，该方案在研发效率与用户体验之间达到了一个非常理想的平衡：**开发轻松，性能不错，价格便宜**。


<div class="flex divide-x divide-zinc-200">
  <img class="flex-1 w-1/2  " src="/images/posts/19/1.webp" />
  <img class="flex-1 w-1/2" src="/images/posts/19/2.webp" />
</div>


## 补充说明
本文侧重于方案思路的总结。实际操作中还涉及域名解析（DNS）、R2 存储桶权限及 Worker 路由等具体配置。如果你在实践中遇到瓶颈，可以将本系列的前两篇文章（[#1](/posts/post-12/), [#2](/posts/post-13/)）提供给 AI，它们能协助你完成大部分琐碎的配置引导。
