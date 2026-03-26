---
title: "使用 Stitch 结合 Claude Code 和 Figma MCP 实现从想法到代码"
author: "Dax"
pubDate: 2026-03-26
updatedDate: 2026-03-26
tags: ["Stitch", "Claude Code", "Figma", "MVP"]
description: ""
---

# 1. 使用效果
首先直接看效果。使用 [Stitch](https://stitch.withgoogle.com/) 后，整体设计品质提升极大。

## Before: 之前靠程序员感觉手工编码的 AI Chat Web
![](/images/posts/18/1.webp)

## After: 使用 Stitch 结合 Claude Code + Figma MCP 设计转代码实现如下
![](/images/posts/18/2.webp)

可以直接访问 Live Demo 体验: [https://demo.daolanx.com/ai-chat](https://demo.daolanx.com/ai-chat)

# 2. 操作步骤

## 2.1 在 Stitch 用 AI 辅助生成设计稿

在 [Stitch](https://stitch.withgoogle.com/) 上和正常聊天一样，输入想法和描述，它会生成对应的设计稿，可以不断通过对话和它调整，他会按描述生成调整后的新版本。
![](/images/posts/18/3.webp)

## 2.2 导出满意的版本到设计软件格式

![](/images/posts/18/4.webp)

## 2.3 使用设计稿转代码
和之前[《使用 Claude Code + Figma MCP 进行设计到代码》 ](https://www.daolanx.me/zh/posts/post-16/) 步骤一样，可以参考之前步骤，不再重复。

# 总结
可以看到，实际操作步骤非常简单，但我们评估生产工具和工作流，并不是只看是否简单，对于开发者，它的价值在于，弥补设计短板，和能直接用于 MCP 产品工作流：

## 1. 弥合开发者设计能力短板
程序员普遍设计经验不足，[Stitch](https://stitch.withgoogle.com/) 能很大程度上弥补程序员的设计能力短板，从而拓展工作能力。从之前依赖设计稿，只能设计转代码或者功能性开发，进一步延展到，可以从想法到代码完成基本的 MVP 开发。当然并不是说有了 Stitch 就能做到非常好的设计，正如 AI 对开发能力的促进一样，AI 实现设计也非常依赖使用者的产品和设计经验以及品位，用恰当的提示词来引导 AI，专业者和非专业者对提示词的控制能力和精确性，会使得设计结果拉开差距.

## 2. 能纳入 MVP 产品工作流使用
市面上有很多使用 skill + AI 写代码体现设计的方案，相对来说，[Stitch](https://stitch.withgoogle.com/) 更简单稳定，阶段清晰，设计阶段就做设计的事情，后续可以做纯粹的设计转代码，对于 MVP 类产品，几乎可以直接纳入生产流程。


