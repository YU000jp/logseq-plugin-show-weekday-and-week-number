import { LSPluginBaseInfo } from "@logseq/libs/dist/LSPlugin.user"
import { booleanDbGraph, booleanLogseqMdModel, getUserConfig } from ".."
import { fetchJournalTitles } from "../fetchJournalTitles"
import { invokeBoundaryHandler } from "../calendar/invokeBoundaryHandler"
import { removeBoundaries } from "../calendar/boundaries"
import { removeTitleQuery } from "../dailyJournalDetails"
import { keyThisWeekPopup, weeklyEmbed } from "../journals/weeklyJournal"
import { getHolidaysBundle, removeHolidaysBundle, findPageUuid, removeElementById, removeProvideStyle, startIcsSync, stopIcsSync, clearIcsEvents } from "../lib"
import { SettingKeys } from "./SettingKeys"
import { currentCalendarDate, keyLeftCalendarContainer, loadLeftCalendar, refreshMonthlyCalendar } from "../calendar/left-calendar"
import { settingsTemplate } from "./settings"

let processingSettingsChanged: boolean = false
let processingRenamePage: boolean = false

const isEssentialSettingsAltered = (oldSet: LSPluginBaseInfo["settings"], newSet: LSPluginBaseInfo["settings"]): boolean => [
  SettingKeys.weekNumberFormat,
  SettingKeys.localizeOrEnglish,
  SettingKeys.holidaysCountry,
  SettingKeys.holidaysState,
  SettingKeys.holidaysRegion,
  SettingKeys.booleanLunarCalendar,
  SettingKeys.booleanUnderLunarCalendar,
  SettingKeys.choiceHolidaysColor,
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

    // Ensure we can detect essential changes for potential forced refresh
    const _essentialNow = isEssentialSettingsAltered(oldSet, newSet)

    // プラグイン設定画面の更新が必要なケース
    if (newSet.booleanLeftCalendar != oldSet.booleanLeftCalendar
      || newSet.booleanMonthlyJournal != oldSet.booleanMonthlyJournal
      || newSet.booleanWeeklyJournal != oldSet.booleanWeeklyJournal
      || newSet.booleanQuarterlyJournal != oldSet.booleanQuarterlyJournal
      || newSet.booleanYearlyJournal != oldSet.booleanYearlyJournal
      || newSet.booleanBoundariesAll != oldSet.booleanBoundariesAll
    ) {
      logseq.hideSettingsUI()
      setTimeout(() => {
        logseq.useSettingsSchema(
          settingsTemplate(newSet, booleanDbGraph(), booleanLogseqMdModel(),
            newSet.holidaysCountry as string
          ))
        setTimeout(async () => {
          try { await (logseq.App as any).invokeExternalCommand("logseq.ui/toggle-settings") } catch (e) { /* ignore */ }
        }, 100)
      }, 10)
    }


    if (oldSet.booleanLeftCalendar !== newSet.booleanLeftCalendar) {
      if (newSet.booleanLeftCalendar === true)
        loadLeftCalendar(booleanDbGraph())//表示する
      else
        removeElementById(keyLeftCalendarContainer)//消す
    } else {
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
        } else if (journalKeys.some(key => oldSet[key] !== newSet[key])) {
          // If any journal visibility setting changed (either enabled or disabled),
          // re-apply boundary settings so the TwoLineCalendar reflects the change.
          removeBoundaries()
          ApplyBoundarySettingsOnChange(newSet)
        } else {
        const boundaryKeys = [
          SettingKeys.booleanBoundariesAll,
          SettingKeys.booleanBoundaries,
          SettingKeys.booleanJournalsBoundaries,
          SettingKeys.booleanBoundariesOnWeeklyJournal,
          SettingKeys.booleanBoundariesOnMonthlyJournal
        ]
        if (boundaryKeys.some(key => oldSet[key] !== newSet[key])) {
          if (boundaryKeys.some(key => oldSet[key] === true && newSet[key] === false)) {
            removeBoundaries()
          } else
            if (boundaryKeys.some(key => oldSet[key] === false && newSet[key] === true)) {
              ApplyBoundarySettingsOnChange(newSet)
            }
        } else
          if (oldSet.weeklyEmbed !== newSet.weeklyEmbed) {
            if (newSet.weeklyEmbed === true)
              weeklyEmbed()
            else
              removeProvideStyle(keyThisWeekPopup)
          } else {

            const isEssential: boolean = isEssentialSettingsAltered(oldSet, newSet)

            if (isEssential === true //共通処理
              || oldSet.booleanLcWeekNumber !== newSet.booleanLcWeekNumber
              || oldSet.booleanLcHolidays !== newSet.booleanLcHolidays
              || oldSet.lcHolidaysAlert !== newSet.lcHolidaysAlert
              || oldSet.booleanLcHidePastEvents !== newSet.booleanLcHidePastEvents
              || oldSet.booleanLcAutoCollapsePastEvents !== newSet.booleanLcAutoCollapsePastEvents
            )
              refreshMonthlyCalendar(currentCalendarDate, false, false)

            // Boundaries Calendar の再表示
            if (isEssential === true || [
              SettingKeys.boundariesBottom,
              // Month and week-number settings removed; always shown
              SettingKeys.booleanBoundariesHolidays
            ].some(key => oldSet[key] !== newSet[key])) {
              removeBoundaries()
              ApplyBoundarySettingsOnChange(newSet)
            }

            // ジャーナルタイトル横 の再表示
            if (isEssential === true || [
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
              SettingKeys.booleanBesideJournalTitle,
              // Daily journal details: event list visibility toggles
              SettingKeys.booleanShowIcsEvents,
              SettingKeys.booleanShowUserEvents
            ].some(key => oldSet[key] !== newSet[key])) {
              removeTitleQuery()
              setTimeout(() => fetchJournalTitles(newSet.booleanBesideJournalTitle as boolean), 500)
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
            { key: SettingKeys.weekNumberChangeQ, action: () => convertWeekToQuarterFormat("-", false, "/") },
            { key: SettingKeys.weekNumberChangeQS, action: () => convertWeekToQuarterFormat("/", false, "/") },
            { key: SettingKeys.weekNumberChangeRevert, action: () => convertWeekToQuarterFormat("/", true, "/") },
            { key: SettingKeys.weekNumberChangeSlash, action: () => convertWeekNumberToSlash() },
            { key: SettingKeys.weekNumberChangeFRevertToISO, action: () => convertWeekToQuarterFormat("-", true, "-") },
            { key: SettingKeys.weekNumberChangeToQfull, action: () => convertWeekToQuarterFormat("-", false, "-") },
            ].forEach(({ key, action }) => {
              if (oldSet[key] !== newSet[key]) action()
            })
          }
      }

      //CAUTION: 日付形式が変更された場合は、re-indexをおこなうので、問題ないが、言語設定が変更された場合は、その設定は、すぐには反映されない。プラグインの再読み込みが必要になるが、その頻度がかなり少ないので問題ない。

    // ICS settings changes: restart/stop sync and refresh calendars + event list.
    // This keeps: left monthly calendar (cells + alerts), TwoLineCalendar (boundaries), and journal details in sync.
    try {
      const urlsChanged = oldSet[SettingKeys.lcIcsUrls] !== newSet[SettingKeys.lcIcsUrls]
      const intervalChanged = oldSet[SettingKeys.lcIcsSyncInterval] !== newSet[SettingKeys.lcIcsSyncInterval]
      const showIcsChanged = oldSet[SettingKeys.booleanShowIcsEvents] !== newSet[SettingKeys.booleanShowIcsEvents]

      if (urlsChanged || intervalChanged || showIcsChanged) {
        const raw = (newSet[SettingKeys.lcIcsUrls] as string) || ""
        const urls = String(raw || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean)
        const interval = Number((newSet[SettingKeys.lcIcsSyncInterval] as any) ?? 60)

        if (urls.length === 0) {
          try { stopIcsSync() } catch (e) { /* ignore */ }
          try { clearIcsEvents() } catch (e) { /* ignore */ }
        } else {
          // Start (or re-start) sync so caches update even when left calendar is disabled.
          try { startIcsSync(urls, isFinite(interval) ? interval : 60) } catch (e) { /* ignore */ }
        }

        // Refresh left calendar if it exists/was initialized (updates cell highlights + alerts list)
        try {
          const leftInitialized = (parent as any).__leftCalendarInitialized || (window as any).__leftCalendarInitialized
          if (newSet.booleanLeftCalendar === true || leftInitialized) {
            setTimeout(() => refreshMonthlyCalendar(currentCalendarDate, false, false), 50)
          }
        } catch (e) { /* ignore */ }

        // Refresh boundaries calendars (TwoLineCalendar) if currently shown
        try {
          const weekBoundaries = parent.document.getElementById("weekBoundaries") as HTMLDivElement | null
          if (weekBoundaries) {
            removeBoundaries()
            ApplyBoundarySettingsOnChange(newSet)
          }
        } catch (e) { /* ignore */ }

        // Refresh journal details line to reflect show/hide (and updated cached events)
        try {
          removeTitleQuery()
          setTimeout(() => fetchJournalTitles(newSet.booleanBesideJournalTitle as boolean), 500)
        } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }

    // Additionally, ensure left calendar refresh runs for essential setting changes
    // even if earlier branches didn't call refreshMonthlyCalendar (defensive).
    try {
      if (_essentialNow === true || oldSet.userColorList !== newSet.userColorList || oldSet.choiceUserColor !== newSet.choiceUserColor) {
        // Only refresh if left calendar is visible or previously initialized
        const leftInitialized = (parent as any).__leftCalendarInitialized || (window as any).__leftCalendarInitialized
        if (newSet.booleanLeftCalendar === true || leftInitialized) {
          setTimeout(() => refreshMonthlyCalendar(currentCalendarDate, false, false), 50)
        }
      }
    } catch (e) { /* ignore */ }

    if (processingSettingsChanged) return
      processingSettingsChanged = true
      getUserConfig()
      // reset processing flag after a short debounce so repeated setting changes are handled
      setTimeout(() => { processingSettingsChanged = false }, 1000)

    }
  })
}  // end_onSettingsChanged

