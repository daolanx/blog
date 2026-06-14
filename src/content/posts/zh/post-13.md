---
title: "Next.js + Cloudflare #2：使用 R2 + Worker 代理静态资产以实现最佳性能"
pubDate: 2026-02-18
updatedDate: 2026-02-18
author: "Dax"
tags: ["Next.js", "Cloudflare", "Vercel", "GitHub", "性能优化"]
description: "使用 Cloudflare R2 + Worker 代理实现静态资产同域服务，达成 Lighthouse 全项满分的极致性能优化。"
---

## 1. 效果概述

在 [Next.js + Cloudflare R2：更高性能，更低成本](/zh/posts/post-12/) 中， 我们实现了将 Next.js 静态资源从 Vercel 分离并迁移至 Cloudflare R2，利用边缘节点提升了加载速度。

经过进一步改造，目前**静态资源与网页实现了同域名返回**，且图片支持**响应式按需转换**。Lighthouse 跑分显示：PC 端各项指标均为 100，移动端性能得分 98，其余均为 100。性能表现非常优秀。

![Lighthouse PC 端跑分](/images/posts/13/2.webp)
![Lighthouse 移动端跑分](/images/posts/13/1.webp)

接下来，我们将探讨上次改造中暴露出的问题及其解决方案。

## 2. 基于 R2 分离 Nextjs 静态资源后的问题

虽然分离了资源，但也引入了两个影响性能和体验的新问题：

- **增加了网络请求开销**：此前页面与资源均在 Vercel，使用相对路径请求。分离后，资源使用了独立的 `assets` 前缀域名。虽然现代浏览器已不再受 HTTP/1.1 单域名并发连接数的限制，但跨域名请求仍需额外的 **DNS 解析**、**TCP 握手**及 **TLS 协商**时间。在移动端网络下，这种延迟尤为明显。
- **图片无法响应式加载**：理想情况下，图片应根据设备尺寸返回对应大小。使用自定义 Image Loader 后，Next.js 原生的图片优化功能失效，导致无论设备大小都返回原始尺寸图片，浪费了带宽并降低了 LCP 性能。

## 3. Cloudflare 核心能力的二次挖掘

若域名的 DNS 托管在 Cloudflare 且开启了代理（Proxying，即橙色小云朵），我们可以利用以下两项能力进行深度优化。

### 3.1 Images Transformations（图像转换）

