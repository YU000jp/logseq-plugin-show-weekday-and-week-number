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
     [?p :block/original-name ?name]
     [?b :block/page ?p]
     [?b :block/uuid ?uuid]]
  `
  return await advancedQuery(query, `"${pageName}"`)
}

const createBaseQuery = (field: string): string => `
  [:find (pull ?b [:block/${field}])
   :in $ ?name
   :where
   [?b :block/original-name ?name]
   [?b :block/${field} ?${field}]] 
`

export const queryCodeGetJournalDayFromOriginalName = createBaseQuery("journal-day")
export const queryCodeGetFileFromOriginalName = createBaseQuery("file")
export const queryCodeGetUuidFromOriginalName = createBaseQuery("uuid")

export const isPageExist = async (pageName: string): Promise<boolean> => {
  const result = await advancedQuery<{ uuid: PageEntity["uuid"] }[]>(queryCodeGetUuidFromOriginalName, `"${pageName}"`)
  return !!result?.[0]?.uuid
}

export const isPageExistGetUuid = async (pageName: string): Promise<PageEntity["uuid"] | null> => {
  const result = await advancedQuery<{ uuid: PageEntity["uuid"] }[]>(queryCodeGetUuidFromOriginalName, `"${pageName}"`)
  return result?.[0]?.uuid ?? null
}

export const isPageFileExist = async (pageName: string): Promise<boolean> => {
  const result = await advancedQuery<{ file: PageEntity["file"] }[]>(queryCodeGetFileFromOriginalName, `"${pageName}"`)
  return !!result?.[0]?.file
}

export const getCurrentPageExist = async (): Promise<boolean> => {
  const query = `
    [:find (pull ?p [:block/uuid])
     :in $ ?current
     :where
     [?p :block/name ?name]
     [(= ?name ?current)]
     [?p :block/uuid ?uuid]]
  `
  const result = await advancedQuery<{ uuid: PageEntity["uuid"] }[]>(query, ":current-page")
  return !!result?.[0]
}

export const getCurrentPageOriginalName = async (): Promise<PageEntity["original-name"] | null> => {
  const query = `
    [:find (pull ?p [:block/original-name])
     :in $ ?current
     :where
     [?p :block/name ?name]
     [(= ?name ?current)]
     [?p :block/original-name ?original-name]]
  `
  const result = await advancedQuery<{ originalName: PageEntity["original-name"] }[]>(query, ":current-page")
  return result?.[0]?.["original-name"] ?? null
}