//Journal boundariesを表示する 設定変更時に実行
const ApplyBoundarySettingsOnChange = (newSet: LSPluginBaseInfo["settings"]) => {
  if (newSet.booleanBoundariesAll === true)
    setTimeout(() => {
      if (newSet.booleanJournalsBoundaries === true
        && parent.document.getElementById("journals") as Node)
        invokeBoundaryHandler("journals")
      else
        if (newSet.booleanBoundaries === true
          && parent.document.body.querySelector("#main-content-container div.is-journals.page>div.relative") as Node)
          invokeBoundaryHandler("is-journals")
        else
          if (newSet.booleanBoundariesOnWeeklyJournal === true
            && parent.document.body.querySelector("#main-content-container div.page.relative>div.relative") as Node)
            invokeBoundaryHandler("weeklyJournal")
          else
            if (newSet.booleanBoundariesOnMonthlyJournal === true
              && parent.document.body.querySelector("#main-content-container div.page.relative>div.relative") as Node)
              invokeBoundaryHandler("weeklyJournal")
    },
      100)
}

// 年間のすべての週番号の配列を用意する
const buildWeekArray = () => Array.from({ length: 53 }, (_, i) => i + 1)

// 2022年から現在の年+1年までの週番号の配列を用意する
const buildYearArray = () => Array.from({ length: (new Date().getFullYear()) - 2022 + 2 }, (_, i) => (2022 + i).toString())

