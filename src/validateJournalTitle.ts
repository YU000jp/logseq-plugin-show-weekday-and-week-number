import { PageEntity } from "@logseq/libs/dist/LSPlugin.user"
import { t } from "logseq-l10n"
import { refreshCalendarCheckSameMonth } from "./calendar/left-calendar"
import { dailyJournalDetails } from "./dailyJournalDetails"
import { currentPageIsMonthlyJournal } from "./journals/monthlyJournal"
import { currentPageIsQuarterlyJournal } from "./journals/quarterlyJournal"
import { currentPageIsWeeklyJournal } from "./journals/weeklyJournal"
import { currentPageIsYearlyJournal } from "./journals/yearlyJournal"
import { getDateFromJournalDay } from "./lib/lib"
import { advancedQuery, queryCodeGetJournalDayFromOriginalName } from "./lib/query/advancedQuery"

// Journal Titleの処理
let processingJournalTitlePage: Boolean = false
export const validateJournalTitle = async (titleElement: HTMLElement) => {
  if (!titleElement.textContent
    || processingJournalTitlePage === true
    || titleElement.nextElementSibling?.className === "showWeekday") return // check if element already has date info
  processingJournalTitlePage = true
  try {
    titleElement.dataset.checked = "true" //処理済みのマーク
    setTimeout(() => processingJournalTitlePage = false, 300) //boundaries 実行ロックの解除

    const title: string = titleElement.dataset.localize === "true" ?
      titleElement.dataset.ref || ""
      : titleElement.dataset.ref || titleElement.textContent

    if (title === "") return //タイトルが空の場合は処理を終了する



    //Weekly Journal、Monthly Journal、Quarterly Journal、Yearly Journalのページかどうか
    if (titleElement.classList.contains("journal-title") === false
      && titleElement.classList.contains("title") === true
      && title.match(/^(\d{4})/) !== null // titleの先頭が2024から始まる場合のみチェックする
    ) {
      let match: RegExpMatchArray | null = null
      if (match = await (() => {
        switch (logseq.settings!.weekNumberOptions) {
          case "YYYY-Www":
            return title.match(/^(\d{4})-[wW](\d{2})$/) // "YYYY-Www"
          case "YYYY/qqq/Www": // 2023/Q1/W01
            return title.match(/^(\d{4})\/[qQ]\d{1}\/[wW](\d{2})$/) // "YYYY/qqq/Www"
          default:
            return title.match(/^(\d{4})\/[wW](\d{2})$/) // "YYYY/Www"
        }
      })()) {
        currentPageIsWeeklyJournal(titleElement, match)
        titleElement.title = t("Weekly Journal")
      }
      else if (match = title.match(/^(\d{4})\/(\d{2})$/)) { // 2023/01
        currentPageIsMonthlyJournal(titleElement, match)
        titleElement.title = t("Monthly Journal")
      }
      else if (match = title.match(/^(\d{4})\/[qQ](\d{1})$/)) { // 2023/Q1
        currentPageIsQuarterlyJournal(titleElement, match)
        titleElement.title = t("Quarterly Journal")
      }
      else if (match = title.match(/^(\d{4})$/)) { // 2023
        currentPageIsYearlyJournal(titleElement, match)
        titleElement.title = t("Yearly Journal")
      } else {
        refreshCalendarCheckSameMonth()
      }
    } else {
      refreshCalendarCheckSameMonth()
    }

    if ((logseq.settings!.booleanBesideJournalTitle === false
      || (logseq.settings!.booleanBesideJournalTitle === true
        && ((logseq.settings!.booleanWeekNumber === false //設定項目ですべてのトグルがオフの場合
          && logseq.settings!.booleanDayOfWeek === false
          && logseq.settings!.booleanRelativeTime === false
          && logseq.settings!.underHolidaysAlert === false
          && logseq.settings!.booleanSettingsButton === false
          && logseq.settings!.booleanMonthlyJournalLink === false
          && logseq.settings!.booleanUnderLunarCalendar === false))))
      // titleElementのクラスにjournal-titleまたはtitleが含まれている場合
      && (titleElement.classList.contains("journal-title") === true
        || titleElement.classList.contains("title") === true))
      moveForPageTitleElement(titleElement) //titleElementの後ろにdateInfoElementを追加し、スペース確保しておく
    else {
      // Daily Journal Detailsの処理
      setTimeout(async () => {
        const pageEntities = await advancedQuery(queryCodeGetJournalDayFromOriginalName, `"${title}"`) as { "journal-day": PageEntity["journalDay"]} [] | null
        if (pageEntities && pageEntities.length > 0) {
          const journalDay = pageEntities[0]["journal-day"]
          if (journalDay)
            dailyJournalDetails(getDateFromJournalDay(String(journalDay)), titleElement)
        }
      }, 10)
    }

    processingJournalTitlePage = false //Journalsの場合は複数
  } finally {
    processingJournalTitlePage = false // 確実にフラグを解除
  }
}

const moveForPageTitleElement = (titleElement: HTMLElement) => {
  const dateInfoElement: HTMLSpanElement = document.createElement("span")
  dateInfoElement.classList.add("showWeekday")
  titleElement.insertAdjacentElement("afterend", dateInfoElement)
  const secondElement: HTMLSpanElement = document.createElement("span")
  secondElement.style.width = "50%"
  titleElement.parentElement!.insertAdjacentElement("afterend", secondElement)
}

