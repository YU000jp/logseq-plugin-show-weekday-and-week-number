import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin.user"

export const advancedQuery = async (query: string, ...input: Array<string>): Promise<any | null> => {
  try {
    return (await logseq.DB.datascriptQuery(query, ...input) as any)?.flat()
  } catch (err: any) {
    console.warn(err)
  }
  return null
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


export const queryCodeGetJournalDayFromOriginalName = `
  [:find (pull ?b [:block/journal-day])
          :in $ ?name
          :where
          [?b :block/original-name ?name]
          [?b :block/journal-day ?day]] 
  `

export const queryCodeGetFileFromOriginalName = `
  [:find (pull ?b [:block/file])
          :in $ ?name
          :where
          [?b :block/original-name ?name]
          [?b :block/file ?file]] 
  `

export const queryCodeGetUuidFromOriginalName = `
  [:find (pull ?b [:block/uuid])
          :in $ ?name
          :where
          [?b :block/original-name ?name]
          [?b :block/uuid ?uuid]]
  `


// ページが存在するかどうか
export const isPageExist = async (pageName: string): Promise<boolean> => {
  const pageEntities = await advancedQuery(queryCodeGetUuidFromOriginalName, `"${pageName}"`) as { uuid: PageEntity["uuid"] }[] | null
  if (pageEntities && pageEntities.length > 0)
    if (pageEntities[0].uuid)
      return true
    else
      return false
  else
    return false
}

// ページファイルが存在するかどうか
export const isPageFileExist = async (pageName: string): Promise<boolean> => {
  const pageEntities = await advancedQuery(queryCodeGetFileFromOriginalName, `"${pageName}"`) as { file: PageEntity["file"] }[] | null
  if (pageEntities && pageEntities.length > 0)
    if (pageEntities[0].file)
      return true
    else
      return false
  else
    return false
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
  const result = await advancedQuery(query, ":current-page")
  return result?.[0] || null
}