// 週番号のフォーマットを変更する - から/に変更する
const convertWeekNumberToSlash = async () => {
  if (processingRenamePage) return
  processingRenamePage = true
  const weekList: number[] = buildWeekArray()
  const targetList: string[] = buildYearArray()
  for (const year of targetList)
    for (const week of weekList) {
      const weekNumber = week.toString().padStart(2, "0")
      const pageName = `${year}-W${weekNumber}`
      if (await findPageUuid(pageName)) {
        logseq.Editor.renamePage(pageName, `${year}/W${weekNumber}`)
        console.log(`Page ${year}-W${weekNumber} has been renamed to ${year}/W${weekNumber}.`)
      }
      else
        console.log(`Page ${year}-W${weekNumber} does not exist.`)
    }
  logseq.UI.showMsg("Week number has been changed to the quarterly format.", "info", { timeout: 5000 })
  setTimeout(() => {
    processingRenamePage = false
    logseq.updateSettings({ weekNumberChangeSlash: false })
  }, 2000)
}

// 週番号のフォーマットを変更する 四半期との変換
const convertWeekToQuarterFormat = async (newSeparate: "/" | "-", revert: boolean, oldSeparate: "/" | "-") => {
  if (processingRenamePage) return
  processingRenamePage = true

  const quarterIdentifiers = ["Q1", "Q2", "Q3", "Q4"]
  const weekNumberData = buildWeekArray()
  for (const year of buildYearArray())
    for (const week of weekNumberData) {
      const weekNumber = week.toString().padStart(2, "0")
      if (revert === true) {
        const weekNumberQuarter = quarterIdentifiers[Math.floor((week - 1) / 13)]
        const pageName = `${year}${oldSeparate}${weekNumberQuarter}${oldSeparate}W${weekNumber}`
        if (await findPageUuid(pageName)) {
          logseq.Editor.renamePage(pageName, `${year}${newSeparate}W${weekNumber}`)
          console.log(`Page ${pageName} renamed to ${year}${newSeparate}W${weekNumber}.`)
        }
        else
          console.log(`Page ${pageName} does not exist.`)
      } else {
        const pageName = `${year}${newSeparate}W${weekNumber}`
        if (await findPageUuid(pageName)) {
          //四半世紀を入れる
          const weekNumberQuarter = quarterIdentifiers[Math.floor((week - 1) / 13)]
          logseq.Editor.renamePage(pageName, `${year}${oldSeparate}${weekNumberQuarter}${oldSeparate}W${weekNumber}`)
          console.log(`Page ${pageName} renamed to ${year}${oldSeparate}${weekNumberQuarter}${oldSeparate}W${weekNumber}.`)
        }
        else
          console.log(`Page ${pageName} does not exist.`)
      }
    }
  logseq.UI.showMsg("Changed to the format", "info", { timeout: 5000 })
  setTimeout(() => {
    processingRenamePage = false
    logseq.updateSettings({ weekNumberChangeQ: false })
  }, 2000)
}
