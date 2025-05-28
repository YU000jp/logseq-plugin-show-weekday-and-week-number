import "@logseq/libs" //https://plugins-doc.logseq.com/
import { PageEntity } from "@logseq/libs/dist/LSPlugin.user"
import { setup as l10nSetup, t } from "logseq-l10n" //https://github.com/sethyuan/logseq-l10n
import { shortKey } from "./board/constant"
import { initializeBoard } from "./board/handle"
import { boundariesProcess, removeBoundaries } from "./calendar/boundaries"
import { keyLeftCalendarContainer, loadLeftCalendar, refreshCalendarCheckSameMonth } from "./calendar/left-calendar"
import { dailyJournalDetails, observer, observerMain, removeTitleQuery } from "./dailyJournalDetails"
import { currentPageIsMonthlyJournal } from "./journals/monthlyJournal"
import { currentPageIsQuarterlyJournal } from "./journals/quarterlyJournal"
import { currentPageIsWeeklyJournal, weeklyEmbed } from "./journals/weeklyJournal"
import { currentPageIsYearlyJournal } from "./journals/yearlyJournal"
import { getHolidaysBundle } from "./lib/holidays"
import { getDateFromJournalDay, removeAllElements, removeElementById } from "./lib/lib"
import { advancedQuery, getCurrentPageUuid, queryCodeGetJournalDayFromOriginalName } from "./lib/query/advancedQuery"
import fileMainCSS from "./main.css?inline"
import { mapLanguageCodeToCountry } from "./settings/languageCountry"
import { notice } from "./settings/notice"
import { handleSettingsUpdate } from "./settings/onSettingsChanged"
import { settingsTemplate } from "./settings/settings"
import { loadShortcutItems, } from "./shortcutItems"
import af from "./translations/af.json"
import de from "./translations/de.json"
import es from "./translations/es.json"
import fr from "./translations/fr.json"
import id from "./translations/id.json"
import it from "./translations/it.json"
import ja from "./translations/ja.json"
import ko from "./translations/ko.json"
import nbNO from "./translations/nb-NO.json"
import nl from "./translations/nl.json"
import pl from "./translations/pl.json"
import ptBR from "./translations/pt-BR.json"
import ptPT from "./translations/pt-PT.json"
import ru from "./translations/ru.json"
import sk from "./translations/sk.json"
import tr from "./translations/tr.json"
import uk from "./translations/uk.json"
import zhCN from "./translations/zh-CN.json"
import zhHant from "./translations/zh-Hant.json"

// プラグイン名(小文字タイプ)
export const pluginNameCut = "show-weekday-and-week-number"
// プラグイン名の最後に[plugin]を追加
export const pluginName = `${pluginNameCut} ${t("plugin")}`
// コンソールの署名用
export const consoleSignature = ` <----- [${pluginName}]`


let configPreferredLanguage: string
let configPreferredDateFormat: string

const getConfig = async (key: 'preferredLanguage' | 'preferredDateFormat'): Promise<string> => {
  if (key === 'preferredLanguage' && configPreferredLanguage) return configPreferredLanguage
  if (key === 'preferredDateFormat' && configPreferredDateFormat) return configPreferredDateFormat

  const userConfigs = await logseq.App.getUserConfigs() as { preferredLanguage: string, preferredDateFormat: string }
  if (key === 'preferredLanguage') {
    configPreferredLanguage = userConfigs.preferredLanguage
    return configPreferredLanguage
  } else {
    configPreferredDateFormat = userConfigs.preferredDateFormat
    return configPreferredDateFormat
  }
}

export const getConfigPreferredLanguage = async (): Promise<string> => getConfig('preferredLanguage')
export const getConfigPreferredDateFormat = async (): Promise<string> => getConfig('preferredDateFormat')

