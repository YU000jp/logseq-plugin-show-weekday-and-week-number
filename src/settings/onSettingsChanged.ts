import { LSPluginBaseInfo, PageEntity } from "@logseq/libs/dist/LSPlugin.user"
import { invokeBoundaryHandler, fetchJournalTitles, getUserConfig } from ".."
import { removeTitleQuery } from "../dailyJournalDetails"
import { getHolidaysBundle, removeHolidaysBundle } from "../lib/holidays"
import { removeElementById, removeProvideStyle } from "../lib/lib"
import { keyThisWeekPopup, weeklyEmbed } from "../journals/weeklyJournal"
import { SettingKeys } from "./SettingKeys"
import { removeBoundaries } from "../calendar/boundaries"

let processingSettingsChanged: boolean = false
let processingRenamePage: boolean = false

export const isEssentialSettingsAltered = (oldSet: LSPluginBaseInfo["settings"], newSet: LSPluginBaseInfo["settings"]): boolean => [
  SettingKeys.weekNumberFormat,
  SettingKeys.localizeOrEnglish,
  SettingKeys.holidaysCountry,
  SettingKeys.holidaysState,
  SettingKeys.holidaysRegion,
  SettingKeys.booleanLunarCalendar,
  SettingKeys.booleanUnderLunarCalendar,
  SettingKeys.choiceHolidaysColor,
  SettingKeys.booleanBoundariesIndicator,
  SettingKeys.boundariesWeekStart,
  SettingKeys.booleanWeekendsColor,
  SettingKeys.boundariesHighlightColorSinglePage,
  SettingKeys.boundariesHighlightColorToday,
  SettingKeys.userColorList,
  SettingKeys.choiceUserColor,
  SettingKeys.userWeekendMon,
  SettingKeys.userWeekendTue,
  SettingKeys.userWeekendWed,
  SettingKeys.userWeekendThu,
  SettingKeys.userWeekendFri,
  SettingKeys.userWeekendSat,
  SettingKeys.userWeekendSun,
  SettingKeys.weekNumberOptions
].some(key => oldSet[key] !== newSet[key])

