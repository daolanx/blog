import { getCollection } from "astro:content"

/**
 * Format date in a locale-aware way.
 * @param date - The date to format
 * @param lang - Language code ("en" or "zh"), enables locale-aware formatting
 * @param format - Optional explicit format pattern (e.g. "YYYY-MM-DD", "MM-DD").
 *                 When omitted, uses Intl.DateTimeFormat for the given lang.
 */
export const formatDate = (
  date: Date | string | undefined,
  lang?: string,
  format?: string,
): string => {
  const validDate = date ? new Date(date) : new Date()

  // Explicit format pattern — used by API and archive (MM-DD)
  if (format) {
    const tokens: Record<string, string> = {
      YYYY: validDate.getFullYear().toString(),
      MM: String(validDate.getMonth() + 1).padStart(2, "0"),
      DD: String(validDate.getDate()).padStart(2, "0"),
    }
    return format.replace(/YYYY|MM|DD/g, (match) => tokens[match])
  }

  // Locale-aware formatting
  const y = validDate.getFullYear()
  const m = String(validDate.getMonth() + 1).padStart(2, "0")
  const d = String(validDate.getDate()).padStart(2, "0")

  if (lang === "zh") {
    return `${y}年${m}月${d}日`
  }

  // English: "Jun 06, 2026"
  const month = validDate.toLocaleString("en-US", { month: "short" })
  return `${month} ${d}, ${y}`
}

export const getPostsByLocale = async (locale: string) => {
  const posts =
    locale === "en"
      ? await getCollection("enPosts")
      : await getCollection("zhPosts")
  return posts.sort(
    (a: any, b: any) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  )
}

export const getTagsByLocale = async (locale: string) => {
  const posts = await getPostsByLocale(locale)
  return [...new Set(posts.flatMap((post: any) => post.data.tags || []))]
}

export const getTagsWithCountsByLocale = async (locale: string) => {
  const posts = await getPostsByLocale(locale)
  const tags: Record<string, number> = {}
  posts.forEach((post: any) => {
    const t = post.data.tags || []
    t.forEach((tag: string) => {
      tags[tag] = (tags[tag] || 0) + 1
    })
  })
  return Object.entries(tags)
}
