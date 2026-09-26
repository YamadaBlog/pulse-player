const escape = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const KEYWORDS = /\b(import|from|export|function|return|const|let|class|new|default|true|false)\b/g
const MARK = '\u0001'

/**
 * A deliberately small highlighter for the snippets on this page. The
 * source is escaped *first*, so the returned HTML is safe to inject even
 * when a snippet contains user input (the playground's colour picker).
 */
export function highlight(source: string): string {
  const tokens: string[] = []
  const stash =
    (cls: string) =>
    (match: string): string =>
      `${MARK}${tokens.push(`<span class="tok-${cls}">${match}</span>`) - 1}${MARK}`

  let out = escape(source)
  out = out.replace(/&lt;!--[\s\S]*?--&gt;|\/\/[^\n]*/g, stash('comment'))
  out = out.replace(/'[^'\n]*'|"[^"\n]*"/g, stash('string'))
  out = out.replace(
    /(&lt;\/?)([\w-]+)/g,
    (_, open: string, tag: string) => `${open}${stash('tag')(tag)}`,
  )
  out = out.replace(
    /(\s)([:@]?[\w-]+)(?==)/g,
    (_, space: string, attr: string) => `${space}${stash('attr')(attr)}`,
  )
  out = out.replace(KEYWORDS, stash('keyword'))
  return out.replace(
    new RegExp(`${MARK}(\\d+)${MARK}`, 'g'),
    (_, i: string) => tokens[Number(i)] ?? '',
  )
}
