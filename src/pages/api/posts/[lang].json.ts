import type { APIRoute } from "astro"
import { getPostsByLocale, formatDate } from "~/utils"
import { common } from "~/config"

export async function getStaticPaths() {
  return [
    { params: { lang: "en" } },
    { params: { lang: "zh" } },
  ]
}

export const GET: APIRoute = async ({ params }) => {
  const lang = params.lang
  if (!lang) {
    return new Response(null, { status: 400, statusText: "Bad Request" })
  }
  const posts = await getPostsByLocale(lang)
  const recent = posts.slice(0, 10)

  const data = recent.map(post => ({
    title: post.data.title,
    date: formatDate(post.data.pubDate),
    tags: post.data.tags || [],
    url: `${common.domain}/${lang}/posts/${post.id}/`,
  }))

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