export const getUserConfig = async () => {
  // 1秒待つ
  await new Promise((resolve) => setTimeout(resolve, 1000))
  const { preferredLanguage, preferredDateFormat } = await logseq.App.getUserConfigs() as { preferredDateFormat: string; preferredLanguage: string }
  configPreferredLanguage = preferredLanguage
  configPreferredDateFormat = preferredDateFormat
  getHolidaysBundle(preferredLanguage)
}



let processingCheck = false //処理中フラグ
/* main */
const main = async () => {


  // l10nのセットアップ
  await l10nSetup({
    builtinTranslations: {//Full translations
      ja, af, de, es, fr, id, it, ko, "nb-NO": nbNO, nl, pl, "pt-BR": ptBR, "pt-PT": ptPT, ru, sk, tr, uk, "zh-CN": zhCN, "zh-Hant": zhHant
    }
  })


  // 更新メッセージなどを表示する
  notice()


  // 初回起動時に設定を促す
  setTimeout(() => {
    if (logseq.settings!.weekNumberFormat === undefined) {
      logseq.UI.showMsg("Select either \"US format\" or \"ISO format\"", "info", { timeout: 3000 })
      setTimeout(() => logseq.showSettingsUI(), 300)
    }
  }, 3000)


  // CSS適用
  logseq.provideStyle({ key: "main", style: fileMainCSS })


  // ユーザー設定を取得
  await getUserConfig()


  // プラグイン設定のセットアップ
  logseq.useSettingsSchema(
    settingsTemplate(
      logseq.settings!.holidaysCountry === undefined ? // 国名が設定されていない場合は取得
        mapLanguageCodeToCountry(configPreferredLanguage)
        : logseq.settings!.holidaysCountry
    ))


  // プラグインが読み込まれたら実行
  setTimeout(() => {

    if (logseq.settings!.booleanBoundariesAll === true
      && logseq.settings!.booleanJournalsBoundaries === true)
      invokeBoundaryHandler("journals")

    fetchJournalTitles(logseq.settings!.booleanBesideJournalTitle as boolean)

    setTimeout(() => observerMain(), 1800) //スクロール用
  }, 200)


  //ページ遷移時に実行 (Journal boundariesとBehind Journal Titleの更新)
  logseq.App.onRouteChanged(({ template }) => {
    if (processingCheck) return
    processingCheck = true
    setTimeout(() => processingCheck = false, 80) //処理ロックの解除

    if (logseq.settings!.booleanBoundariesAll === true)
      if (logseq.settings!.booleanBoundaries === true
        && template === "/page/:name")
        //page only
        //div.is-journals
        setTimeout(() => invokeBoundaryHandler("is-journals"), 20)
      else
        if (logseq.settings!.booleanJournalsBoundaries === true
          && template === "/")
          //journals only
          //div#journals
          setTimeout(() => invokeBoundaryHandler("journals"), 20)

    setTimeout(() => fetchJournalTitles(logseq.settings!.booleanBesideJournalTitle as boolean), 50)
  })

  logseq.App.onPageHeadActionsSlotted(() => {
    if (processingCheck) return
    processingCheck = true
    setTimeout(() => processingCheck = false, 80) //処理ロックの解除
    setTimeout(() => fetchJournalTitles(logseq.settings!.booleanBesideJournalTitle as boolean), 50)
  })


  // 今日の日記が作成されたときに実行される (Journal boundariesの更新のため)
  // ※ただし、今日以外の日記を作成した場合は実行されないので注意
  logseq.App.onTodayJournalCreated(async () => {
    if (logseq.settings!.booleanBoundariesAll === true
      && logseq.settings!.booleanBoundaries === true) {
      const weekBoundaries = parent.document.getElementById("weekBoundaries") as HTMLDivElement | null
      if (weekBoundaries) weekBoundaries.remove()
      if (await getCurrentPageUuid())
        //page only
        //div.is-journals
        setTimeout(() => invokeBoundaryHandler("is-journals"), 10)
      else
        //journals only
        //div#journals
        setTimeout(() => invokeBoundaryHandler("journals"), 10)
    }
  })


  // サイドバーの表示/非表示が切り替わったときにセレクタークエリを実行
  logseq.App.onSidebarVisibleChanged(({ visible }) => {
    if (visible === true)
      setTimeout(() =>
        fetchJournalTitles(logseq.settings!.booleanBesideJournalTitle as boolean), 100)
  })


  // CSS適用
  weeklyEmbed()

  if (logseq.settings!.boundariesBottom === true)
    parent.document.body.classList!.add("boundaries-bottom")


  // Left Calendarのセットアップ
  if (logseq.settings!.booleanLeftCalendar === true)
    loadLeftCalendar()



  // ボード機能のセットアップ
  // メニュー用のボタンを設置する
  if (logseq.settings!.addLeftMenu === true)
    initializeBoard()//ページ読み込み時に実行コールバック



  // プラグインオフ時に実行
  logseq.beforeunload(async () => {

    // Beside Journal Titleを取り除く
    removeTitleQuery()

    // Boundariesを取り除く
    removeBoundaries()

    // Observerの解除
    observer.disconnect()

    // Left Calendarのcontainerを取り除く
    removeElementById(keyLeftCalendarContainer)

    // ボード機能のメニューを取り除く
    removeAllElements(`.${shortKey}--nav-header`)

  })


  // グラフが変更されたときに実行
  logseq.App.onCurrentGraphChanged(() => {
    // ユーザー設定を取得して更新
    getUserConfig()
  })


  // ショートカットキーを登録
  loadShortcutItems()


  // ユーザー設定が変更されたときにチェックを実行
  handleSettingsUpdate()

} /* end_main */



