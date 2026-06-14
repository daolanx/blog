import { OGImageRoute } from "astro-og-canvas"
import { defaultLanguage } from "~/config"
import { getPostsByLocale } from "~/utils"

const posts = await getPostsByLocale(defaultLanguage)

// OG image data for blog posts
const postPages = Object.fromEntries(
  posts.map(({ id, data }) => [id, { data }]),
)

// OG image data for homepage and tags page
const sitePages: Record<string, { data: { title: string; description: string } }> = {
  "preview": {
    data: {
      title: "Dax’s Blog",
      description: "F2E, Full-Stack To Indie Hacker",
    },
  },
}

const pages = { ...postPages, ...sitePages }

export const { getStaticPaths, GET } = OGImageRoute({
  param: "route",
  pages,
  getImageOptions: async (_, { data }: (typeof pages)[string]) => {
    return {
      title: data.title,
      description: data.description,
      bgGradient: [
        [6, 38, 45],
        [8, 3, 2],
      ],
      logo: {
        path: "./public/avatar.png",
        size: [100],
      },
      fonts: ["./public/fonts/hwmc.otf"],
    }
  },
})
