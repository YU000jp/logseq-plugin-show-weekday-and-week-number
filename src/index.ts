import "@logseq/libs" //https://plugins-doc.logseq.com/
import { t } from "logseq-l10n" //https://github.com/sethyuan/logseq-l10n
import { removeBoundaries } from "./calendar/boundaries"
import { invokeBoundaryHandler } from "./calendar/invokeBoundaryHandler"
import { keyLeftCalendarContainer, loadLeftCalendar } from "./calendar/left-calendar"
import { observer, observerMain, removeTitleQuery } from "./dailyJournalDetails"
import { fetchJournalTitles } from "./fetchJournalTitles"
import { weeklyEmbed } from "./journals/weeklyJournal"
import { getHolidaysBundle } from "./lib/holidays"
import { removeElementById } from "./lib/lib"
import { getCurrentPageUuid } from "./lib/query/advancedQuery"
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
// 外部から参照するためにexportする
export const getLogseqVersion = () => logseqVersion //バージョンチェック用
export const replaceLogseqVersion = (version: string) => logseqVersion = version
export const booleanLogseqMdModel = () => logseqMdModel //モデルチェック用
export const replaceLogseqMdModel = (mdModel: boolean) => logseqMdModel = mdModel

export const booleanDbGraph = () => logseqDbGraph //DBグラフチェック用
export const replaceLogseqDbGraph = (dbGraph: boolean) => logseqDbGraph = dbGraph


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

export const getUserConfig = async (notFirst?: boolean) => {
  // 1秒待つ
  await new Promise((resolve) => setTimeout(resolve, 1000))
  const { preferredLanguage, preferredDateFormat } = await logseq.App.getUserConfigs() as { preferredDateFormat: string; preferredLanguage: string }
  configPreferredLanguage = preferredLanguage
  configPreferredDateFormat = preferredDateFormat
  if (!notFirst)
    getHolidaysBundle(preferredLanguage)
}



let processingCheck = false //処理中フラグ
/* main */
const main = async () => {

  // Logseqモデルのチェックを実行
  const [logseqDbGraph, logseqMdModel] = await logseqModelCheck()


  // ユーザー設定言語を取得し、L10Nをセットアップ
  const { preferredLanguage, preferredDateFormat } = await loadLogseqL10n()
  configPreferredLanguage = preferredLanguage
  configPreferredDateFormat = preferredDateFormat

  // TODO: // Logseqのユーザー日付フォーマットがおかしい
  console.log(`${consoleSignature} Logseq preferredDateFormat: ${preferredDateFormat}`)


  // 更新メッセージなどを表示する
  notice()


  // 初回起動時に設定を促す
  setTimeout(() => {
    if (logseq.settings!.weekNumberFormat === undefined) {
      logseq.UI.showMsg("Select either \"US format\" or \"ISO format\"", "info", { timeout: 3000 })
      setTimeout(() => logseq.showSettingsUI(), 300)
    }
  }, 3000)

  if (logseq.settings!["cashBatch-daily-desk"] !== null) {
    logseq.updateSettings({ "cashBatch-daily-desk": null })
  }
  if (logseq.settings!["cashBatch-weekly-desk"] !== null) {
    logseq.updateSettings({ "cashBatch-weekly-desk": null })
  }


  // CSS適用
  logseq.provideStyle({ key: "main", style: fileMainCSS })


  // プラグイン設定のセットアップ
  logseq.useSettingsSchema(
    settingsTemplate(logseq.settings, logseqDbGraph, logseqMdModel,
      logseq.settings!.holidaysCountry === undefined ? // 国名が設定されていない場合は取得
        mapLanguageCodeToCountry(configPreferredLanguage)
        : logseq.settings!.holidaysCountry as string
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
    loadLeftCalendar(logseqDbGraph)



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
  // 必要に応じて条件分岐でセレクターを切り替える
  logseqDbGraph ?
    // DBグラフ用
    "#main-content-container div:is(.journal,#journals,.page) h1.title:not([data-checked])"
    : logseqMdModel === false ?
      // DBモデルかつfile-basedグラフ用
      "#main-content-container div:is(.journal,#journals,.page) h1.title:not([data-checked])"
      :
      // MDモデル用
      "#main-content-container div:is(.journal,.is-journals,.page) h1.title:not([data-checked])"


export const getLeftSidebarFooterSelector = (): string =>
  logseqDbGraph ?
    // DBグラフ用
    "#left-sidebar>div.left-sidebar-inner div.sidebar-contents-container"
    : logseqMdModel === false ?
      // DBモデルかつfile-basedグラフ用
      "#left-sidebar>div.left-sidebar-inner div.sidebar-contents-container"
      :
      // MDモデル用
      "#left-sidebar>div.left-sidebar-inner footer.create"


logseq.ready(main).catch(console.error)
