---
title: "使用 Resend + Cloudflare + Gmail 实现免费专属域名邮箱"
pubDate: 2026-06-08
updatedDate: 2026-06-08
author: "Dax"
tags: ["Resend", "Cloudflare", "Gmail"]
description: "使用 Resend + Cloudflare + Gmail 实现免费专属域名邮箱，独立开发者的高性价比邮件解决方案。"
---

从产品角度看，拥有一个专属域名的邮箱是十分必要的，这比使用个人邮箱显得更加专业和正式。虽然 Google Workspace 和 Microsoft 365 提供了完整专业的企业邮箱能力，但作为独立开发者我们需要精打细算，根据产品所处阶段，其实有更多高性价比的方案可以选择。

本文主要记录如何通过 Resend 方案实现专属域名邮箱，最终达到在个人 Gmail 中无缝收发专属域名邮件的效果。

# 1. 效果演示
## 1.1 接收邮件：专属域名邮箱通过个人 Gmail 接收
使用个人邮箱撰写一封邮件，发送给 `support@daolanx.com`，随后该专属域名关联的个人 Gmail 顺利收到了这封邮件。

<div class="grid grid-cols-2 gap-1">
   <img class="!m-0"  src="/images/posts/22/1.webp" />
  <img class="!m-0"  src="/images/posts/22/2.webp" />
</div>

## 1.2 发送邮件：在个人 Gmail 中以专属域名身份发信
在 Gmail 中将发件人切换为 `support@daolanx.com`，发送邮件给个人邮箱，个人邮箱顺利收到该邮件。

<div class="grid grid-cols-2 gap-1">
   <img class="!m-0"  src="/images/posts/22/3.webp" />
  <img class="!m-0"  src="/images/posts/22/4.webp" />
</div>

