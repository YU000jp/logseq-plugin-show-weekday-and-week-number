import { startOfYear } from 'date-fns' //https://date-fns.org/
import { t } from 'logseq-l10n'
import { refreshCalendar } from '../calendar/left-calendar'
import { yearlyJournalCreateNav } from './nav'
import { processJournal } from './utils'
import { callMiniCalendar } from './weeklyJournal'
let processingYearlyJournal: boolean = false

export const currentPageIsYearlyJournal = async (titleElement: HTMLElement, match: RegExpMatchArray) => {
      const year = Number(match[1]) //2023 

      //プロセスロック
      if (processingYearlyJournal === true
            || (titleElement.dataset!.yearlyJournalChecked as string) === year.toString())
            return//一度だけ処理を行う

      processingYearlyJournal = true//処理中フラグを立てる ここからreturnする場合は必ずfalseにすること
      setTimeout(() => processingYearlyJournal = false, 100)
      titleElement.dataset.yearlyJournalChecked = year.toString() //処理済みフラグを立てる

      const monthStartDay = startOfYear(new Date(year, 0, 1)) //月初の日付

      //Journal Boundariesを表示する
      callMiniCalendar(logseq.settings!.booleanBoundariesOnMonthlyJournal as boolean, monthStartDay)

      //Left Calendarの更新
      refreshCalendar(monthStartDay, false, false)

      if (logseq.settings!.booleanYearlyJournal === false) return

      await yearlyJournalCreateNav(year)

      await processJournal(match[0], logseq.settings!.yearlyJournalTemplateName as string, t("Yearly journal created"))

      processingYearlyJournal = false
}// end of currentPageIsYearlyJournal