// クエリーセレクターでタイトルを取得する
let processingTitleQuery: boolean = false

// Journal Titlesが変化したときに実行
export const fetchJournalTitles = async (enable: boolean): Promise<void> => {
  if (processingTitleQuery) return
  processingTitleQuery = true
  try {
    setTimeout(() => processingTitleQuery = false, 300) //boundaries 実行ロックの解除
    //Journalsの場合は複数
    parent.document.body.querySelectorAll("div#main-content-container div:is(.journal,.is-journals,.page) h1.title:not([data-checked])")
      .forEach(async (titleElement) => await validateJournalTitle(titleElement as HTMLElement))
  } finally {
    processingTitleQuery = false // 確実にフラグを解除
  }
}


// Journal Titleの処理
let processingJournalTitlePage: Boolean = false

const validateJournalTitle = async (titleElement: HTMLElement) => {
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
      } else
        if (match = title.match(/^(\d{4})\/(\d{2})$/)) { // 2023/01
          currentPageIsMonthlyJournal(titleElement, match)
          titleElement.title = t("Monthly Journal")
        } else
          if (match = title.match(/^(\d{4})\/[qQ](\d{1})$/)) { // 2023/Q1
            currentPageIsQuarterlyJournal(titleElement, match)
            titleElement.title = t("Quarterly Journal")
          } else
            if (match = title.match(/^(\d{4})$/)) { // 2023
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
        && ((logseq.settings!.booleanWeekNumber === false//設定項目ですべてのトグルがオフの場合
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
      setTimeout(async () => { // 遅延処理
        const pageEntities = await advancedQuery(queryCodeGetJournalDayFromOriginalName, `"${title}"`) as { "journal-day": PageEntity["journalDay"] }[] | null
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



//boundaries 実行ロックのため
let processingBoundaries: boolean = false

// Boundaries(2行カレンダー)を呼び出す
export const invokeBoundaryHandler = (targetElementName: string, remove?: boolean) => {
  if (processingBoundaries) return
  processingBoundaries = true
  try {
    boundariesProcess(targetElementName, remove ? remove : false, 0)
  } finally {
    processingBoundaries = false // 確実にフラグを解除
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

logseq.ready(main).catch(console.error)
