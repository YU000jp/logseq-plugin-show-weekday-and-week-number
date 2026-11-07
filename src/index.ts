import "@logseq/libs"; //https://plugins-doc.logseq.com/
import { t } from "logseq-l10n"; //https://github.com/sethyuan/logseq-l10n
import { removeBoundaries } from "./calendar/boundaries"
import { invokeBoundaryHandler } from "./calendar/invokeBoundaryHandler"
import { keyLeftCalendarContainer, loadLeftCalendar } from "./calendar/left-calendar"
import { observer, observerMain, removeTitleQuery } from "./dailyJournalDetails"
import { fetchJournalTitles } from "./fetchJournalTitles"
import { weeklyEmbed } from "./journals/weeklyJournal"
import { getCurrentPageUuid, getHolidaysBundle, removeElementById } from "./lib"
import { logseqModelCheck } from "./logseqModelCheck"
import fileMainCSS from "./main.css?inline"
import { mapLanguageCodeToCountry } from "./settings/languageCountry"
import { notice } from "./settings/notice"
import { handleSettingsUpdate } from "./settings/onSettingsChanged"
import { settingsTemplate } from "./settings/settings"
import { loadShortcutItems, } from "./shortcutItems"
import { loadLogseqL10n } from "./translations/l10nSetup"

// プラグイン名(小文字タイプ)
export const pluginNameCut = "show-weekday-and-week-number"
// プラグイン名の最後に[plugin]を追加
export const pluginName = `${pluginNameCut} ${t("plugin")}`
// コンソールの署名用
export const consoleSignature = ` <----- [${pluginName}]`


// 変数 (同じモジュール内で使用するため、exportしない)
let logseqVersion: string = "" //バージョンチェック用
let logseqMdModel: boolean = false //モデルチェック用
let logseqDbGraph: boolean = false //DBグラフチェック用
let logseqDbEraApp: boolean = false //アプリ世代(DB系/新UI)チェック用
// 外部から参照するためにexportする
export const getLogseqVersion = () => logseqVersion //バージョンチェック用
export const replaceLogseqVersion = (version: string) => logseqVersion = version
export const booleanLogseqMdModel = () => logseqMdModel //モデルチェック用
export const replaceLogseqMdModel = (mdModel: boolean) => logseqMdModel = mdModel

export const booleanDbGraph = () => logseqDbGraph //DBグラフチェック用
export const replaceLogseqDbGraph = (dbGraph: boolean) => logseqDbGraph = dbGraph

export const booleanDbEraApp = () => logseqDbEraApp //アプリ世代チェック用
export const replaceLogseqDbEraApp = (dbEra: boolean) => logseqDbEraApp = dbEra


let configPreferredLanguage: string
let configPreferredDateFormat: string

const getConfig = async (key: 'preferredLanguage' | 'preferredDateFormat'): Promise<string> => {
  if (key === 'preferredLanguage' && configPreferredLanguage) return configPreferredLanguage
  if (key === 'preferredDateFormat' && configPreferredDateFormat) return configPreferredDateFormat

  await getUserConfig(true) // ユーザー設定を取得

  return key === 'preferredLanguage' ? configPreferredLanguage : configPreferredDateFormat
}

export const getConfigPreferredLanguage = async (): Promise<string> => getConfig('preferredLanguage')
export const getConfigPreferredDateFormat = async (): Promise<string> => getConfig('preferredDateFormat')

/**
 * Wait utility for async delays.
 * @param ms Milliseconds to wait.
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const getUserConfig = async (notFirst?: boolean) => {
  // Wait 1 second for logseq.App.getUserConfigs() to be ready.
  // This is a workaround: the SDK may not have populated user configs immediately after logseq.ready().
  await delay(1000)
  const { preferredLanguage, preferredDateFormat } = await logseq.App.getUserConfigs() as { preferredDateFormat: string; preferredLanguage: string }
  configPreferredLanguage = preferredLanguage
  configPreferredDateFormat = preferredDateFormat
  if (!notFirst)
    getHolidaysBundle(preferredLanguage)
}



/**
 * Guard flag to prevent rapid-fire route change handlers from overlapping.
 * Reset after 80ms to allow the next event to proceed.
 */
let isProcessing = false

/**
 * Initialize the plugin: detect Logseq model, load i18n, show notices.
 */
