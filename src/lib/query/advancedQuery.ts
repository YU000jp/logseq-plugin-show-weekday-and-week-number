import { PageEntity } from "@logseq/libs/dist/LSPlugin.user"

export const advancedQuery = async <T>(query: string, ...input: Array<string>): Promise<T | null> => {
  try {
    const result = await logseq.DB.datascriptQuery(query, ...input)
    return result?.flat() as T
  } catch (err) {
    console.warn("Query execution failed:", err)
    return null
  }
}

export const getPageBlocks = async (pageName: string): Promise<{ uuid: PageEntity["uuid"] }[] | null> => {
  const query = `
    [:find (pull ?b [:block/uuid])
     :in $ ?name
     :where
   (or
     [?p :block/original-name ?name]
     [?p :block/title ?name])
     [?b :block/page ?p]
     [?b :block/uuid ?uuid]]
  `
  return await advancedQuery(query, `"${pageName}"`)
}

const createBaseQuery = (field: string): string => `
  [:find (pull ?b [:block/${field}])
   :in $ ?name
   :where
   (or
     [?b :block/original-name ?name]
     [?b :block/title ?name])
   [?b :block/${field} ?${field}]] 
`

export const queryCodeGetJournalDayFromOriginalName = createBaseQuery("journal-day")
export const queryCodeGetFileFromOriginalName = createBaseQuery("file")
export const queryCodeGetUuidFromOriginalName = createBaseQuery("uuid")

export const findPageUuid = async (pageName: string): Promise<PageEntity["uuid"] | false> => {
  const result = await advancedQuery<{ uuid: PageEntity["uuid"] }[]>(queryCodeGetUuidFromOriginalName, `"${pageName}"`)
  return result?.[0]?.uuid ?? false
}

// DB graph: a weekly journal is a page titled "Wnn" whose parent is the year page (e.g. Library > 2026 > W42)
export const parseWeeklyPageName = (pageName: string): { year: string, week: string } | null => {
  const match = pageName.match(/^(\d{4})[\/-](?:[qQ]\d[\/-])?[wW](\d{2})$/)
  return match ? { year: match[1], week: `W${match[2]}` } : null
}

export const findDbWeeklyPageUuid = async (year: string, week: string): Promise<PageEntity["uuid"] | false> => {
  const query = `
    [:find (pull ?p [:block/uuid])
     :in $ ?week ?year
     :where
     [?p :block/title ?week]
     [?p :block/name]
     [?p :block/parent ?y]
     [?y :block/title ?year]]
  `
  const result = await advancedQuery<{ uuid: PageEntity["uuid"] }[]>(query, `"${week}"`, `"${year}"`)
  return result?.[0]?.uuid ?? false
}

// DB graph: returns the year when the current page's parent is a year page ("2026"), otherwise null
export const getCurrentPageParentYear = async (): Promise<string | null> => {
  type Entity = { id?: number, uuid?: string, title?: string, originalName?: string, name?: string, parent?: { id?: number } } | null
  const isYear = (value: unknown): value is string => typeof value === "string" && /^\d{4}$/.test(value)
  // const debug: string[] = []

  // 1. Ask the plugin API for the current page; 2. fall back to the page uuid in the route (#/page/<uuid>)
  let current = await logseq.Editor.getCurrentPage() as Entity
  // debug.push(`getCurrentPage keys=${current ? Object.keys(current).join(",") : "null"}`)
  if (!current?.id) {
    const routeUuid = parent.location.hash.match(/\/page\/([0-9a-fA-F-]{36})/)?.[1]
    // debug.push(`routeUuid=${routeUuid ?? "none"} hash=${parent.location.hash.slice(0, 60)}`)
    if (routeUuid) {
      current = await logseq.Editor.getPage(routeUuid) as Entity
      // debug.push(`getPage keys=${current ? Object.keys(current).join(",") : "null"}`)
    }
  }

  // A. The entity may already carry its parent
  if (current?.parent?.id) {
    const parentPage = await logseq.Editor.getPage(current.parent.id) as Entity
    const parentTitle = parentPage?.title ?? parentPage?.originalName ?? parentPage?.name
    // debug.push(`parent via entity=${parentTitle}`)
    if (isYear(parentTitle)) return parentTitle
  }

  // B. Query the parent by entity id
  if (current?.id) {
    const query = `
      [:find (pull ?y [:block/title])
       :in $ ?p
       :where
       [?p :block/parent ?y]]
    `
    const result = await advancedQuery<{ title?: string }[]>(query, String(current.id))
    // debug.push(`parent via query=${JSON.stringify(result)}`)
    const parentTitle = result?.[0]?.title
    if (isYear(parentTitle)) return parentTitle
  }

  // console.warn("getCurrentPageParentYear failed:", debug)
  return null
}

export const doesPageFileExist = async (pageName: string): Promise<boolean> => {
  const result = await advancedQuery<{ file: PageEntity["file"] }[]>(queryCodeGetFileFromOriginalName, `"${pageName}"`)
  return !!result?.[0]?.file
}

export const getCurrentPageExist = async (): Promise<boolean> => {
  const query = `
    [:find (pull ?p [:block/uuid])
     :in $ ?current
     :where
   (or
     [?p :block/name ?name]
     [?p :block/title ?name])
     [(= ?name ?current)]
     [?p :block/uuid ?uuid]]
  `
  const result = await advancedQuery<{ uuid: PageEntity["uuid"] }[]>(query, ":current-page")
  return !!result?.[0]
}

export const getCurrentPageOriginalName = async (): Promise<PageEntity["original-name"] | string | null> => {
  const query = `
    [:find (pull ?p [:block/original-name :block/title])
     :in $ ?current
     :where
   (or
     [?p :block/name ?name]
     [?p :block/title ?name])
     [(= ?name ?current)]
     [?p :block/original-name ?original-name]]
  `
  const result = await advancedQuery<{ originalName: PageEntity["original-name"] }[]>(query, ":current-page")
  return result?.[0]?.["original-name"] ?? null
}


export const getCurrentPageJournalDay = async (): Promise<PageEntity["journalDay"] | null> => {
  const query = `
    [:find (pull ?p [:block/journal-day])
     :in $ ?current
     :where
  (or
     [?p :block/name ?name]
     [?p :block/title ?name])
     [(= ?name ?current)]
     [?p :block/journal-day ?journal]]
  `
  const result = await advancedQuery<{ "journal-day": PageEntity["journalDay"] }[]>(query, ":current-page")
  return result?.[0]?.["journal-day"] ?? null
}

export const getCurrentPageUuid = async (): Promise<PageEntity["uuid"] | null> => {
  const query = `
    [:find (pull ?p [:block/uuid])
     :in $ ?current
     :where
   (or
     [?p :block/name ?name]
     [?p :block/title ?name])
     [(= ?name ?current)]
     [?p :block/uuid ?uuid]]
  `
  const result = await advancedQuery<{ uuid: PageEntity["uuid"] }[]>(query, ":current-page")
  return result?.[0]?.uuid ?? null
}

