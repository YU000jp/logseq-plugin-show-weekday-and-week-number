import { BlockEntity } from '@logseq/libs/dist/LSPlugin.user'
import { startOfMonth } from 'date-fns'; //https://date-fns.org/
import { t } from 'logseq-l10n'
import { refreshCalendar } from '../calendar/left-calendar'
import { monthlyJournalCreateNav } from './nav'
import { journalInsertTemplate } from './utils'
import { callMiniCalendar } from './weeklyJournal'


let processingMonthlyJournal: boolean = false
export const currentPageIsMonthlyJournal = async (titleElement: HTMLElement, match: RegExpMatchArray) => {

  //yyyy-Wwwのページを開いた状態
  const year = Number(match[1]) //2023
  const month = Number(match[2]) //01

  //プロセスロック
  if (processingMonthlyJournal === true
    || (titleElement.dataset!.monthlyJournalChecked as string) === year + "/" + month)
    return//一度だけ処理を行う

  processingMonthlyJournal = true//処理中フラグを立てる ここからreturnする場合は必ずfalseにすること
  setTimeout(() => processingMonthlyJournal = false, 100)
  titleElement.dataset.monthlyJournalChecked = year + "/" + month

  const monthStartDay = startOfMonth(new Date(year, month - 1, 1)) //月初の日付

  //Journal Boundariesを表示する
  callMiniCalendar(logseq.settings!.booleanBoundariesOnMonthlyJournal as boolean, monthStartDay)

  //Left Calendarの更新
  refreshCalendar(monthStartDay, false, false)

  if (logseq.settings!.booleanMonthlyJournal === false) return

  setTimeout(async () => {
    // ナビゲーションを作成する
    const boolean = await monthlyJournalCreateNav(monthStartDay, year)
    if (boolean === false)
      setTimeout(async () =>
        await monthlyJournalCreateNav(monthStartDay, year)                  //再度実行
        , 1200)
  }, 250)

  await processJournalPage(match[0], logseq.settings!.monthlyJournalTemplateName as string, t("Monthly journal created"))

  processingMonthlyJournal = false
}// end of currentPageIsMonthlyJournal


const processJournalPage = async (pageName: string, templateName: string, successMsg: string) => {
  const currentBlockTree = await logseq.Editor.getPageBlocksTree(pageName) as BlockEntity[] //現在開いているページ

  let firstUuid = "" //1行目のuuidを決める
  if (currentBlockTree) {
    //コンテンツがある場合は処理を中断する
    //block.contentが空ではないブロックがひとつでもあったら処理を中断する
    if (currentBlockTree.find((block) => block.content !== null)) return

    //currentBlockTree[0]!.uuidが存在しなかったら処理を中断する
    if (currentBlockTree[0]
      && currentBlockTree[0].uuid)
      firstUuid = currentBlockTree[0].uuid
    else {
      //ページを作成する
      const prepend = await logseq.Editor.prependBlockInPage(pageName, "", {}) as { uuid: BlockEntity["uuid"] } | null //先頭に空のブロックを追加する
      if (prepend)
        firstUuid = prepend.uuid //uuidを取得する
      else {
        console.log("utils.ts: prepend is null")
        return
      }
    }
    if (templateName !== "") {
      const newBlockEntity = await logseq.Editor.insertBlock(firstUuid, "", { isPageBlock: true, sibling: true, before: true }) as { uuid: BlockEntity["uuid"] }
      if (newBlockEntity)
        await journalInsertTemplate(newBlockEntity.uuid, templateName, successMsg)
    }
  }
}

