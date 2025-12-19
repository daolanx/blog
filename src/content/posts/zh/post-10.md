---
title: "免费 AI IDE: VSCode + Roo + Mimo"
pubDate: 2025-12-19
updatedDate: 2025-12-19
author: "道蓝"
tags: ["VSCode", "Roo Code", "Mimo", "AI", "IDE"]
description: ""
---

### 一、为什么不再用 Github Copilot？

前段时间我一直在 VSCode 上使用 [Github Copilot](https://github.com/features/copilot) 进行 AI 辅助编程。不愧是内置插件，它和 VScode 结合紧密交互友好，在处理轻量级局部问题时确实好用。但免费版每月有 token 限制，每月 10 美元还是有点贵。正好月度 token 用完了，得先看看有没有免费的方案，能省则省。
![](/images/posts/10/1-1.webp)

最初的想法是找个免费的模型对接 Github Copilot 就可以了。但看了下 Github Copilot 不支持自由添加模型，只能在有限的模型供应商里选择，升级 Pro 后才能选择更强大的模型。这让我明白了，这类插件的盈利模式，应该是相当于一个模型的终端消费场景，有点像水电供应。

![](/images/posts/10/1-2.webp)

![](/images/posts/10/1-3.webp)

既然商业化产品在提供良好服务的同时自定义程度较低，那就再看看开源方案有没有替代。

### 二、为什么选 Roo Code 作为 VSCode 的 AI 编程插件

好在 VSCode 插件生态支持开源方案。

目前 VSCode 比较流行的 AI 插件有 Cline、Roo Code、Kilo Code 等。

![](/images/posts/10/2-1.webp)
社区意见大致观点是：Cline 流行度更高，Kilocode 增长更快，Roo Code 更灵活。虽然几款工具都宣称具备很多配置能力，但从个人选择角度出发，这不是技术调研无需深入研究，从使用习惯出发趁手就好。

#### 1. Cline

最流行的 Cline，单看交互界面的 Plan 和 Act 模式，比起更贴合场景的 Github Copilot，我用起来不太习惯，先待定。

![](/images/posts/10/2-2.webp)

#### 2. Kilo Code

Kilo Code 这个交互就不错，Code，Ask，Debug，Agent 非常符合使用场景，但是在接入自定义模型时踩了坑，自动补全无法运行。

![](/images/posts/10/2-3.webp)

Kilo 社区 [Issue#3548](https://github.com/Kilo-Org/kilocode/issues/3458) 也反馈这个功能有问题。代码补全是提效刚需啊，不能用就先放弃。

### 3. Roo Code

最后看看 Roo Code，界面符合预期，初始化并没有社区说的复杂，自定义模型后代码补全正常，就选它了！

![](/images/posts/10/2-4.webp)

把它移到右边栏，然后试试常见的文件右键操作，一切正常。
![](/images/posts/10/2-5.webp)
![](/images/posts/10/2-6.webp)
![](/images/posts/10/2-7.webp)

### 三、后续清理，隐藏 Github Copilot

安装好了 Roo Code 以后，可以隐藏 Github Copilot 以保持界面简洁。
![](/images/posts/10/3-1.webp)
![](/images/posts/10/3-2.webp)
![](/images/posts/10/3-3.webp)

后续要开启也很简单，可以在 VSCode 的设置中找到 chat.disableAIFeatures 选项，去掉勾选即可。

### 四、为什么用 Mimo

其实免费模型也不好找，大多优秀的模型都是通过 Web 产品展示能力，调用 API 就要收费，商业模式真的像水电提供商。

近期也正好赶上 12.17 小米人车家大会发布了其大模型基座 [MiMo-V2-Flash](https://mimo.xiaomi.com/blog/mimo-v2-flash)，其亮点是在能力不错的前提下，速度也很快，而且能到超低的价格（$0.1 per million input tokens and $0.3 per million output tokens），性能有竞争力价格厚道，这很小米^\_^"。

![](/images/posts/10/4-1.webp)

![](/images/posts/10/4-2.webp)

在能力差异不大的前提下，速度和价格是我比较看重的。通过 [Web 版本](https://aistudio.xiaomimimo.com/#/) 试用后，初看速度和能力还行，且目前十几天免费，先接入使用看看效果，后续如果收费，因为价格便宜，也可以作为一个廉价收费模型备选。

### 五、在 Roo Code 配置 Roo Code

接入 Cline、Kilo Code、Roo Code 也比较简单，按 [MiMo API 接入文档](https://platform.xiaomimimo.com/#/docs/integration/cline-kilo-roo) 操作即可，轻量级编程辅助应该够用了。
![](/images/posts/10/5-1.webp)