// ユーザー設定が変更されたときに実行
export const handleSettingsUpdate = () => {
  logseq.onSettingsChanged((newSet: LSPluginBaseInfo["settings"], oldSet: LSPluginBaseInfo["settings"]) => {

    if ([
      SettingKeys.booleanBoundariesAll,
      SettingKeys.booleanBoundaries,
      SettingKeys.booleanJournalsBoundaries,
      SettingKeys.booleanBoundariesOnWeeklyJournal,
      SettingKeys.booleanWeeklyJournal,
      SettingKeys.boundariesBottom,
      SettingKeys.booleanBoundariesShowMonth,
      SettingKeys.booleanBoundariesShowWeekNumber,
      SettingKeys.booleanBoundariesHolidays,
      SettingKeys.booleanDayOfWeek,
      SettingKeys.longOrShort,
      SettingKeys.booleanWeekNumber,
      SettingKeys.weekNumberOfTheYearOrMonth,
      SettingKeys.booleanRelativeTime,
      SettingKeys.booleanSettingsButton,
      SettingKeys.booleanMonthlyJournalLink,
      SettingKeys.underHolidaysAlert,
      SettingKeys.booleanBesideJournalTitle,
      SettingKeys.weeklyEmbed,
      SettingKeys.weeklyJournalHeadlineProperty,
      SettingKeys.holidaysCountry,
      SettingKeys.holidaysState,
      SettingKeys.holidaysRegion,
      SettingKeys.weekNumberChangeQ,
      SettingKeys.weekNumberChangeQS,
      SettingKeys.weekNumberChangeRevert,
      SettingKeys.weekNumberChangeSlash,
      SettingKeys.booleanMonthlyJournal,
      SettingKeys.booleanQuarterlyJournal,
      SettingKeys.booleanYearlyJournal
    ].some(key => oldSet[key] !== newSet[key])) {
      const boundaryKeys = [
        SettingKeys.booleanBoundariesAll,
        SettingKeys.booleanBoundaries,
        SettingKeys.booleanJournalsBoundaries,
        SettingKeys.booleanBoundariesOnWeeklyJournal
      ]

      if (boundaryKeys.some(key => oldSet[key] !== newSet[key])) {
        if (boundaryKeys.some(key => oldSet[key] === true && newSet[key] === false)) {
          removeBoundaries()
        } else
          if (boundaryKeys.some(key => oldSet[key] === false && newSet[key] === true)) {
            ApplyBoundarySettingsOnChange(newSet)
          }
      }

      if ([
        SettingKeys.booleanWeeklyJournal,
        SettingKeys.boundariesBottom,
        SettingKeys.booleanBoundariesShowMonth,
        SettingKeys.booleanBoundariesShowWeekNumber,
        SettingKeys.booleanBoundariesHolidays
      ].some(key => oldSet[key] !== newSet[key]) || isEssentialSettingsAltered(oldSet, newSet)) {
        removeBoundaries()
        ApplyBoundarySettingsOnChange(newSet)
      }

      if ([
        SettingKeys.booleanDayOfWeek,
        SettingKeys.longOrShort,
        SettingKeys.booleanWeekNumber,
        SettingKeys.weekNumberOfTheYearOrMonth,
        SettingKeys.booleanRelativeTime,
        SettingKeys.booleanWeeklyJournal,
        SettingKeys.booleanWeekNumberHideYear,
        SettingKeys.booleanSettingsButton,
        SettingKeys.booleanMonthlyJournalLink,
        SettingKeys.underHolidaysAlert,
        SettingKeys.booleanBesideJournalTitle
      ].some(key => oldSet[key] !== newSet[key]) || isEssentialSettingsAltered(oldSet, newSet)) {
        removeTitleQuery()
        setTimeout(() => fetchJournalTitles(newSet.booleanBesideJournalTitle as boolean), 500)
      }

      if (oldSet.weeklyEmbed !== newSet.weeklyEmbed) {
        if (newSet.weeklyEmbed === true)
          weeklyEmbed()
        else
          removeProvideStyle(keyThisWeekPopup)
      }

      [{
        key: SettingKeys.weeklyJournalHeadlineProperty, action: () => {
          if (oldSet.weeklyJournalHeadlineProperty !== "" && newSet.weeklyJournalHeadlineProperty !== "") {
            logseq.Editor.renamePage(oldSet.weeklyJournalHeadlineProperty as string, newSet.weeklyJournalHeadlineProperty as string)
          }
        }
      },
      {
        key: SettingKeys.boundariesBottom, action: () => {
          if (newSet.boundariesBottom === true)
            parent.document.body.classList!.add("boundaries-bottom")
          else
            parent.document.body.classList!.remove("boundaries-bottom")
        }
      },
      {
        key: SettingKeys.booleanBoundariesHolidays, action: () => {
          if (newSet.booleanBoundariesHolidays === true || newSet.underHolidaysAlert === true)
            getHolidaysBundle(newSet.holidaysCountry as string, { settingsChanged: true })
          else
            if (newSet.booleanBoundariesHolidays === false && newSet.underHolidaysAlert === false)
              removeHolidaysBundle()
        }
      },
      {
        key: SettingKeys.underHolidaysAlert, action: () => {
          if (newSet.booleanBoundariesHolidays === true || newSet.underHolidaysAlert === true)
            getHolidaysBundle(newSet.holidaysCountry as string, { settingsChanged: true })
          else
            if (newSet.booleanBoundariesHolidays === false && newSet.underHolidaysAlert === false)
              removeHolidaysBundle()
        }
      },
      { key: SettingKeys.holidaysCountry, action: () => getHolidaysBundle(newSet.holidaysCountry as string, { settingsChanged: true }) },
      { key: SettingKeys.holidaysState, action: () => getHolidaysBundle(newSet.holidaysCountry as string, { settingsChanged: true }) },
      { key: SettingKeys.holidaysRegion, action: () => getHolidaysBundle(newSet.holidaysCountry as string, { settingsChanged: true }) },
      { key: SettingKeys.weekNumberChangeQ, action: () => convertWeekToQuarterFormat("-", false) },
      { key: SettingKeys.weekNumberChangeQS, action: () => convertWeekToQuarterFormat("/", false) },
      { key: SettingKeys.weekNumberChangeRevert, action: () => convertWeekToQuarterFormat("/", true) },
      { key: SettingKeys.weekNumberChangeSlash, action: () => convertWeekNumberToSlash() }
      ].forEach(({ key, action }) => {
        if (oldSet[key] !== newSet[key]) action()
      })

      const journalKeys = [
        SettingKeys.booleanWeeklyJournal,
        SettingKeys.booleanMonthlyJournal,
        SettingKeys.booleanQuarterlyJournal,
        SettingKeys.booleanYearlyJournal
      ]
      if (journalKeys.some(key => oldSet[key] === true && newSet[key] === false)) {
        journalKeys.forEach(key => {
          if (oldSet[key] === true && newSet[key] === false)
            removeElementById(`${key.replace('boolean', '').toLowerCase()}Nav`)
        })
      }
    }

    //CAUTION: 日付形式が変更された場合は、re-indexをおこなうので、問題ないが、言語設定が変更された場合は、その設定は、すぐには反映されない。プラグインの再読み込みが必要になるが、その頻度がかなり少ないので問題ない。
    if (processingSettingsChanged) return
    processingSettingsChanged = true
    getUserConfig()
    setTimeout(() => processingSettingsChanged === false, 1000)

  })
}  // end_onSettingsChanged

