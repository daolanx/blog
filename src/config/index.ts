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
  comments: {
    enabled: true,
    twikoo: {
      enabled: true,
      // replace with your own envId
      envId: import.meta.env.PUBLIC_TWIKOO_ENV_ID ?? "",
    },
  },
}

export const zh = {
  ...common,
  siteName: "道蓝的博客",
  meta: {
    ...common.meta,
    title: "道蓝的博客",
    slogan: "前端, 自由职业者新手, INFP, 感兴趣有趣或具有价值的技术",
    description: "前端,自由职业者,INFP,技术",
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
      description: "小孙同学的所有文章",
      ogImage: "/images/page-meta/zh/archive.png",
    },

    about: {
      title: "关于我",
      description: "小孙同学的自我介绍",
      ogImage: "/images/page-meta/zh/about.png",
    },
  },
}

export const en = {
  ...common,
  siteName: "Daolanx’s Blog",
  meta: {
    ...common.meta,
    title: "Daolanx’s blog",
    slogan:
      "f2e, freelance rookie, infp, intrigued by technology that is either fascinating or of significant value.",
    description: "f2e, freelance, infp, technology.",
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
      description: "Here are Guoqi Sun's all posts",
      ogImage: "/images/page-meta/en/archive.png",
    },

    about: {
      title: "About Me",
      description: "Here is Guoqi Sun's self-introduction",
      ogImage: "/images/page-meta/en/about.png",
    },
  },
}
