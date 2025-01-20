
export const advancedQuery = async (query: string, ...input: Array<string>): Promise<any | null> => {
  try {
    return (await logseq.DB.datascriptQuery(query, ...input) as any)?.flat()
  } catch (err: any) {
    console.warn(err)
  }
  return null
}

export const queryCodeJournalDayFromOriginalName = `
  [:find (pull ?b [:block/journal-day])
          :in $ ?name
          :where
          [?b :block/original-name ?name]
          [?b :block/journal-day ?day]] 
  `
  export const queryCodeFileFromOriginalName = `
  [:find (pull ?b [:block/file])
          :in $ ?name
          :where
          [?b :block/original-name ?name]
          [?b :block/file ?file]] 
  `
