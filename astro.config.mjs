import mdx from "@astrojs/mdx"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections"
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers"
import tailwindcss from "@tailwindcss/vite"
import expressiveCode from "astro-expressive-code"
import { defineConfig } from "astro/config"

import robotsTxt from "astro-robots-txt"

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
  integrations: [
    react(),
    sitemap(),
    expressiveCode({
      plugins: [pluginCollapsibleSections(), pluginLineNumbers()],
      themes: ["material-theme-lighter", "material-theme-darker"],
      defaultProps: {
        showLineNumbers: true,
      },
    }),
    mdx(),
    robotsTxt(),
  ],
})
