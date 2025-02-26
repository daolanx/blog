---
title: "Deploy SiYuan Notes on Synology NAS + External HTTPS Access via Cloudflare Tunnel"
pubDate: 2024-10-29
updatedDate: 2024-10-29
description: ""
author: "daolanx"
tags: ["synology", "NAS", "Cloudflare", "SiYuan"]
---

## 1. Why Choose SiYuan Notes

I previously used an online note-taking app that worked fine, and I could tolerate its slow feature updates. However, when I recently wanted to export my notes, I discovered there was no bulk export function. Despite numerous user requests for this feature, they didn't respond - even paid users didn't have access to it. Instead, third-party tools emerged to support this... This reveals some issues with their product philosophy and vision. Product stickiness should be achieved through better experiences and features, not by trapping users with high migration costs due to accumulated data. That's going too far. For long-term considerations, after exporting my notes using third-party tools, I began looking for alternatives.

I wanted a note-taking product with two core features: data freedom/security and a WYSIWYG Markdown experience. Notion offers a good experience, but with data and servers overseas, access speed is an issue even with data syncing. Obsidian is popular and meets basic requirements with a rich plugin ecosystem, but I'm not comfortable using apps - I prefer browsers. Plus, its numerous tutorials are overwhelming. I want to take notes, not tinker with the note-taking system itself. I need something that works out of the box.

