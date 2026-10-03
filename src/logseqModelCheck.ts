import { booleanDbGraph, getConfigPreferredLanguage, replaceLogseqDbEraApp, replaceLogseqDbGraph, replaceLogseqMdModel, replaceLogseqVersion } from "."
import { mapLanguageCodeToCountry } from "./settings/languageCountry"
import { settingsTemplate } from "./settings/settings"

// アプリ世代の判定(バージョン解析のみ。グラフ種別の判定には使わない)
// DB系世代(新UI) = major>=2 または 0.11.x。OG 1.x はMD版系統(旧UI)側。
const fetchAppInfo = async (): Promise<{ version: string; isDbEra: boolean }> => {
    // 引数なしの getInfo() は実機ホストで undefined を返すため "version" 指定が必須
    const raw = await logseq.App.getInfo("version")
    const version = typeof raw === "string" ? raw : "0.0.0"
    const m = version.match(/(\d+)\.(\d+)\.(\d+)/)
    const isDbEra = m ? (Number(m[1]) >= 2 || (Number(m[1]) === 0 && Number(m[2]) >= 11)) : false
    return { version: m ? m[0] : version, isDbEra }
}

// 現在のグラフ種別の判定(公式API。0.10.xホストでは未実装 → null)
const checkLogseqDbGraph = async (): Promise<boolean | null> => {
    try {
        const value = await (logseq.App as any).checkCurrentIsDbGraph()
        return typeof value === "boolean" ? value : null
    } catch {
        return null // API非搭載ホスト = DBグラフを開けない旧アプリ
    }
}

// Show a warning message once if the graph is a DB graph.
const showDbGraphIncompatibilityMsg = () => {
    if (!logseq.settings!.warningMessageShownDbGraph) {
        logseq.updateSettings({
            warningMessageShownDbGraph: true
        })
        logseq.UI.showMsg("The 'Show weekday and week-number' plugin does not support Logseq DB graph.", "warning", { timeout: 5000 })
    }
    return
}

let graphChangeSeq = 0 // 連続したグラフ切替で古い検出結果が上書きしないよう、最新の切替のみ反映する

/**
 * アプリ世代と現在のグラフ種別を検出してグローバルフラグを更新する。
 * @returns Promise<boolean[]> - [isDbGraph, isFileGraph]
 */
export const logseqModelCheck = async (): Promise<boolean[]> => {
    const { version, isDbEra } = await fetchAppInfo()
    replaceLogseqVersion(version) // Update the version
    replaceLogseqDbEraApp(isDbEra) // アプリ世代(DOM/UIの新旧)はバージョン由来

    // 初回検出の失敗 = API非搭載の旧アプリ → ファイルグラフとして扱う
    const isDbGraph = (await checkLogseqDbGraph()) ?? false
    replaceLogseqDbGraph(isDbGraph)
    replaceLogseqMdModel(!isDbGraph) // MdModel = 「現在のグラフがファイルベース」に再定義
    // Wait for 100ms
    await new Promise(resolve => setTimeout(resolve, 100))

    if (isDbGraph === true) {
        // Not supported for DB graph
        showDbGraphIncompatibilityMsg()
    }

    logseq.App.onCurrentGraphChanged(async () => { // Callback when the graph changes
        const seq = ++graphChangeSeq
        const result = await checkLogseqDbGraph()
        if (seq !== graphChangeSeq) return // 後続の切替が発生しているので破棄
        if (result === null || result === booleanDbGraph()) return // 再検出失敗時は現状維持 / 変化なし

        replaceLogseqDbGraph(result)
        replaceLogseqMdModel(!result)
        if (result === true) {
            // Not supported for DB graph
            showDbGraphIncompatibilityMsg()
        }

        /* Update user settings: グラフ種別で表示セクションが変わるためスキーマを再適用 */
        try {
            const holidaysCountry = logseq.settings?.holidaysCountry === undefined
                ? mapLanguageCodeToCountry(await getConfigPreferredLanguage())
                : logseq.settings!.holidaysCountry as string
            logseq.useSettingsSchema(
                settingsTemplate(logseq.settings, result, !result, holidaysCountry)
            )
        } catch { /* ignore */ }
    })
    return [isDbGraph, !isDbGraph] // Return [isDbGraph, isFileGraph]
}
