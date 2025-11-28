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
      label: "Twitter",
      link: "https://x.com/daolanx",
    },
    {
      label: "GitHub",
      link: "https://github.com/daolanx",
    },
    {
      label: "Mail",
      link: "mailto:daolanx@hotmail.com",
    },
  ],

  navigations: [
    {
      labelKey: "nav.home",
      pathName: "",
    },
    {
      labelKey: "nav.archive",
      pathName: "archive",
    },
    {
      labelKey: "nav.tags",
      pathName: "tags",
    },
    {
      labelKey: "nav.about",
      pathName: "about",
    },
  ],
  latestPosts: 8,
}

export const zh = {
  ...common,
  siteName: "道蓝的博客",
  meta: {
    ...common.meta,
    title: "道蓝的博客",
    keywords: "前端,全栈,独立开发",
    slogan: "前端，全栈，独立开发进阶之路",
    description: "记录从前端，到全栈和独立开发的进阶之路",
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
    keywords: "F2E,Full-Stack,Indie Hacker",
    title: "Dax's Blog",
    slogan: "F2E, Full-Stack To Indie Hacker",
    description:
      "Tracking the progression from Front-End Engineer to Full-Stack Developer and Indie Hacker.",
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
