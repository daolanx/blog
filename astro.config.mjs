import mdx from "@astrojs/mdx"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"

import robotsTxt from "astro-robots-txt"
import { remarkRewriteLinks } from "./src/utils/remark-rewrite-links"

// https://astro.build/config
export default defineConfig({
  output: "static",
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "tap",
  },
  site: "https://daolanx.me",
  vite: {
    plugins: [tailwindcss()],
    build: {
      minify: "terser",
      target: "esnext",
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // React vendor 单独打包
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom")) {
                return "react-vendor"
              }
              return "vendor"
            }
            // 组件和布局分别打包
            if (id.includes("/src/")) {
              if (id.includes("/src/components/")) {
                return "components"
              }
              if (id.includes("/src/layouts/")) {
                return "layouts"
              }
              return "app"
            }
            return null
          },
        },
      },
    },
  },
  markdown: {
    remarkPlugins: [remarkRewriteLinks],
  },
  integrations: [
    react(),
    sitemap(),
    mdx(),
    robotsTxt(),
  ],
})
