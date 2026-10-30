export const defaultLanguage: string = "en"

export const common = {
  domain: "https://daolanx.me",
  meta: {
    favicon: "/avatar.png",
    url: "https://daolanx.me",
  },
  googleAnalyticsId: null,
  social: [
    {
      label: "GitHub",
      link: "https://github.com/daolanx",
    },
    {
      label: "Twitter",
      link: "https://x.com/daolanx",
    },
    {
      label: "Profile",
      link: "https://demo.daolanx.com",
    },

    {
      label: "Email",
      link: "mailto:daolanx.dev@gmail.com",
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
  siteName: "Dax 的博客",
  meta: {
  ...common.meta,
  title: "Dax 的博客",
  keywords: "全栈,独立开发",
  slogan: "爱技术，爱生活，我的全栈与独立开发手记",
  description: "爱技术，爱生活，我的全栈与独立开发手记",
},

  pageMeta: {
    archive: {
      title: "归档",
      description: "Dax 的所有文章",
      ogImage: "/images/page-meta/zh/archive.png",
    },

    about: {
      title: "关于我",
      description: "Dax 的自我介绍",
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
  keywords: "Full-Stack, Indie Development",
  slogan: "Love tech, love life. Notes on full-stack & indie dev.",
  description: "Love tech, love life. Notes on full-stack & indie dev.",
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
