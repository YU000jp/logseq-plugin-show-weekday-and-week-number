import { t } from "logseq-l10n"

export const shortKey = "des" // ショートキー
export const keyLeftMenu = `${shortKey}--nav-header` // メニューバーのキー
export const mainPageTitle = "Weekly-Desk" // メインページのタイトル
export const mainPageTitleLower = mainPageTitle.toLowerCase() // メインページのタイトル(小文字)
export const keyToolbar = mainPageTitle // ツールバーのキー
export const keyPageBarId = `${shortKey}--pagebar` // ページバーのキー
export const keyToggleButton = `${shortKey}--changeStyleToggle` // スタイル変更ボタンのキー
export const keySettingsButton = `${shortKey}--pluginSettings` // 設定ボタンのキー
export const keyReloadButton = `${shortKey}--reload` // リロードボタンのキー
export const keyAnotherJournal = mainPageTitle.toLowerCase() // 別のジャーナルのキー

export const leftMenuItems = [
             {
                          icon: "1️⃣", // アイコン
                          suffix: mainPageTitle.toLowerCase(), // サフィックス
                          title: "Weekly Desk", // タイトル
                          description: t("Compare today journal with other days."), // 説明
             },
]

