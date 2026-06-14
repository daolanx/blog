---
title: "使用 Stitch + Next.js + OpenNext 制作个人主页"
pubDate: 2026-06-02
updatedDate: 2026-06-02
author: "Dax"
tags: ["Next.js", "Stitch", "Cloudflare", "OpenNext"]
description: "使用 Stitch + Next.js + OpenNext 制作个人主页，结合 AI 设计和开发工作流的完整实践。"
---

其实之前更早一版本个人主页效果如下，当时主要是刚接触 AI 编程尝试的玩具，基本不具备功能性。
<img class="w-1/2" src="/images/posts/21/0.webp" />

而目前新版的个人主页已经部署在线，可以直接访问 [daolanx.com](https://daolanx.com/)，

<div class="grid grid-cols-2 gap-1">
   <img class="!m-0"  src="/images/posts/21/1.webp" />
  <img class="!m-0"  src="/images/posts/21/2.webp" />
 
</div>

比起之前，现在想法更成熟了一些，个人主页无论什么形态，需要抓住一些重点：1. 服务性质：这不是玩具，也不是艺术品，而是具备个人宣传的媒介；2. 高性能；3. SEO 友好。新版在各方面都进行了增强。

# 1. UI 设计，使用 Stitch 设计和导出代码

还是使用 [Stitch](https://stitch.withgoogle.com/) 完成产品设计, 如果不需要设计师参与，推荐直接导出 zip，会生成基于设计的 html. 比起生成设计软件格式再导出，直接根据 html 转成目标技术栈网页其实更准确简单。

![](/images/posts/21/0-1.webp)
![](/images/posts/21/0-2.webp)

# 2. 信息聚合：Server Components 调用 API，聚合个人作品和博客

新版的作品来自于 demo.daolanx.com API , 博客来自于 daolanx.me 的 API。通过 Server Components 调用接口和外层包裹 Suspense，达到了更好的访问速度和 SEO 效果。

```tsx
<main className="pt-20">
  ...
  <Suspense fallback={<PortfoliosSkeleton />}>
    <Portfolios />
  </Suspense>
  <Suspense fallback={<ArticlesSkeleton />}>
    <Articles />
  </Suspense>
  ...
</main>
```

<div class="grid grid-cols-2 gap-1">
  <img class="!m-0" src="/images/posts/21/3.webp" />
  <img class="!m-0" src="/images/posts/21/4.webp" />
</div>

# 3. 优化性能：Lighthouse 从 70+ 到 90+

## 3.1 优化前后对比

#### 优化前性能一般

通过 AI 转出的代码，基本能到可运行程度，但是性能 70+。

<div class="grid grid-cols-2 gap-1">
  <img class="!m-0 " src="/images/posts/21/5.webp" />

</div>

#### 优化后 90+

要达到更高的性能，需要进行一系列调整。 可以参考 [Lighthouse](https://developer.chrome.com/docs/lighthouse) 给予很多有用建议。

<div class="grid grid-cols-2 gap-1">
  <img class="!m-0" src="/images/posts/21/6.webp" />
  <img class="!m-0" src="/images/posts/21/7.webp" />
</div>

## 3.2 加载性能优化（Loading）

> 目标：缩短关键资源的获取与渲染时间，优先保障首屏可见内容的加载速度。

- **消除动画导致的 LCP 检测延迟：** 移除了 Hero 区域元素的 `opacity: 0`（FadeIn）渐显动画。此前该隐藏效果会导致 Lighthouse 的 LCP 计时器被动推迟。
- **核心图片预加载：** 为首屏（Above-the-fold）的 Portfolio 作品集图片添加了 `priority` 属性，强制浏览器优先建立数据通道并预加载。
- **图片分发精准化：** 重新优化了 `deviceSizes` 和 `imageSizes` 配置，确保不同设备都能获取到完美适配其分辨率的图片，避免带宽浪费。
- **原生图片组件升级：** 将所有原生 `<img>` 标签替换为 `next/image`，并配合 `fill` + `sizes` 属性，在实现响应式加载的同时锁定图片占位，防止页面塌陷或抖动。

---

## 3.3 渲染性能优化（Rendering）

> 目标：消除渲染阻塞资源，降低主线程负担，保障首次绘制（FP）的及时性。

- **非关键组件延迟加载：** 采用 `next/dynamic`（`ssr: false`）结合 `requestIdleCallback`，将 `ParticleCanvas`（粒子画布）的加载推迟到浏览器完全空闲时进行。
- **DOM 结构位置调整：** 将 `ParticleCanvas` 移至页面的 HTML 结构最底部，彻底解除其对首次绘制（First Paint）的阻塞。
- **移动端跳过粒子画布：** 通过 `isDesktop()` 检测直接跳过 `ParticleCanvas` 的加载与渲染，避免在低性能移动设备上执行不必要的计算与绘制。
- **避免强制同步布局（Reflow）：** 将 `breakpoint.ts` 中的 `window.innerWidth` 读取替换为 `matchMedia` API，避免触发强制同步布局；同时在画布的动画循环中对尺寸变量进行缓存，防止频繁读取 DOM 导致浏览器重排。

---

## 3.4 视觉稳定性优化（Visual Stability）

> 目标：消除布局偏移（CLS），解决字体加载引发的闪烁与跳动问题。

- **消除字体闪烁与偏移：** 将字体的显示策略（`font-display`）从 `swap` 切换为 `optional`，彻底消除了字体加载前后的闪烁（FOIT/FOUT）及由此引发的布局偏移。
- **Tailwind 主题规范化：** 统一在 Tailwind 配置中调用来自 `next/font` 的 CSS 变量来控制字体族，确保渲染的高效与一致。

## 3.5 SEO 优化（Search Engine Optimization）

> 目标：确保搜索引擎正确索引多语言页面，提升国际市场的可发现性与排名表现。

- **动态 Canonical URL：** 将硬编码的 `/` 替换为基于当前语言的动态路径（如 `/en`、`/zh`），确保每个语言版本拥有独立的规范地址，避免搜索引擎将多语言页面视为重复内容。
- **hreflang 多语言标签：** 通过 `alternates.languages` 配置为每种语言版本生成 `<link rel="alternate" hreflang="...">` 标签，告知搜索引擎各语言版本的对应关系，确保用户在搜索结果中看到其所在区域的正确语言版本。

## 3.6 无障碍优化（Accessibility）

> 目标：保障低视力用户与辅助技术使用者的完整访问体验。

- **允许用户缩放：** 移除视口配置中的 `maximumScale: 1`，恢复浏览器原生缩放能力，为低视力用户提供必要的放大支持。
- **Logo 链接语义化：** 为站点 Logo 链接添加 `aria-label="Dax - Home"`，使屏幕阅读器用户在导航时能清晰识别该链接的用途。
- **项目链接无障碍标注：** 为每个项目的 "Live Demo" 与 "View Source" 链接添加独立的 `aria-label`，在脱离上下文朗读时仍能准确传达链接指向的具体项目。

# 4. 部署

## 4.1 为什么选择 OpenNext

Next.js 官方推荐的部署平台是 Vercel，但对于个人项目来说，Vercel 的免费额度和定价并不总是最优解。Cloudflare Workers 提供了全球边缘网络、慷慨的免费额度、以及极低的冷启动时间，是一个很好的替代方案。

但问题在于：Next.js 依赖 Node.js 运行时，而 Cloudflare Workers 运行在 V8 引擎上。这两者之间存在根本性的兼容性差异。

OpenNext 就是为了解决这个问题而生的。它是一个开源适配器，能够将 Next.js 的构建产物转换为 Cloudflare Workers 兼容的格式，让你的 Next.js 应用可以直接部署到 Cloudflare 的边缘网络上。

OpenNext 提供了官方的 [Getting Started 指南](https://opennext.js.org/cloudflare/get-started)，涵盖了安装、配置、部署的基本流程。本文不再重复这些内容，而是分享在实际项目中使用 OpenNext 时需要注意的细节和踩过的坑。

## 4.2 package.json 配置

### 依赖项

安装两个核心依赖：

```json
{
  "dependencies": {
    "@opennextjs/cloudflare": "1.14.0",
    "next": "16.0.7"
  },
  "devDependencies": {
    "wrangler": "4.56.0"
  }
}
```

- **`@opennextjs/cloudflare`**：核心适配器，负责将 Next.js 构建产物转换为 Cloudflare Worker 格式
- **`next`**：Next.js 框架本身
- **`wrangler`**：Cloudflare Workers CLI，用于部署（版本必须 ≥ 3.99.0）

### 脚本配置

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "cf-typegen": "wrangler types --env-interface CloudflareEnv env.d.ts"
  }
}
```

几个关键脚本的含义：

- **`pnpm dev`**：本地开发服务器，使用 Next.js 的开发模式，热更新快。`next.config.ts` 中的 `initOpenNextCloudflareForDev()` 会桥接 Cloudflare bindings。
- **`pnpm build`**：标准 Next.js 构建，生成 `.next/` 目录。这是 `preview` 和 `deploy` 的前置步骤。
- **`pnpm preview`**：先执行 `opennextjs-cloudflare build` 生成 Worker 格式产物，然后本地模拟 Cloudflare Worker 环境运行。用于发布前验证兼容性。
- **`pnpm deploy`**：先构建，然后部署到 Cloudflare Workers。生产环境使用。
- **`pnpm cf-typegen`**：从 `wrangler.jsonc` 生成 TypeScript 类型定义到 `env.d.ts`，确保 Cloudflare bindings 有类型提示。

## 4.3. 本地开发 vs 预览：两种模式

OpenNext 提供了两种本地运行方式：

| 模式     | 命令           | 用途                             |
| -------- | -------------- | -------------------------------- |
| 开发模式 | `pnpm dev`     | 日常开发，热更新快               |
| 预览模式 | `pnpm preview` | 发布前验证，模拟真实 Worker 环境 |

**建议**：日常开发用 `pnpm dev`，发布前用 `pnpm preview` 验证一下。预览模式会真正模拟 Cloudflare 的运行时环境，能发现一些开发模式下不会出现的问题。

## 4.4 对应的 Cloudflare 平台面板上的构建部署配置

- **Build:** `npx opennextjs-cloudflare build`<br/> Cloudflare Dashboard 的 CI 管线专用。OpenNext 内部会自动先执行 next build 生成 .next/ 产物，再将其转换为 Cloudflare Workers 兼容的格式。Build 完成后由平台自动接管部署流程，无需手动触发上传。
- **Deploy:** `npm run deploy` <br/>本地手动部署用。等同于执行 opennextjs-cloudflare build && opennextjs-cloudflare deploy，一条命令依次完成构建转换与 wrangler 推送至 Cloudflare Workers，适合开发者在本机发布验证。

## 4.5. 图片优化：必须自定义 Loader

Cloudflare Workers 无法运行 Sharp（Next.js 默认的图片优化库），所以你需要提供自定义的图片加载器：

```ts
// src/lib/image-loader.ts
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  const params = new URLSearchParams()
  params.set("w", String(width))
  if (quality) params.set("q", String(quality))
  return `${src}?${params.toString()}`
}
```

然后在 `next.config.ts` 中配置：

```ts
images: {
  loader: "custom",
  loaderFile: "./src/lib/image-loader.ts",
}
```

### 生产环境的最佳实践：

将静态资源托管至 Cloudflare R2 存储桶并绑定自定义域名（如 assets.yourdomain.com），图片 URL 直接指向 R2 的公开访问端点。R2 与 Cloudflare CDN 同属一个网络，图片请求从边缘节点直接响应，无需回源，天然具备全球低延迟分发能力。同时 R2 免除出口流量费用，适合高频图片加载场景。

最终 src 路径形如：

```shell
https://assets.yourdomain.com/portfolio/project-01.webp?w=1200&q=80
```

R2 负责存储与分发，自定义 Loader 负责拼接尺寸与质量参数，Next.js Image 组件负责响应式 sizes 与占位布局.三者各司其职，完整替代 Sharp 的运行时图片处理能力。

# 5. 参考资料

- [OpenNext / Get-Started](https://opennext.js.org/cloudflare/get-started)
- [PR: perf/mobile performance optimization #2](https://github.com/daolanx/home/pull/2)
- [PR: fix: SEO, accessibility & UI improvements #3](https://github.com/daolanx/home/pull/3)
-
