// The specs pages render the repository's Markdown reference. Links between
// the two references stay on the site; any other relative link
// (`../theming.md`) points at the file on GitHub.
const REPO = 'https://github.com/YamadaBlog/pulse-player/blob/main/docs/reference/'
const LOCAL = { 'elements.md': 'specs/', 'engine.md': 'specs/engine/' }

/** @param {string} href @param {string} base */
export function rewriteDocHref(href, base) {
  if (/^(https?:|#|mailto:)/.test(href)) return href
  const [path = '', hash] = href.split('#')
  const local = LOCAL[/** @type {keyof typeof LOCAL} */ (path.replace(/^\.\//, ''))]
  return local ? `${base}${local}${hash ? `#${hash}` : ''}` : new URL(href, REPO).href
}

/**
 * Sätteri (Astro's Markdown processor) mdast plugin.
 * @param {string} base
 */
export function docLinks(base) {
  return {
    name: 'pulse-doc-links',
    /** @param {{ url: string }} node @param {any} ctx */
    link(node, ctx) {
      const url = rewriteDocHref(node.url, base)
      if (url !== node.url) ctx.setProperty(node, 'url', url)
    },
  }
}
