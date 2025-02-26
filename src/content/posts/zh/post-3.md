---
title: "群晖 NAS 部署思源笔记 + Cloudflare Tunnel 外网 HTTPS 访问"
pubDate: 2024-10-29
updatedDate: 2024-10-29
description: ""
author: "道蓝"
tags: ["群晖", "NAS", "Cloudflare", "思源笔记"]
---

## 一、为什么用思源笔记

之前用的一款在线笔记，使用上倒是没什么问题，整体功能迭代很慢尚能忍受，最近想做自己的笔记数据导出，发现并没有提供批量导出，即使一大群用户反馈希望这个功能，但他们并没有回应，就连付费用户也没有这个功能，反倒是网上有人写了第三方工具支持...这可能就看出做产品一些思路和格局问题，产品粘性不是用更好的体验和功能来达成，而是想通过用户使用累计数据更多的带来更大的迁移成本来圈住用户，这就有点过分了。为长期考虑，用三方工具导出我的笔记后，开始找替代品。

我希望的笔记产品具备两个核心特性，一个是数据自由和数据安全，一个是 markdown 的所见即所得的体验。notion 其实体验不错，但是数据和网站在国外，哪怕折腾数据做同步，访问速度也是个问题；obsidian 是比较热门符合基本条件，也有丰富的插件生态，但对我来说，使用 app 不太习惯，我更习惯使用浏览器，还有它一堆的教程看着头疼，我诉求是写笔记，不是折腾笔记本身，希望开箱即用。

