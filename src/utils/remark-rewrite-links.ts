import type { Plugin } from "unified"
import type { Root } from "mdast"

const LANGS = ["en", "zh"]

/**
 * Remark plugin that rewrites bare internal links (e.g. /posts/post-12/)
 * to include the language prefix (e.g. /zh/posts/post-12/) based on
 * the content file's location (src/content/posts/{lang}/...).
 */
export const remarkRewriteLinks: Plugin<[Root], Root> = () => {
  return (tree, file) => {
    const filePath = file.history?.[0] || (file as any).path || ""
    const match = filePath.match(/\/content\/posts\/(en|zh)\//)
    if (!match) return
    const lang = match[1]

    visit(tree, (node: any) => {
      if (
        node.type === "link" &&
        node.url &&
        node.url.startsWith("/") &&
        !node.url.startsWith(`/${lang}/`) &&
        !LANGS.some((l) => node.url.startsWith(`/${l}/`))
      ) {
        node.url = `/${lang}${node.url}`
      }
    })
  }
}

function visit(node: any, callback: (node: any) => void) {
  callback(node)
  if (node.children) {
    for (const child of node.children) {
      visit(child, callback)
    }
  }
}
