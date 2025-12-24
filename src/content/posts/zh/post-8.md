---
title: "博客搭建：Astro 框架 + Vercel 部署 + Cloudflare DNS 代理"
pubDate: 2025-11-30
updatedDate: 2025-11-30
author: "Dax"
tags: ["Astro", "Vercel", "Cloudflare"]
description: ""
---

### 一、为什么用 Astro 框架？

最初是想用 Next.js 搭建博客。因为 Next.js 比较适合前端转全栈，学习曲线相对平滑，应用场景也广泛，使用 Next.js 搭建博客，既能完成项目，又能深入学习框架，可谓一举两得。

但对于博客这类内容驱动型网站，Astro 更为合适。首先性能不错，得益于静态页面渲染为主，尽量降低 js 的开销和依赖，从而大幅提升页面性能，官方号称 "使用 Astro 构建缓慢的网站几乎是不可能的"。其次开发体验友好功能够用，岛屿架构允许在静态页面基础上灵活集成 React、Vue 等流行框架。也支持多语言和 Markdown 内容管理。

因此从对外产品体验更好，对内更简单可靠的开发维护的角度，选择用 Astro 搭建个人博客。

### 二、为什么用 Vercel 部署？

最早接触 Vercel 是因为 Next.js 由 Vercel 团队开发。Next.js 应用在 Vercel 上部署能得到 "原生支持"，因此 Vercel 非常适合作为初期全栈学习 Next.js 应用的部署平台，需要多了解。

而使用 Vercel 部署 Astro 项目体验也非常不错，GitHub 仓库几乎一键部署。同类功能平台还有 Netlify 和 Cloudflare Pages，Netlify 部署也挺流畅相对 Vercel 没有明显优势，Cloudflare Pages 推荐的人也不少，但它对 Javascript 是用 bun 构建，pnpm 这类脚本项目直接构建会报错，需要额外配置。在没有明显优势前提下，不想增加额外的配置和步骤，还是简单更好，简单意味着省心省力，也意味着更可靠。

此外，Vercel 的发展势头良好，团队实力强，支持开源生态，坚持免费增值模式，且在 AI 时代也在不断完善平台能力。

从免费，产品体验好，符合学习路径，前景良好的角度，我还是选择 Vercel 作为部署平台。

### 三、为什么用 Cloudflare DNS 代理？

Vercel 默认为应用提供 CDN 加速、HTTPS、速率限制、防火墙和自定义安全标头等能力。但从实际测试来看，国内访问速度仍不理想，原因包括 DNS 污染、全球节点主要位于国外，导致中国地区访问延迟较大。

Cloudflare 是全球最大的 CDN 服务商之一。使用 Cloudflare 的 DNS 代理，可以充分利用其全球 CDN 加速网站访问。虽然 Vercel 不推荐第三方 DNS（认为会增加链路复杂性），但从实际测试看，Cloudflare DNS 代理确实能明显改善国内访问速度。

### 四、部署步骤

得益于 Vercel 的良好的开发部署体验，整个配置过程比较简单。

#### 1. 在 Astro 选择模板，在 Github 生成项目仓库

在 [Astro/theme](https://astro.build/themes/) 选择模板，添加到个人 GitHub 仓库。我选的是 [astro-air](https://github.com/sun0225SUN/astro-air)。它风格简约，支持基于 MDX 的 Markdown 内容管理，并支持双语内容切换。

![使用 Astro 模板](/images/posts/8/4-1.webp)
![使用 Astro 模板 — astro-air](/images/posts/8/4-2.webp)

基于模板，在 GitHub 上生成自己的博客项目仓库。
![在 Github 使用 Astro 模板](/images/posts/8/4-3.webp)
![创建新的 Github 仓库](/images/posts/8/4-4.webp)

#### 2. 在 Vercel 部署项目

如果 Vercel 关联过 GitHub，在 [vercel.com/new](https://vercel.com/new) 可以看到新建的项目仓库。直接点击导入和部署。

![Vercel 项目关联 Github 仓库](/images/posts/8/4-5.webp)
![Vercel 项目部署](/images/posts/8/4-6.webp)

部署好了可通过 vercel 生成域名访问

![Vercel 项目面板](/images/posts/8/4-8.webp)
![使用 Vercel 域名访问网站](/images/posts/8/4-9.webp)

#### 3. 把域名的 DNS 服务商设置为 Cloudflare

假设 xyz.com 是自定义域名为例。参考类似 [DNS 迁移文档](https://www.nerdpress.net/how-to-transfer-your-dns-management-to-cloudflare/)，把域名的 DNS 服务商设置为 Cloudflare。
![在 Cloudflare DNS1](/images/posts/8/4-10-0.webp)
![在 Cloudflare DNS2](/images/posts/8/4-10.webp)

#### 4. 在 Vercel 关联自定义域名

然后在 Vercel 项目控制面板，为部署项目添加自定义域名
![Vercel 项目关联域名](/images/posts/8/4-12.webp)

在域名 DNS 提供商添加对应的 A 记录，CNAME 记录，可以点击自动配置按钮，识别正确的话，会授权跳转到对应 DNS 服务提供商完成配置。

![根据 Vercel 信息配置 DNS1](/images/posts/8/4-13.webp)
![根据 Vercel 信息配置 DNS2](/images/posts/8/4-14.webp)

至此，等 DNS 解析生效，就可以通过自定义域名访问部署的网站了。

### 5. 使用 Cloudflare DNS 代理

在 `DNS/Records` 面板，打开代理开关，加速 Web 访问速度。
![在 Cloudflare 打开代理](/images/posts/8/4-15.webp)

最后在 `Speed/Observatory` 面板 验证加速效果。
![在 Cloudflare 查看加速效果](/images/posts/8/4-16.webp)

备注：如果国内用户访问速度慢，可以在 Cloudflare 更换 DNS 配置为 Vercel 对相关场景的优化配置
A 记录地址：76.223.126.88，CNAME 记录地址：cname-china.vercel-dns.com。
