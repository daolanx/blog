interface HastNode {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

/**
 * Rehype plugin: inject loading="lazy" and decoding="async" on all <img> elements.
 * Improves bandwidth usage by deferring off-screen image loads.
 */
export function rehypeImgLazy() {
  return (tree: HastNode) => {
    walk(tree)
  }
}

function walk(node: HastNode) {
  if (!node.children) return
  for (const child of node.children) {
    if (child.type === "element") {
      if (child.tagName === "img") {
        if (!child.properties) child.properties = {}
        if (!child.properties.loading) {
          child.properties.loading = "lazy"
        }
        if (!child.properties.decoding) {
          child.properties.decoding = "async"
        }
      }
      walk(child)
    }
  }
}