[SiYuan Notes](https://b3log.org/siyuan/) seems decent. It supports NAS docker deployment and import/export, ensuring data security and freedom. The experience is WYSIWYG, it's open source with an active repository and decent number of plugins. Since I mainly use docker to deploy web services, the inherent client-server architecture eliminates sync costs and complications.
The SiYuan author has an interesting story - [b3logos](https://github.com/88250) has been contributing to open source in this field for 10+ years. While he has some controversial history, he has [publicly apologized](https://github.com/siyuan-note/siyuan/issues/5721). Beyond his passion and capability, I admire his sincerity and courage.

## 2. Why Use Cloudflare Tunnel for Internal Network Penetration

In short, it's possibly the simplest and free solution for achieving internal network penetration with custom domain HTTPS access when you don't have a public IP.

With a public IP, DDNS would be the simplest and most stable solution. Since I currently can't get a public IP, I tried some internal network penetration solutions: Oray is well-known with plugins for both routers and NAS, but requires real-name authentication and charges for custom domain resolution. cpolar worked but requires a paid professional version for custom domains and manual HTTPS certificate setup.

[Cloudflare](https://cloudflare.com) truly lives up to its reputation as a cyber bodhisattva, supporting custom domains, automatic HTTPS certificate configuration, and completely free. The only drawback is overseas servers affecting access speed. I tried some IP optimization methods for acceleration but wasn't successful. The plan is to get the note service running first, then try to obtain a public IP later to switch to DDNS, avoiding the speed and cost issues of data transit in internal network penetration.

## 3. How to Deploy SiYuan Notes on Synology NAS Docker

I'm using a Synology DS220+ which supports Docker.

### 3.1 Configure SiYuan Folders

Use File Station package to create siyuan/workspace folders under the docker folder.

Right-click siyuan and workspace folders, set Everyone read/write permissions, and apply to subfolders. It's more convenient to set read/write and inheritance permissions directly on the top-level docker folder.

![1-1](/images/posts/3/1-1.webp)

### 3.2 Select SiYuan Docker Image

Search and install Container Manager package in Package Center. Under this package, download the SiYuan image b3log/siyuan.

![1-2](/images/posts/3/1-2.webp)

### 3.3 Launch SiYuan Container

因为 Container Manager 界面安装的执行命令输入框总提交报错，在这里我还是改用命令行更清晰。在 ssh admin 账户下操作，注意 accessAuthCode 的 xxx 需要改为自己定义的授权码，将会作为思源的登录密码：

```bash
sudo -i # switch to root account

# install siyuan, [ref](https://github.com/siyuan-note/siyuan)
sudo docker run -d --name siyuan -v /volume1/docker/siyuan:/siyuan -p 6806:6806 -u root b3log/siyuan:latest -workspace /siyuan --accessAuthCode=xxx

```

### 3.4 Internal Network Testing

Access via browser using synology_ip:6806, with the password being the accessAuthCode set during installation.
![1-4](/images/posts/3/1-4.webp)  
The interface language can be changed to English through settings.
![1-5](/images/posts/3/1-5.webp)

This completes the installation of SiYuan Notes on the Synology internal network.

### 3.5 Some Issues and Solutions When Starting the Container

#### 3.5.1 No Data in Container Manager Image List

If there are issues with the image source list and downloads, try the Beta version first. I used version 24.0.2-1525, which fixed some problems with retrieving and downloading image sources.

#### 3.5.2 Startup Failure: addgroup: permission denied

After executing the above docker run command, installation failed with the error:

```bash
Creating group siyuan (1000)
addgroup: permission denied (are you root?)
```

Tried switching to root account with sudo -i, but the error persisted. After investigation, found that Entware needs to be installed first to create the group and user.

```bash
# Install Entware by following [Entware guide](https://github.com/Entware/Entware/wiki/Install-on-Synology-NAS)
wget -O - https://bin.entware.net/x64-k3.2/installer/generic.sh | /bin/sh

# Update package sources
opkg update

# Install shadow-utils
opkg install shadow-utils

# Create group and user
sudo groupadd -g 1000 siyuan
sudo useradd -u 1000 -g siyuan siyuan
```

## 4. How to Configure Cloudflare Tunnel

### 4.1 Host Domain on Cloudflare

You can create a new domain on Cloudflare, or [transfer an existing domain to Cloudflare](https://juejin.cn/post/7267733291569168423). Wait until the domain status shows as active in the domain management menu.
![2-15](/images/posts/3/2-15.webp)

### 4.2 Create New Tunnel on Cloudflare Website

Go to the tunnels page under Cloudflare Zero Trust and click to create a new tunnel

![2-1](/images/posts/3/2-1.webp)
![2-2](/images/posts/3/2-2.webp)
![2-3](/images/posts/3/2-3.webp)

You can enter any name for the tunnel here
![2-4](/images/posts/3/2-4.webp)

Here Cloudflare provides us with the token for the current tunnel, and indicates that we need to install the environment client next.
![2-5](/images/posts/3/2-5.webp)

### 4.3 Install Cloudflare Client on NAS

There are two installation methods to choose from.

#### 4.3.1 Simplest Installation Method - Using Package Installation

The simplest way is to add [IMNKS Synology](https://spk7.imnks.com) as a new package source in Package Center, then install Cloudflare tunnel from the community packages and enter the token provided on the website. I encountered an issue where this image source was not very stable, sometimes the package list would not display.
![2-6](/images/posts/3/2-6.webp)
![2-7](/images/posts/3/2-7.webp)

#### 4.3.2 More Stable Installation Method - Using Docker

Download the cloudflare/cloudflared image in Container Manager

![2-8](/images/posts/3/2-8.webp)

For command line installation, we add -d --name=cloudflare --restart unless-stopped to the official command to set the container name, run in background, and auto-restart unless manually stopped. Replace your-token with the token provided on the official website earlier.

```bash
docker run -d --name=cloudflare --restart unless-stopped cloudflare/cloudflared:latest tunnel --no-autoupdate run --token <your-token>
```

After Docker is running, refresh the tunnels page on the Cloudflare website. You should see the tunnel status is normal. Click on the created tunnel to continue configuring the Public Hostname.

![2-9](/images/posts/3/2-9.webp)
![2-10](/images/posts/3/2-10.webp)
Here you configure the external domain name and subdomain for access, along with the internal HTTP access method for SiYuan. For example, using note.xyz.com for external access, where 192.168.x.x:6806 is the internal IP and port for accessing SiYuan.
![2-11](/images/posts/3/2-11.webp)
After successful configuration, you'll see a new CNAME record added to the hosted domain's DNS.
![2-13](/images/posts/3/2-13.webp)

#### 4.3.3 Testing External Access

You can now access your NAS-deployed SiYuan document via HTTPS using the domain name we just configured. With this, the installation is complete.

![2-12](/images/posts/3/2-12.webp)

## 5. Reflections

Unlike companies that mandate specific products/technologies, good technology and product ecosystems aren't about having just one standard answer or zero-sum games. Products and technologies should be like shopping at a supermarket - each with their own characteristics, offering choices, freedom to select based on objective and subjective conditions, and flexibility in combinations.

## 6. References

- [Installing SiYuan Note Server Using Docker](http://www.itdog.net/post/608.html)
- [Tutorial on Using Cloudflare Tunnel for Internal Network Penetration](https://hackfang.me/nas-cloudflare-tunnel)
