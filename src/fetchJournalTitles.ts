import { validateJournalTitle } from "./validateJournalTitle"

// クエリーセレクターでタイトルを取得する
let processingTitleQuery: boolean = false
// Journal Titlesが変化したときに実行

export const fetchJournalTitles = async (enable: boolean): Promise<void> => {
  if (processingTitleQuery) return
  processingTitleQuery = true
  try {
    setTimeout(() => processingTitleQuery = false, 300) //boundaries 実行ロックの解除

    //Journalsの場合は複数
    parent.document.body.querySelectorAll("#main-content-container div:is(.journal,.is-journals,.page) h1.title:not([data-checked])")
      .forEach(async (titleElement) => await validateJournalTitle(titleElement as HTMLElement))
  } finally {
    processingTitleQuery = false // 確実にフラグを解除
  }
}