这套方案在功能上完全满足需求。至于套餐额度，[Resend 免费套餐](https://resend.com/pricing)目前支持每月 3000 封邮件，对于处于产品前期的项目来说已经绰绰有余。

# 2. 实现专属域名邮箱发邮件的具体步骤

整体思路：利用 Resend 提供的 SMTP 能力，配合 Gmail 的「Send mail as」（用这个地址发送邮件）功能，实现以 `support@daolanx.com` 身份发信。

配置顺序为 Resend → Cloudflare → Gmail。Resend 会生成一批 DNS 记录，我们需要先在 Resend 创建域名，再将其拿到 Cloudflare 中添加以完成域名验证，最后在 Gmail 中接入 SMTP。

## 2.1 Resend 配置
Resend 负责提供域名邮箱的 SMTP 发信能力，它会生成一批 DNS 记录，需要拿到 Cloudflare 中添加以完成域名验证。

### 注册并创建 API Key
1. 注册 Resend 账号
2. 进入 Dashboard → API Keys → Create API Key
3. 填写名称（如 gmail-smtp），权限选择 Sending access 即可
4. 复制生成的 API Key（格式为 re_xxxx），妥善保存，后续配置 Gmail SMTP 时需要用到
![](/images/posts/22/5.webp)

### 添加域名并获取 DNS 记录
1. 进入 Dashboard → Domains → Add Domain
2. 输入你的域名，如 daolanx.com
3. Resend 会生成需要添加的 DNS 记录，点击 `自动配置` 即可完成 Cloudflare 对应域名的 DNS 修改

![](/images/posts/22/6.webp)
![](/images/posts/22/7.webp)
![](/images/posts/22/8.webp)

## 2.2 Cloudflare DNS 配置
上一步骤虽然已经自动导入了相关配置，这里我们还是在 Cloudflare 上进一步检查和说明这些记录的作用。

### SPF (Sender Policy Framework) 记录

```sh
# - include:_spf.resend.com — 授权 Resend 的邮件服务器以 daolanx.com 身份发信
# - include:_spf.mx.cloudflare.net — 同时也授权了 Cloudflare
# ~all — 其他来源标记为软失败（不拒绝，但可能标记可疑）
daolanx.com  TXT  "v=spf1 include:_spf.mx.cloudflare.net include:_spf.resend.com ~all"
```
这条记录告诉收件方的邮件服务器，谁有权代 `daolanx.com` 发邮件。收件方收到邮件后会查询这条记录，发现发送服务器属于 Resend，即在授权名单内，从而判定邮件合法。

### DKIM (DomainKeys Identified Mail) 记录
```sh
resend._domainkey.daolanx.com  TXT  "p=MIGfMA0GCSqGSIb3DQEBA..."
```
提供公钥，供收件方验证邮件签名。Resend 发出的每封邮件都会用私钥做数字签名。收件方通过这条 DNS 记录里的公钥来验证签名是否匹配，确认邮件内容未被篡改，且确实来自 daolanx.com 的授权发送方。

### Reend 的 Amazon SES 配置

```sh
send.daolanx.com MX feedback-smtp.us-east-1.amazonses.com # send.daolanx.com 的退信邮件由 Amazon SES 接收处理
send.daolanx.com TXT "v=spf1 include:amazonses.com ~all" # 授权 Amazon SES 以 send.daolanx.com 身份发送退信相关的反馈邮件
```
Resend 底层依赖于 Amazon SES，这两条记录主要用于 Resend 的退信处理配置。

### DMARC (Domain-based Message Authentication, Reporting, and Conformance)

```sh
_dmarc.daolanx.com  1  IN  TXT  "v=DMARC1; p=none;"
```
在 SPF 和 DKIM 的基础之上增加了对齐检查，以进一步提升安全性。目前的配置是 `p=none`，即验证未通过对齐时，不做拦截，照常投递。部分邮件服务商（包括 Gmail）会把是否拥有 DMARC 记录作为判断域名可信度的参考信号之一，推荐配置。

## 2.3 Gmail 配置「Send mail as」
通过 Gmail 的「Send mail as」功能接入 Resend SMTP，从而实现以 support@daolanx.com 身份发信。
添加 support@daolanx.com 发件人地址

- 1. 打开 Gmail → 点击右上角齿轮图标 → See all settings → Accounts and Import
- 2. 找到 Send mail as，点击 Add another email address
- 3. 在弹出窗口中填写：
  - **Name：** 显示的发件人名称，如 Support
  - **Email address：** `support@daolanx.com`
  - 勾选 Treat as an alias（保持默认，这样在回复或转发邮件时，系统会自动使用 `support@daolanx.com` 发送）
- 4. 点击 Next Step，填写 SMTP 信息：
  - **Server：** smtp.resend.com
  - **Port：** 465
  - **Username：** resend
  - **Password：** 填入前面保存的 Resend API Key（re_xxxx）
  - 选择 Secured connection using SSL

配置完成后，我们就可以在 Gmail 中以专属域名邮箱的身份发送邮件了。

![](/images/posts/22/9.webp)
![](/images/posts/22/10.webp)
![](/images/posts/22/11.webp)

# 3. 实现专属域名邮箱接收邮件的具体步骤

整体思路：通过 Cloudflare 配置的 Email Routing，将发往 `support@daolanx.com` 的邮件自动路由转发到个人 Gmail。



- 1. 在 Cloudflare Dashboard 进入 Email → Email Routing。

![](/images/posts/22/12.webp)

- 2. 首次使用点击 Get Started，Cloudflare 会自动为你添加所需的 MX 记录（指向 route.mx.cloudflare.net）。
![](/images/posts/22/15.webp)
- 3. 切换到 Routing Rules 标签页，添加路由规则：
  - **Custom address：** support
  - **Action：** Forward to
  - **Destination：** 你的个人 Gmail 地址（如 you@gmail.com）

![](/images/posts/22/13.webp)
![](/images/posts/22/14.webp)

# 4. 结语
通过 Resend + Cloudflare + Gmail 这三个服务的组合，我们可以零成本实现一套高可用的专属域名邮箱方案。Resend 负责通过 SMTP 发信，Cloudflare 负责 DNS 管理和邮件路由转发，Gmail 则作为日常收发的操作界面——三者各司其职，无需额外购买昂贵的企业邮箱服务。

这套方案的最大优势在于启动成本为零、配置链路简洁，非常适合独立开发者在产品早期快速搭建一个看起来足够专业的对外邮箱。[Resend](https://resend.com/pricing) 免费方案每月 3,000 封的额度，在产品初期基本够用。等未来业务量增长，需要配置更多邮箱别名或遇到额度瓶颈时，再考虑迁移到 [Zoho Mail](https://www.zoho.com/mail/zohomail-pricing.html?src=mpd-menu) 1美元方案或其他专业企业邮箱服务也不迟。