---
title: "Next.js + PayloadCMS 做内容管理"
pubDate: 2026-05-27
updatedDate: 2026-05-27
author: "Dax"
tags: ["Next.js", "PayloadCMS"]
description: ""
---

[PayloadCMS](https://payloadcms.com/) 是目前 Next.js 社区非常推荐的无头（Headless）CMS 管理系统。目前我已经完成将其接入并用于 Demo Gallery 的站点管理，不仅实现了国际化（i18n）文案管理，还完美支持了图片资源的上传与处理。

![](/images/posts/20/1.webp)
![](/images/posts/20/2.webp)
![](/images/posts/20/3.webp)

以下总结一些接入过程中的重点和思考.

# 1. 为什么选择 PayloadCMS? 
PayloadCMS 深度原生集成于 Next.js，它更像是一个功能强大的核心插件，帮你完整处理了 CMS 的**录入**与**消费**全场景能力：

* **高效录入**：完全基于代码配置即可自动生成现代化管理后台，自带完善的数据管理、身份鉴权，甚至包含媒体上传与实时预览功能。
* **极致消费**：提供 Local API 能力，在服务器端（React Server Components）可以直接读取数据库，避开了网络 API 的开销，性能极佳且调用灵活。
* **自主可控**：完全开源免费，所有数据都安全存储在自己的数据库中，没有平台绑定的后顾之忧。


# 2. 安装与配置

参考 [PayloadCMS Installation 官方文档](https://payloadcms.com/docs/getting-started/installation) 进行初始化安装，随后配置路由与核心配置文件。在此期间有几个关键点需要注意：

## 2.1 路由隔离配置

因为 PayloadCMS 的 `RootLayout` 包含了通用的 `<html>` 标签，且其鉴权和后台交互逻辑与业务代码完全独立，所以**必须**将它的路由与业务路由进行物理分组隔离。目录结构建议如下：

```shell
app/
├─ (payload)/
├── # Payload 自动生成的管理后台路由与文件
├─ (my-app)/
├── # 你的核心业务应用路由与文件
```

## 2.2 payload.config.ts 核心配置

这是我目前的 Payload 核心配置文件。这份配置涵盖了**自定义多尺寸图片裁剪**、**Next.js 缓存按需刷新 (ISR)**、**多语言支持 (i18n)**，以及**直连云存储方案**，请重点关注注释部分的架构考量。

```ts
// @ts-nocheck -- needed because payload generate:types uses a tsx version that can't parse import type
import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { revalidatePath } from "next/cache";
import { buildConfig } from "payload";

// 环境变量前置拦截：防止 Serverless 无状态部署（如 Vercel）时因漏配导致静默失败
if (!process.env.PAYLOAD_SECRET) throw new Error("PAYLOAD_SECRET is missing");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing");

// ==========================================
// 1. Media 媒体资源
// ==========================================
const Media = {
  slug: "media",
  upload: {
    // 上传时自动生成不同尺寸的物理变体，便于前端实现 Responsive Images
    imageSizes: [
      { name: "thumbnail", width: 300, height: 200, position: "centre" },
      { name: "card", width: 1200, height: 514, position: "centre" },
    ],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true, // 强制填写，兼顾 SEO 与 a11y
    },
  ],
};

// ==========================================
// 2. Sites 站点项目
// ==========================================
const Sites = {
  slug: "sites",
  orderable: true, // 允许后台拖拽排序
  admin: {
    useAsTitle: "title",
  },
  hooks: {
    // ISR 按需刷新：数据变更时自动清除 Next.js 对应路由的缓存
    afterChange: [async () => revalidatePath("/")],
    afterDelete: [async () => revalidatePath("/")],
  },
  fields: [
    {
      name: "preview",
      type: "upload",
      relationTo: "media", // 强关联至 Media 集合
    },
    { name: "webUrl", type: "text", required: true },
    { name: "sourceUrl", type: "text", required: true },
    { name: "isDeveloping", type: "checkbox", defaultValue: false },
    { name: "keywords", type: "text" },
    {
      name: "title",
      type: "text",
      required: true,
      localized: true, // 开启字段级多语言 (i18n)
    },
    {
      name: "description",
      type: "textarea",
      required: true,
      localized: true,
    },
  ],
};

// ==========================================
// 3. Tiers 定价档位
// ==========================================
const Tiers = {
  slug: "tiers",
  orderable: true,
  admin: {
    useAsTitle: "type",
  },
  hooks: {
    afterChange: [async () => revalidatePath("/landing")],
    afterDelete: [async () => revalidatePath("/landing")],
  },
  fields: [
    { name: "variantId", type: "text", required: true },
    { name: "priceMonthly", type: "number", required: true, min: 0 },
    { name: "priceAnnually", type: "number", required: true, min: 0 },
    {
      name: "type",
      type: "select",
      required: true,
      unique: true, // 确保同一档位（如 free）全局唯一
      options: ["free", "pro", "max"],
    },
  ],
};

export default buildConfig({
  secret: String(process.env.PAYLOAD_SECRET),
  collections: [Media, Sites, Tiers],
  globals: [], // 单例数据（如整站配置、全局导航）可在此注册
  
  localization: {
    locales: ["en", "zh"],
    defaultLocale: "en",
    fallback: true, // 缺失对应语言内容时自动回退，防止前端报 undefined
  },

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    // 命名空间隔离：将 CMS 生成的表集中于 payload schema，避免污染核心业务逻辑表
    schemaName: "payload",
    
    // Schema 同步策略
    // 本地开发开启 (true)：修改 ts 自动对齐表结构，提升 DX
    // 线上生产关闭 (false)：强校验，必须通过 `payload migrate` 流程安全执行变更，防止 Drizzle drop 列导致数据丢失
    push: process.env.NODE_ENV === 'development',
  }),

  // ==========================================
  // 边缘节点与云存储 (Cloudflare R2 适配)
  // ==========================================
  plugins: [
    s3Storage({
      enabled: true,
      collections: {
        media: {
          prefix: "medias",
          // 资源直连策略：放弃 Proxy，直接暴露 R2 绑定的自定义域名
          // filename 已经由底层处理好原图或变体后缀 (如 xxx-thumbnail.jpg)，直接拼接即可
          generateFileURL: ({ filename, prefix }) => {
            const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://assets.daolanx.com";
            const dir = prefix ? `/${prefix}` : "";
            return `${baseUrl}${dir}/${filename}`;
          }
        },
      },
      bucket: process.env.UPLOAD_R2_BUCKET || "uploads",
      config: {
        region: "auto",
        endpoint: process.env.UPLOAD_R2_ENDPOINT,
        credentials: {
          accessKeyId: String(process.env.UPLOAD_R2_ACCESS_KEY_ID),
          secretAccessKey: String(process.env.UPLOAD_R2_SECRET_ACCESS_KEY),
        },
        requestChecksumCalculation: "WHEN_REQUIRED",
        responseChecksumValidation: "WHEN_REQUIRED",
      },
      acl: "public-read",
      // Serverless 部署必须开启：强制流式传输，禁止将文件暂存于本地短暂的 Server 磁盘
      disableLocalStorage: true, 
    }),
  ],
});
```

# 3. 其他注意事项

## 3.1 importMap.js 维护
importMap.js 是 Payload 生成的组件映射表，核心作用是让 Next.js 能够正确编译和打包后台的自定义 UI 组件。
⚠️ 千万不要手动编辑该文件。如果遇到后台 UI 提示找不到某些模块的报错，直接在终端运行以下命令重新生成即可：
```sh
pnpm payload generate:importmap
```

## 3.2 页面级 revalidate 兜底
在消费 CMS 数据的页面（Page）中，可以按需增加时间驱动的缓存配置来实现 ISR。例如缓存一小时：

```ts
 export const revalidate = 3600;
```
这看似与后台 Hook 里的 revalidatePath 重复了，但它在生产环境中其实非常重要。它主要用于稳健性兜底，能够有效避免因 Webhook 触发失败、或者直接在数据库中修改了数据而导致前端页面缓存永远无法刷新的尴尬情况。

# 4. 相关改动 PR
完整的接入与文件重构流程，可以参考我的这个 PR 记录：
- [https://github.com/daolanx/work/pull/4](https://github.com/daolanx/work/pull/4)