//Journal boundariesを表示する 設定変更時に実行
export const ApplyBoundarySettingsOnChange = (newSet: LSPluginBaseInfo["settings"]) => {
  if (newSet.booleanBoundariesAll === true)
    setTimeout(() => {
      if (newSet.booleanJournalsBoundaries === true
        && parent.document.getElementById("journals") as Node)
        invokeBoundaryHandler("journals")
      else
        if (newSet.booleanBoundaries === true
          && parent.document.body.querySelector("div#main-content-container div.is-journals.page>div.relative") as Node)
          invokeBoundaryHandler("is-journals")
        else
          if (newSet.booleanBoundariesOnWeeklyJournal === true
            && parent.document.body.querySelector("div#main-content-container div.page.relative>div.relative") as Node)
            invokeBoundaryHandler("weeklyJournal")
    },
      100)
}

// 年間のすべての週番号の配列を用意する
const buildWeekArray = () => Array.from({ length: 53 }, (_, i) => i + 1)

// 2022年から現在の年+1年までの週番号の配列を用意する
const buildYearArray = () => Array.from({ length: (new Date().getFullYear()) - 2022 + 2 }, (_, i) => (2022 + i).toString())

// 週番号のフォーマットを変更する - から/に変更する
const convertWeekNumberToSlash = () => {
  if (processingRenamePage) return
  processingRenamePage = true
  const weekList: number[] = buildWeekArray()
  const targetList: string[] = buildYearArray()
  for (const year of targetList)
    for (const week of weekList) {
      const weekNumber = week.toString().padStart(2, "0")
      logseq.Editor.getPage(`${year}-W${weekNumber}`).then((page: { uuid: PageEntity["uuid"] } | null) => {
        if (page) {
          logseq.Editor.renamePage(`${year}-W${weekNumber}`, `${year}/W${weekNumber}`)
          console.log(`Page ${year}-W${weekNumber} has been renamed to ${year}/W${weekNumber}.`)
        }
        else
          console.log(`Page ${year}-W${weekNumber} does not exist.`)
      })
    }
  logseq.UI.showMsg("Week number has been changed to the quarterly format.", "info", { timeout: 5000 })
  setTimeout(() => {
    processingRenamePage = false
    logseq.updateSettings({ weekNumberChangeSlash: false })
  }, 2000)
}

// 週番号のフォーマットを変更する 四半期との変換
const convertWeekToQuarterFormat = async (separateString: string, revert: boolean) => {
  if (processingRenamePage) return
  processingRenamePage = true

  const quarterIdentifiers = ["Q1", "Q2", "Q3", "Q4"]
  const weekNumberData = buildWeekArray()
  for (const year of buildYearArray())
    for (const week of weekNumberData) {
      const weekNumber = week.toString().padStart(2, "0")
      if (revert === true) {
        const weekNumberQuarter = quarterIdentifiers[Math.floor((week - 1) / 13)]
        logseq.Editor.getPage(`${year}/${weekNumberQuarter}/W${weekNumber}`).then((page: { uuid: PageEntity["uuid"] } | null) => {
          if (page) {
            logseq.Editor.renamePage(`${year}/${weekNumberQuarter}/W${weekNumber}`, `${year}${separateString}W${weekNumber}`)
            console.log(`Page ${year}/${weekNumberQuarter}/W${weekNumber} renamed to ${year}${separateString}W${weekNumber}.`)
          }
          else
            console.log(`Page ${year}/${weekNumberQuarter}/W${weekNumber} does not exist.`)
        })
      } else {
        logseq.Editor.getPage(`${year}${separateString}W${weekNumber}`).then((page: { uuid: PageEntity["uuid"] } | null) => {
          if (page) {
            //四半世紀を入れる
            const weekNumberQuarter = quarterIdentifiers[Math.floor((week - 1) / 13)]
            logseq.Editor.renamePage(`${year}${separateString}W${weekNumber}`, `${year}/${weekNumberQuarter}/W${weekNumber}`)
            console.log(`Page ${year}${separateString}W${weekNumber} renamed to ${year}/${weekNumberQuarter}/W${weekNumber}.`)
          }
          else
            console.log(`Page ${year}${separateString}W${weekNumber} does not exist.`)
        })
      }
    }
  logseq.UI.showMsg("Changed to the format", "info", { timeout: 5000 })
  setTimeout(() => {
    processingRenamePage = false
    logseq.updateSettings({ weekNumberChangeQ: false })
  }, 2000)
}