参考 [Make responsive images](https://developers.cloudflare.com/images/transform-images/make-responsive-images/#webp-images), 在 Cloudflare 的 **Images > Transformations** 菜单下，对应域名开启 **Transformations**，可以实现图片的尺寸修改，例如：

- 原始路径 (Before)：https://my-r2-bucket-domain.com/avatar.webp

![](/images/posts/13/4.webp)

- 转换后路径 (After)：https://my-r2-bucket-domain.com **/cdn-cgi/image/fit=contain,width=100,blur=30/** avatar.webp

![](/images/posts/13/5.webp)

### 3.2 Workers Routes

参考 [Workers Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/?preferred-color-scheme=light), 当域名开启 DNS 代理（开启橙色小云朵） 时，Cloudflare Workers 可以实现对特定 URL 请求的拦截与逻辑干预。

例如编写如下 Worker 脚本，并将其挂载到 Workers Routes 的匹配路径上，那么所有命中该路径的访问请求都将直接返回 "Hello World!"，而不再指向原有的源站资源。

3.2.1 在 **Workers & Pages** 页面点击创建

![](/images/posts/13/6.webp)

3.2.2 选择 **Hellow World** Worker,命名为 **hello**，并部署

![](/images/posts/13/8.webp)

3.2.3 然后在 **Workers Routes** 页面, 设置好域名通配符，选择刚才部署的 **hello** worker

![](/images/posts/13/9.webp)

3.2.4 最后访问刚才配置的挂载 worker 的路由，可以发现路由返回了 worker 处理后的数据。

![](/images/posts/13/10.webp)

有了以上机制，接下来要实现的目标就清晰了：

- 使用 **Workers Routes** 拦截静态资源类请求
- Worker 内部从 R2 读取资源并输出
- 针对图片请求，在 Worker 中调用 Image Resizing 实现按需裁剪

## 4. 具体步骤

我们的目标是在 https://your-site-domain.com/remote-assets/ 下实现静态资源返回和图片按需处理。

### 4.1 新建静态资源代理 Worker， 挂载到 Workers Routes

```js
// workers/remote-assets/src/index.js
/**
 * Remote Assets Proxy Worker (Final Version)
 * Utilizes Cloudflare Built-in Image Resizing & R2 Storage
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const { pathname, searchParams } = url

    // 1. Match custom prefix for remote assets
    if (pathname.startsWith(env.REMOTE_PREFIX)) {
      // Clean up path to ensure no double slashes during concatenation
      let originPath = pathname.replace(env.REMOTE_PREFIX, "")
      if (originPath.startsWith("/")) originPath = originPath.slice(1)

      const staticResUrl = `${env.R2_DOMAIN}/${originPath}`

      const isImage = /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(originPath)
      const width = searchParams.get("w")
      const quality = searchParams.get("q") || "75"

      // 2. Trigger Image Resizing if 'w' parameter is present
      if (isImage && width) {
        return fetch(staticResUrl, {
          headers: request.headers,
          cf: {
            image: {
              width: parseInt(width),
              quality: parseInt(quality),
              format: "auto", // Auto-select best format (WebP/AVIF) based on browser support
              fit: "scale-down",
            },
          },
          cacheEverything: true,
          cacheTtl: 31536000,
        })
      }

      // 3. Standard asset request (JS, CSS, or non-resized images)
      const response = await fetch(staticResUrl, {
        headers: request.headers,
      })

      // Apply aggressive caching for hashed Next.js static assets
      if (pathname.includes("/_next/static/")) {
        const newHeaders = new Headers(response.headers)
        /**
         * 'immutable' prevents browsers from revalidating the file,
         * reducing server round-trips to zero for repeat visits.
         */
        newHeaders.set("Cache-Control", "public, max-age=31536000, immutable")
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        })
      }

      return response
    }

    // 4. Passthrough all other requests to the main origin (e.g., Vercel)
    return fetch(request)
  },
}
```

```yml
# workers/remote-assets/wrangler.toml
name = "remote-assets-proxy"
main = "src/index.js"
compatibility_date = "2024-12-01"

[vars]
R2_DOMAIN = "https://your-r2-assets-domain.com"
REMOTE_PREFIX = "/remote-assets/"

[[routes]]
pattern = "your-site-domain/remote-assets/*"
zone_name = "your-site-domain.com"
```

完成上述文件以后，参考[workers/wrangler](https://developers.cloudflare.com/workers/wrangler/commands/)文档，在 **remote-assets** 文件夹下，执行

```shell
pnpm dlx wrangler login
pnpm dlx wrangler deploy
```

即可部署本地 worker 到线上。

然后在 workers Route 页面挂载。

![](/images/posts/13/11.webp)

挂载完成后，访问当前路径，应该能返回正确的静态资源地址了，例如：

- https://your-r2-bucket-domain.com/profile/avatar.webp
- https://your-site-domain.com/remote-assets/profile/avatar.webp

### 4.2 修改 Nextjs 相关内容

#### 4.2.1 修改自定义 ImgLoader

```ts
// image-loader.ts
interface LoaderProps {
  src: string
  width: number
  quality?: number
}

const ALL_SIZES = [64, 256, 640, 828, 1120, 1920]

export default function myImageLoader({ src, width, quality }: LoaderProps) {
  const isProd = process.env.NODE_ENV === "production"
  const isExternal = src.startsWith("http")

  // Local development or External images: Use original URL
  if (!isProd || isExternal) {
    return src
  }

  // Find the closest larger bucket size
  const targetWidth =
    ALL_SIZES.find((s) => s >= width) || ALL_SIZES[ALL_SIZES.length - 1]

  // Clean path: remove leading slash for consistency
  const normalizedSrc = src.startsWith("/") ? src.slice(1) : src

  // Final Production URL: Relative path to trigger Cloudflare Worker
  return `/remote-assets/${normalizedSrc}?w=${targetWidth}&q=${quality || 75}`
}
```

### 4.3.2 最后修改 Nextjs 的 Config

```ts
// next.config.ts
import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"
const isProd = process.env.NODE_ENV === "production"

const nextConfig: NextConfig = {
  /**
   * IMPORTANT: Point this to your Worker path on the MAIN domain.
   * This ensures all JS/CSS are served from your-site-domain.com/remote-assets/
   */
  assetPrefix: isProd
    ? "https://your-site-domain.com/remote-assets"
    : undefined,

  images: {
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    deviceSizes: [640, 828, 1120, 1920],
    imageSizes: [64, 256],
  },
}

export default nextConfig
```

## 5.总结

通过上述改造，我们实现了以下机制，使得网站性能进一步提升：

- **域名收敛**：静态资源与页面共享同个域名连接，消除了额外的 DNS/TLS 握手时间。
- **图片按需加载**：利用 Cloudflare Image Resizing 补全了 Next.js 配置自定义图片加载以后丢失的响应式图片能力。
- **极致缓存**：通过 Worker 手动注入 immutable 响应头，大幅提升了静态资源的二次加载速度。
