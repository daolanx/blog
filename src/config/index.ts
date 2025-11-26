import { Github, Twitter } from "lucide-react"

export const defaultLanguage: string = "en"

export const common = {
  domain: "https://daolanx.me",
  meta: {
    favicon: "/avatar.png",
    url: "https://daolanx.me",
  },
  googleAnalyticsId: "G-YDEKLKLZVC",
  social: [
    {
      icon: Twitter,
      label: "X",
      link: "https://x.com/daolanx",
    },
    {
      icon: Github,
      label: "GitHub",
      link: "https://github.com/daolanx",
    },
  ],
  rss: true,
  navigation: {
    home: true,
    archive: true,
    custom: [
      // {
      //   label: "CamLife",
      //   link: "https://camlife.cn",
      // },
    ],
    links: true,
    about: true,
  },
  latestPosts: 8,
}

export const zh = {
  ...common,
  siteName: "道蓝的博客",
  meta: {
    ...common.meta,
    title: "道蓝的博客",
    slogan: "记录从前端，到全栈和独立开发的进阶之路",
    description: "记录从前端，到全栈和独立开发的进阶之路",
  },
  navigation: {
    ...common.navigation,
    custom: [
      // {
      //   label: "影集",
      //   link: "https://camlife.cn",
      // },
    ],
  },
  pageMeta: {
    archive: {
      title: "归档",
      description: "道蓝的所有文章",
      ogImage: "/images/page-meta/zh/archive.png",
    },

    about: {
      title: "关于我",
      description: "道蓝的自我介绍",
      ogImage: "/images/page-meta/zh/about.png",
    },
  },
}

export const en = {
  ...common,
  siteName: "Dax's Blog",
  meta: {
    ...common.meta,
    title: "Dax's Blog",
    slogan:
      "Tracking the progression from Front-End Engineer to Full-Stack Developer and Indie Hacker.",
    description:
      "Tracking the progression from Front-End Engineer to Full-Stack Developer and Indie Hacker.",
  },
  navigation: {
    ...common.navigation,
    custom: [
      // {
      //   label: "CamLife",
      //   link: "https://camlife.cn",
      // },
    ],
  },
  pageMeta: {
    archive: {
      title: "All Posts",
      description: "Here are Dax's all posts",
      ogImage: "/images/page-meta/en/archive.png",
    },

    about: {
      title: "About Me",
      description: "Here is Dax's self-introduction",
      ogImage: "/images/page-meta/en/about.png",
    },
  },
}
