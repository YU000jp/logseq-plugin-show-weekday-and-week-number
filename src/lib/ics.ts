export type IcsEvent = {
  uid?: string
  dateIso: string // yyyy-MM-dd
  date: Date
  start?: Date
  end?: Date
  isAllDay?: boolean
  summary: string
  description?: string
  location?: string
  url?: string
  organizer?: string
  status?: string
  sourceUrl?: string
  isTodo?: boolean
}

let mergedEvents: IcsEvent[] = []
let lastFetch = 0
let intervalId: number | null = null
let inflightPromise: Promise<IcsEvent[]> | null = null

const normalizeDateIso = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const parseDateFromDt = (v: string): { date: Date; isAllDay: boolean } | null => {
  // If value is a plain date YYYYMMDD (all-day), treat as local date (no timezone shift)
  if (/^\d{8}$/.test(v)) {
    const s = v
    const y = Number(s.slice(0, 4))
    const mo = Number(s.slice(4, 6)) - 1
    const d = Number(s.slice(6, 8))
    return { date: new Date(y, mo, d), isAllDay: true }
  }
  // Otherwise try to parse as ISO/datetime (handles TZ or Z)
  const dt = new Date(v)
  if (!isNaN(dt.getTime())) return { date: dt, isAllDay: false }
  // fallback: try to find an 8-digit date inside the string and treat as local
  const m = v.match(/(\d{8})/)
  if (m) {
    const s = m[1]
    const y = Number(s.slice(0, 4))
    const mo = Number(s.slice(4, 6)) - 1
    const d = Number(s.slice(6, 8))
    return { date: new Date(y, mo, d), isAllDay: true }
  }
  return null
}

const unescapeIcsText = (v?: string) => {
  if (!v) return v
  return String(v)
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
}

const parseIcsText = (text: string, sourceUrl?: string) => {
  const lines = text.replace(/\r\n/g, "\n").split(/\n(?![ \t])/)
  // simple fold handling: join lines starting with space
  const unfolded = lines
    .map((l) => l.replace(/\n[ \t]+/g, ""))
    .join("\n")
    .split("\n")

  const out: IcsEvent[] = []
  let inComponent: string | null = null
  let cur: any = {}
  for (const raw of unfolded) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith("BEGIN:")) {
      inComponent = line.slice(6)
      cur = {}
      continue
    }
    if (line.startsWith("END:")) {
      const closing = line.slice(4)
      if (closing === "VEVENT" || closing === "VTODO") {
        const startRaw = cur.DTSTART || cur.DUE
        const endRaw = cur.DTEND
        if (startRaw && cur.SUMMARY) {
          const startParsed = parseDateFromDt(startRaw)
          const endParsed = endRaw ? parseDateFromDt(endRaw) : null
          if (startParsed) {
            const dt = startParsed.date
            const ev: IcsEvent = {
              uid: cur.UID,
              date: dt,
              dateIso: normalizeDateIso(dt),
              start: startParsed.date,
              end: endParsed?.date,
              isAllDay: startParsed.isAllDay,
              summary: cur.SUMMARY || "(no summary)",
              description: unescapeIcsText(cur.DESCRIPTION),
              location: unescapeIcsText(cur.LOCATION),
              url: unescapeIcsText(cur.URL),
              organizer: unescapeIcsText(cur.ORGANIZER),
              status: unescapeIcsText(cur.STATUS),
              sourceUrl,
              isTodo: closing === "VTODO",
            }
            out.push(ev)
          }
        }
      }
      inComponent = null
      cur = {}
      continue
    }
    // key:value
    const idx = line.indexOf(":")
    if (idx > 0) {
      const key = line.slice(0, idx)
      const val = line.slice(idx + 1)
      // ignore parameters like DTSTART;VALUE=DATE:20240101
      const k = key.split(";")[0]
      cur[k] = (cur[k] ? cur[k] + "\n" : "") + val
    }
  }
  return out
}

export const loadIcsOnce = async (urls: string[], options?: { force?: boolean; minAgeMs?: number }) => {
  const force = !!options?.force
  const minAgeMs = options?.minAgeMs ?? 0
  // return cached if fresh and not forced
  if (!force && lastFetch > 0 && Date.now() - lastFetch < minAgeMs && mergedEvents.length > 0) {
    return mergedEvents
  }
  // deduplicate concurrent fetches
  if (inflightPromise) return inflightPromise
  inflightPromise = (async () => {
    const results: IcsEvent[] = []
    for (const u of urls) {
      const url = u.trim()
      if (!url) continue
      try {
        const res = await fetch(url)
        if (!res.ok) continue
        const text = await res.text()
        const parsed = parseIcsText(text, url)
        results.push(...parsed)
      } catch (e) {
        // ignore fetch errors per-feed
      }
    }
    // replace mergedEvents
    mergedEvents = results
    lastFetch = Date.now()
    inflightPromise = null
    return mergedEvents
  })()
  return inflightPromise
}

export const getIcsEventsForDate = (d: Date) => {
  const k = normalizeDateIso(d)
  return mergedEvents.filter((e) => e.dateIso === k)
}

export const getAllIcsEvents = () => mergedEvents.slice()

export const startIcsSync = (urls: string[], intervalMinutes = 60, onUpdated?: (events: IcsEvent[]) => void) => {
  // do immediate load then schedule
  loadIcsOnce(urls).then((ev) => onUpdated?.(ev)).catch(() => {})
  try {
    if (intervalId) window.clearInterval(intervalId)
  } catch (e) {}
  intervalId = window.setInterval(async () => {
    try {
      const ev = await loadIcsOnce(urls)
      onUpdated?.(ev)
    } catch (e) {}
  }, Math.max(1, intervalMinutes) * 60 * 1000)
}

export const stopIcsSync = () => {
  try {
    if (intervalId) {
      window.clearInterval(intervalId)
      intervalId = null
    }
  } catch (e) {}
}
