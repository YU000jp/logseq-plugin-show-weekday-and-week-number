import { startOfMonth } from 'date-fns' //https://date-fns.org/
import { t } from 'logseq-l10n'
import { refreshCalendar } from '../calendar/left-calendar'
import { quarterlyJournalCreateNav } from './nav'
import { processJournal } from './utils'
import { callMiniCalendar } from './weeklyJournal'
let processingQuarterlyJournal: boolean = false

export const currentPageIsQuarterlyJournal = async (titleElement: HTMLElement, match: RegExpMatchArray) => {
      //yyyy-Wwwのページを開いた状態
      const year = Number(match[1]) //2023
      const quarterly = Number(match[2]) //Q1
      const month = quarterly * 3 - 2 //1月

      //プロセスロック
      if (processingQuarterlyJournal === true
            || (titleElement.dataset!.quarterlyJournalChecked as string) === year + "/" + month)
            return//一度だけ処理を行う

      processingQuarterlyJournal = true//処理中フラグを立てる ここからreturnする場合は必ずfalseにすること
      setTimeout(() => processingQuarterlyJournal = false, 100)
      titleElement.dataset.quarterlyJournalChecked = year + "/" + month //処理済みのマーク

      const monthStartDay = startOfMonth(new Date(year, month - 1, 1)) //月初の日付

      //Journal Boundariesを表示する
      callMiniCalendar(logseq.settings!.booleanBoundariesOnQuarterlyJournal as boolean, monthStartDay)

      //Left Calendarの更新
      refreshCalendar(monthStartDay, false, false)

      if (logseq.settings!.booleanQuarterlyJournal === false) return

      await quarterlyJournalCreateNav(year, quarterly)

      await processJournal(match[0], logseq.settings!.quarterlyJournalTemplateName as string, t("Quarterly journal created"))

      processingQuarterlyJournal = false
}// end of currentPageIsQuarterlyJournal
