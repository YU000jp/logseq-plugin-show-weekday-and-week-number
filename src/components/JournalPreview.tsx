import React, { useEffect, useState } from "react"
import { escapeHtml, getRelativeDateString } from "../lib/lib"
import { findPageUuid } from "../lib/query/advancedQuery"
import { parse, isValid } from "date-fns"

const clamp = (s: string, n = 1000) => (s.length > n ? s.slice(0, n) + "…" : s)

const simpleRender = (blocks: Array<{ content?: string }>) => {
  if (!blocks || blocks.length === 0) return "<div style='color:var(--ls-ui-fg-muted)'>No content</div>"
  const lines = blocks
    .slice(0, 10)
    .map((b) => {
      const raw = b.content || ""
      // escape then convert simple Logseq syntaxes: [[Page]] -> link, #tag -> span
      let s = escapeHtml(raw)
      s = s.replace(/\[\[([^\]]+)\]\]/g, (m, p1) => `<a class='lc-jp-link' data-pagename='${escapeHtml(p1)}' href='#'>${escapeHtml(p1)}</a>`)
      s = s.replace(/(^|\s)#([\w\-\/]+)/g, (m, p1, p2) => `${p1}<span class='lc-jp-tag'>#${escapeHtml(p2)}</span>`)
      // simple markdown-like: #### -> heading
      s = s.replace(/^#{1,6}\s*(.*)$/gm, (m, p1) => `<strong>${p1}</strong>`)
      return `<div class='lc-jp-line'>${clamp(s, 800)}</div>`
    })
    .join("")
  return `<div class='lc-jp-root'>${lines}</div>`
}

export const useJournalPreview = (pageName?: string, preferredDateFormat?: string) => {
  const [html, setHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!pageName) return
    let mounted = true
    const run = async () => {
      setLoading(true)
      try {
        const uuid = await findPageUuid(pageName)
        if (!mounted) return
        if (!uuid) {
          setHtml(`<div style='color:var(--ls-ui-fg-muted)'>${escapeHtml(pageName)} not found</div>`)
          return
        }
        const tree = (await (window as any).logseq.Editor.getPageBlocksTree(uuid)) as Array<{ content?: string }> | null
        if (!mounted) return
        // build header with relative date when possible
        let header = ""
        try {
          if (preferredDateFormat) {
            const parsed = parse(pageName, preferredDateFormat, new Date())
            if (isValid(parsed)) {
              const rel = getRelativeDateString(parsed)
              header = `<div style='font-weight:600;margin-bottom:6px'>${escapeHtml(pageName)} <span style='color:var(--ls-ui-fg-muted);font-weight:400;margin-left:6px'>${escapeHtml(rel)}</span></div>`
            }
          }
        } catch (e) {
          header = ""
        }
        setHtml(header + simpleRender(tree || []))
      } catch (e) {
        setHtml(`<div style='color:var(--ls-error-color)'>Failed to load</div>`)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [pageName])
  return { html, loading }
}

export default function JournalPreview({ pageName }: { pageName?: string }) {
  const { html, loading } = useJournalPreview(pageName)
  return (
    <div style={{ minWidth: 220, maxWidth: 420 }}>
      {loading && <div style={{ color: "var(--ls-ui-fg-muted)" }}>Loading…</div>}
      {html && <div dangerouslySetInnerHTML={{ __html: html }} />}
    </div>
  )
}