const initPlugin = async () => {
  const [logseqDbGraph, logseqMdModel] = await logseqModelCheck()
  replaceLogseqDbGraph(logseqDbGraph)
  replaceLogseqMdModel(logseqMdModel)

  const { preferredLanguage, preferredDateFormat } = await loadLogseqL10n()
  configPreferredLanguage = preferredLanguage
  configPreferredDateFormat = preferredDateFormat

  // Logseq's preferredDateFormat may differ from the plugin's expected format.
  // This is logged for debugging purposes.
  console.log(`${consoleSignature} Logseq preferredDateFormat: ${preferredDateFormat}`)

  notice()

  // Prompt first-time users to select week number format
  setTimeout(() => {
    if (logseq.settings!.weekNumberFormat === undefined) {
      logseq.UI.showMsg("Select either \"US format\" or \"ISO format\"", "info", { timeout: 3000 })
      setTimeout(() => { try { logseq.showSettingsUI() } catch (e) { /* ignore */ } }, 300)
    }
  }, 3000)
}

/**
 * Apply CSS and set up plugin settings schema.
 */
const applyStylesAndSettings = () => {
  logseq.provideStyle({ key: "main", style: fileMainCSS })

  logseq.useSettingsSchema(
    settingsTemplate(logseq.settings, booleanDbGraph(), booleanLogseqMdModel(),
      logseq.settings!.holidaysCountry === undefined ?
        mapLanguageCodeToCountry(configPreferredLanguage)
        : logseq.settings!.holidaysCountry as string
    ))
}

/**
 * Register event handlers for route changes, page actions, and sidebar visibility.
 */
const registerEventHandlers = () => {
  logseq.App.onRouteChanged(({ template }) => {
    if (isProcessing) return
    isProcessing = true
    setTimeout(() => isProcessing = false, 80)

    if (logseq.settings!.booleanBoundariesAll === true)
      if (logseq.settings!.booleanBoundaries === true
        && template === "/page/:name")
        setTimeout(() => invokeBoundaryHandler("is-journals"), 20)
      else
        if (logseq.settings!.booleanJournalsBoundaries === true
          && template === "/")
          setTimeout(() => invokeBoundaryHandler("journals"), 20)

    setTimeout(() => fetchJournalTitles(logseq.settings!.booleanBesideJournalTitle as boolean), 50)
  })

  logseq.App.onPageHeadActionsSlotted(() => {
    if (isProcessing) return
    isProcessing = true
    setTimeout(() => isProcessing = false, 80)
    setTimeout(() => fetchJournalTitles(logseq.settings!.booleanBesideJournalTitle as boolean), 50)
  })
}

/**
 * Main entry point: initialize, apply styles, register handlers, and set up cleanup.
 */
const main = async () => {
  await initPlugin()
  applyStylesAndSettings()

  // Start background tasks after a short delay to let DOM settle
  setTimeout(() => {
    if (logseq.settings!.booleanBoundariesAll === true
      && logseq.settings!.booleanJournalsBoundaries === true)
      invokeBoundaryHandler("journals")

    fetchJournalTitles(logseq.settings!.booleanBesideJournalTitle as boolean)

    setTimeout(() => observerMain(), 1800)
  }, 200)

  registerEventHandlers()


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
    loadLeftCalendar(booleanDbEraApp())



  // グラフが変更されたときに実行
  logseq.App.onCurrentGraphChanged(async () => {
    // ユーザー設定を取得して更新
    await getUserConfig()
  })


  // ショートカットキーを登録
  loadShortcutItems()


  // ユーザー設定が変更されたときにチェックを実行
  handleSettingsUpdate()


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
  })


} /* end_main */


/**
 * Logseqモデル・DBグラフ種別に応じたDOMクエリーセレクター
 */
export const getJournalTitleSelector = (): string =>
  // DOM構造はアプリ世代(DOM/UIの新旧)で分岐する(グラフ種別ではない)
  booleanDbGraph() ?
    // DB graph: Beside Journal Title re-enabled (same title element as the new UI)
    "#main-content-container div:is(#journals,.is-journals,.page) div.ls-page-title span.block-title-wrap:not([data-checked])"
    : booleanDbEraApp() ?
      // DB系アプリ+ファイルグラフ(新UI)用
      // Note: DOM structure for Logseq 2.x + file graph matches the new UI pattern.
      // Verified with Logseq 0.10.x and DB graph. File graph with 2.x may need re-testing.
      "#main-content-container div:is(#journals,.is-journals,.page) div.ls-page-title span.block-title-wrap:not([data-checked])"
      :
      // 旧UI(0.10.x, OG 1.x)用
      "#main-content-container div:is(.journal,.is-journals,.page) h1.title:not([data-checked])"


export const getLeftSidebarFooterSelector = (): string =>
  "#left-sidebar>div.left-sidebar-inner :is(footer.create,div.sidebar-contents-container)"


logseq.ready(main).catch(console.error)