[思源笔记](https://b3log.org/siyuan/) 感觉还可以。支持 nas docker 部署和导入导出，数据安全自由；体验上也是所见即所得；开源软件，仓库还算活跃，有一定数量的插件；因为我主要用 docker 部署 web，web 天生就是 c/s 架构，免去了数据同步的费用和折腾。
思源作者也有点故事，[b3logos](https://github.com/88250) 持续在这个领域开源建设 10+ 年，唯一不太好的就是作者有黑历史不过作者也[公开道歉了](https://github.com/siyuan-note/siyuan/issues/5721), 除了热情和能力，我还是欣赏他的真诚和勇气。

## 二、为什么用 Cloudflare Tunnel 做内网穿透

一句话总结，可能是在没有公网 IP 下，实现内网穿透自定义域名 https 的最简单且免费的方案。

如果有公网 IP，DDNS 方案最简单稳定。我暂时没办法搞到公网 IP，就尝试了一些内网穿透方案：花生壳比较出名，无论路由器还是 NAS 上也有插件可以配置，但要实名认证，自定义域名解析也要付费。cpolar 其实跑通了，主要是支持自定义域名要购买付费专业版，还要自己折腾 https 证书。

[Cloudflare](https://cloudflare.com) 不愧是赛博菩萨，支持自定义域名，自动配置 https 证书，而且完全免费。唯一不足就是服务器在国外，对访问速度有点影响。我尝试了一些优选 IP 方案想加速方案，不过并没有成功。打算先笔记服务用起来，后续争取搞到公网 IP 再直接切换到 DDNS 方案，避免内网穿透总是有个数据中转带来的速度和成本问题。

## 三、如何在群晖 NAS Docker 部署思源笔记

这里我用的是群晖 DS220+ 支持 Docker.

### 3.1 配置思源的文件夹

使用 File Station 套件，在 docker 文件夹下新建 siyuan / workspace 的文件夹。

siyuan 和 workspace 文件夹右键属性设置 Everyone 读写权限，并应用到子文件夹。可以直接在顶层 docker 文件夹设置读写和继承权限更方便。

![1-1](/images/posts/3/1-1.webp)

### 3.2 下选择思源 Docker 镜像

在套件中心搜索安装 Container Manager 套件。在该套件下选择思源镜像 blog3/siyuan 下载。

![1-2](/images/posts/3/1-2.webp)

### 3.3 启动思源容器

因为 Container Manager 界面安装的执行命令输入框总提交报错，在这里我还是改用命令行更清晰。在 ssh admin 账户下操作，注意 accessAuthCode 的 xxx 需要改为自己定义的授权码，将会作为思源的登录密码：

```bash
sudo -i # 切换到 root 账户

# 安装群晖, [命令行说明](https://github.com/siyuan-note/siyuan)
sudo docker run -d --name siyuan -v /volume1/docker/siyuan:/siyuan -p 6806:6806 -u root b3log/siyuan:latest -workspace /siyuan --accessAuthCode=xxx

```

### 3.4 内网运行测试

浏览器访问 群晖ip:6806，密码是安装时的 accessAuthCode.
![1-4](/images/posts/3/1-4.webp)  
界面可以通过 setting 修改语言为中文.
![1-5](/images/posts/3/1-5.webp)

这样群晖内网安装思源笔记就完成了。

### 3.5 启动容器遇到的一些问题和解决办法

#### 3.5.1 Container Manager 镜像列表无数据

如镜像源列表和下载有问题，可以先试试 Beta 版本， 我使用的是 24.0.2-1525, 修复了下载镜像源获取和下载的一些问题。

#### 3.5.2 启动失败 addgroup: permission denied

执行上述 docker run 以后安装失败，提示

```bash
Creating group siyuan (1000)
addgroup: permission denied (are you root?)
```

尝试 sudo -i 切换为 root 账户执行，报错仍然存在。 一番排查发现是要安装 Entware，创建组和用户。

```bash
# 参考 [Entware](https://github.com/Entware/Entware/wiki/Install-on-Synology-NAS) 安装 Entware
wget -O - https://bin.entware.net/x64-k3.2/installer/generic.sh | /bin/sh

# 更新源
opkg update

# 安装 shadow-utils
opkg install shadow-utils

# 创建组和用户
sudo groupadd -g 1000 siyuan
sudo useradd -u 1000 -g siyuan siyuan
```

## 四、如何配置 cloudflare Tunnel

### 4.1 将域名托管到 cloudflare

可以在 Cloudflare 新建域名，或者将[已有域名托管到 Cloudflare](https://juejin.cn/post/7267733291569168423)。直到管理域菜单下域名状态正常。
![2-15](/images/posts/3/2-15.webp)

### 4.2 Cloudflare 网站新建 Tunnel

访问 Cloudflare Zero Trust 下的 tunnels 页面，点击新建 tunnel

![2-1](/images/posts/3/2-1.webp)
![2-2](/images/posts/3/2-2.webp)
![2-3](/images/posts/3/2-3.webp)

这里 tunnel 名字随便写一个
![2-4](/images/posts/3/2-4.webp)

这里 Cloudflare 给了我们当前 tunnel 的 token， 并提示接下来是要安装环境客户端了。
![2-5](/images/posts/3/2-5.webp)

### 4.3 NAS 安装 Cloudflare 客户端

这里可以选择两种安装方式。

#### 4.3.1 最简单的安装方式，使用套件安装

最简单的安装方式是，套件中心的套件来源右上角新增 [矿神群晖](https://spk7.imnks.com), 在社群的套件里可以安装 Clouflare tunnel，输入上面网站给的 token。我遇到问题是这个镜像源不是很稳定，有时候套件列表无数据没显示。
![2-6](/images/posts/3/2-6.webp)
![2-7](/images/posts/3/2-7.webp)

#### 4.3.2 比较稳定的安装方式，采用 docker 安装

在 Container Manager 下载镜像 cloudflare/cloudflared

![2-8](/images/posts/3/2-8.webp)

使用命令行安装，比官方命令行加了 -d --name=cloudflare --restart unless-stopped 设置容器名字、后台运行、和非手动关闭自动重启. your-token 需要改为刚才官网上提供安装方式的 token.

```bash
docker run -d --name=cloudflare --restart unless-stopped cloudflare/cloudflared:latest tunnel --no-autoupdate run --token <your-token>
```

Docker 运行以后，刷新 Cloudflare 网站的 tunnels 页面，可以看到 tunnel 状态正常，点击创建的 tunnel 继续配置 Public Hostname

![2-9](/images/posts/3/2-9.webp)
![2-10](/images/posts/3/2-10.webp)
这里配置成外网访问的域名和子域名，和内网思源文档的 http 访问方式。这里以外网访问 note.xyz.com 为例, 192.168.x.x:6806 是内网访问思源的 ip 和端口号
![2-11](/images/posts/3/2-11.webp)
配置成功以后，可以看到托管域名的 DNS 上多了一条 CNAME 记录。
![2-13](/images/posts/3/2-13.webp)

#### 4.3.3 外网访问测试

可以通过 https 用刚才的域名访问到 NAS 部署的思源文档。至此安装就完成了。

![2-12](/images/posts/3/2-12.webp)

### 感想

和公司指定用一款产品/技术不同，好的技术和产品生态其实不是只有标准答案和零和博弈，产品技术应该像逛超市一样各有特色，有可以选择的东西，和结合主客观情况选择的自由，以及组合的灵活性。

## 参考资料

- [利用 Docker 安装思源笔记服务器](http://www.itdog.net/post/608.html)
- [使用 Cloudflare tunnel 进行内网穿透教程](https://hackfang.me/nas-cloudflare-tunnel)
