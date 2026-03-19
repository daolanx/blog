---
title: "使用 Claude Code + Figma MCP 实现设计稿转代码"
author: "Dax"
pubDate: 2026-03-19
updatedDate: 2026-03-19
tags: ["Claude Code", "Figma"]
description: ""
---

![](/images/posts/16/14.webp)

# 转换效果
先直接看结果。我使用了 Figma 社区的 [Flower Delivery website 设计稿 ](https://www.figma.com/community/file/1259217583079978202)

![](/images/posts/16/0-1.webp)

通过 AI 生成的[代码](https://github.com/daolanx/work/tree/main/app/flower-shop)，最终的网页效果 [Live Demo](https://demo.daolanx.com/flower-shop)
![](/images/posts/16/0-2.webp) 

虽然 Figma 社区有很多主打“高精度转代码”的收费插件，但通过 Claude Code + Figma MCP 这一免费组合，基本可以快速达到 70% 的还原度。再配合开发者后续的细节调优，能产出符合生产环境要求的代码。下面分享具体的实现步骤。


# 实现步骤
## 1. 开启 Figma Dev Mode
Dev Mode 不仅提供了查看代码和属性的面板，更重要的是，它是访问 Figma 官方 MCP 服务器的必要条件。
可以参考 [Figma 席位文档](https://help.figma.com/hc/en-us/articles/360039960434-Manage-seats-in-Figma) 为自己的账号开启具备 Dev Mode 的权限。

![](/images/posts/16/1.webp)

## 2. 环境配置与安装

### 2.1 安装 Claude Code 
参考 [ClaudeCode 安装文档](https://code.claude.com/docs/en/overview) 完成基础安装。

### 2.2 安装 Figma MCP

相比于单纯的“截图转代码”，接入 Figma MCP 后，AI 能直接读取设计稿的图层信息、精准的 CSS 属性和弹性布局规则，大幅提高组件拆分粒度和转化精度。


推荐优先使用[Figma 官方的插件](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/#claude-code) 安装：
```shell
claude plugin install figma@claude-plugins-official
```
备用方案：如果插件安装异常，可直接通过 MCP 方式添加：
```shell
claude mcp add --transport http figma https://mcp.figma.com/mcp
```


### 2.3 安装 Playwright MCP

引入 Playwright MCP 的好处是：在生成代码后，AI 可以直接调用无头浏览器进行截图，与原设计稿进行视觉对比，从而实现自动化的精度修正。
也是优先插件安装，有异常再直接参考[playwright MCP 安装文档](https://github.com/microsoft/playwright-mcp) 直接安装 MCP。

```shell
claude plugin install playwright@claude-plugins-official
```
备用方案: 如果插件安装异常，参考[playwright MCP 安装文档](https://github.com/microsoft/playwright-mcp) 直接安装 MCP:
```shell
claude mcp add playwright npx @playwright/mcp@latest
```
> 注：**anthropics/claude-plugins-official** 插件市场新版本不太稳定，可以参考 [reddit](https://www.reddit.com/r/ClaudeCode/comments/1rqul0v/claudepluginsofficial_is_broken_due_to_commit/) 处理。

### 2.4 验证 MCP 状态
claude 命令行下 执行 /mcp, 如果 figma 和 playwright 连接正常，则环境准备完毕，环境就准备完毕了。

![](/images/posts/16/2.webp)

---

## 3. 提示词的核心逻辑：管理注意力窗口
参考[Claude Code 的 最佳实践](https://code.claude.com/docs/en/best-practices)，里面提到了很多实用建议，例如：分步骤，明确，清晰，上下文，可验证等等。

其实不用背这些规则，而是要理解它这样建议的原因。读最佳实践文档让我想起了 [《注意力就是一切》（2017）](https://en.wikipedia.org/wiki/Attention_Is_All_You_Need)这篇论文。Transformer 架构是当今大型模型背后的核心技术基础。提示词其实是对注意力的引导和管理，我的理解是，要用好提示词，需要关注 “注意力窗口”，一个是整体内容上需要精简聚焦，一个是步骤上需要注意粒度和清晰准确性可验证，减少 AI 的 上下文搜索和推测，从而提高执行精度。

有了上述环境和认知准备，接下来的操作显得相对清晰简单。

![](/images/posts/16/4.webp)


## 4. 代码生成步骤

### 4.1 初始化 Next.js 项目

分步骤开发可以降低上下文复杂度，提高转化进度。在设计稿转代码之前，可以先聚焦完成脚手架搭建。

```shell
Please generate a Next.js project scaffold with the following stack:
App Router, Tailwind CSS, TypeScript, Biome, and pnpm. 
```

![](/images/posts/16/3.webp)
![](/images/posts/16/5.webp)

通过精简清晰的提示词引导， Claude Code 如期完成了脚手架的搭建。
可以阶段性的让它提交 git commit 步步为营。
![](/images/posts/16/5-1.webp)


### 4.2 按模块注入设计稿

以首页为例，设计稿通常包含多个响应式尺寸。这里有一个小技巧：可以切换到 Claude 的 Plan 模式，先问问它希望接收什么格式的信息。

```shell
I have three sets of design specs for different screen sizes. When generating code from Figma, do you find it more efficient to process them size-by-size (top-to-bottom for each), or would it be better for you if I provide the same module across all sizes in one batch?
```

![](/images/posts/16/6.webp)

Claude 反馈：同一个模块的不同尺寸一并给它最方便。
于是，我们在 Figma 中选中同一模块的多个尺寸，右键复制链接，并附上提示词：

```shell
Implement the xxx-section module for different responsive breakpoints,
ensuring adherence to the project's existing tech stack and file structure.
```

![](/images/posts/16/7.webp)
![](/images/posts/16/8.webp)

可以看出，实现效果对比设计稿还不错

![](/images/posts/16/9.webp)
![](/images/posts/16/10.webp)

我们按这个模式继续实现所有的其他模块。

### 4.3 过程调优

必须承认，推进过程并不会一帆风顺。例如设计稿中没有使用 Auto Layout 的图层、错误的绝对定位等，都会误导 AI.

与传统纯手工开发平稳的进度曲线不同，AI 辅助开发的曲线是：极速冲刺到 70% 完成度，然后花同样甚至更多的时间在剩下的 30% 精度调优上。

过程中比较有效的调优方式是：
- 1. 建立全局认知：执行 /init 让 AI 先通读理解当前项目结构。
- 2. 缩小上下文：拆分任务到具体的单一组件，避免 AI 迷失在复杂的代码逻辑中。
- 3. 先规划，后执行：遇到复杂布局，按 Shift + Tab 进入 Plan 模式。先和 AI 讨论布局思路（比如应该用 Grid 还是 Flex），确认无误后再执行。
- 4. 高频 Git 存档：AI 的输出存在不稳定性。只要某个模块调好了，立刻 Commit。
- 5. 及时保存：AI 存在不稳定性，对于确定完成的产出，最好 git 及时提交保存，步步为营。
- 6. 果断回滚：如果对当前生成的代码极其不满意，直接按两次 Esc 放弃当前节点，重新开始，这比让 AI 在错误的代码上修修补补效率更高。

经过多轮有效的提示词，Vibe Coding 项目最终应该能完成 70% 左右的设计稿转代码生成，想进一步提高精度就比较困难了，可能会陷入低效，不稳定的循环。

### 4.4 从业者调优
从业者通过技术知识和生产经验，进一步检查问题和进度，组织更高效精确的提示词，进一步按步骤提高还原度和工程质量，例如
- 视觉与性能：清理 AI 生成的冗余 CSS、优化 Tailwind 原子类、处理复杂的交互动效、优化图片加载以冲刺更高的 Lighthouse 跑分。
- 工程化：提取可复用组件、完善 ESLint/Biome 规则、配置 Cloudflare 或其他部署方案等。

# 感想

跑通这套 Claude Code + Figma MCP 的工作流后，最大感受是：它并不完美，后期调试依然费时，但整体周期的确比纯手工编码快得多。

关于“AI 会不会取代程序员”的讨论，我觉得可以把写代码比作卖咖啡。市面上有很多自动化的咖啡机和速溶咖啡（AI 生成的基础代码），它们能快速满足大部分人的需求。但这并不意味着专业的精品咖啡店（专业开发者）会消亡。

AI 看似在取代编码工作，实则开启了新的机会窗口，将程序员从重复性的“键盘体力劳动”中解放了出来。当绝大部分标准化的输入输出都能由机器加速完成时，开发者终于可以把核心精力延展，探索相关领域和机会：更灵活的架构调配，更好的体验和品位，更切合需求的技术产品，更符合商业的技术杠杆。
