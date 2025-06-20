import { getJournalTitleSelector } from "./index"
import { validateJournalTitle } from "./validateJournalTitle"

// クエリーセレクターでタイトルを取得する
let processingTitleQuery: boolean = false
// Journal Titlesが変化したときに実行

export const fetchJournalTitles = async (enable: boolean): Promise<void> => {
  if (processingTitleQuery) return
  processingTitleQuery = true
  try {
    setTimeout(() => processingTitleQuery = false, 300) //boundaries 実行ロックの解除

    // モデル・DBグラフ種別に応じたセレクターを取得
    const selector = getJournalTitleSelector()

    parent.document.body.querySelectorAll(selector)
      .forEach(async (titleElement) => await validateJournalTitle(titleElement as HTMLElement))
  } finally {
    processingTitleQuery = false // 確実にフラグを解除
  }
}
