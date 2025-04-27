import { BlockEntity } from "@logseq/libs/dist/LSPlugin.user"
import { isPageFileExist } from "../../lib/query/advancedQuery"
import { SettingKeys } from "../../settings/SettingKeys"
import { t } from "logseq-l10n"

// テンプレートを挿入する ユーザー設定で、テンプレートを挿入する設定になっているときのみ
let processingCheckPage = false

// 各日付ごとにチェックし、ファイルが存在しなかったら、曜日に応じたテンプレートを挿入する
export const dayTemplates = (contentCheckTarget: { [key: string]: string[] }) => {
  setTimeout(async () => {
    if (processingCheckPage) return
    processingCheckPage = true
    let templateInserted = false
    // contentCheckTargetの各valueは、ページタイトルであり、そのページのコンテンツが存在するかチェックする
    for (const [dayOfWeekKey, dates] of Object.entries(contentCheckTarget))
      for (const date of dates)
        if (await isPageFileExist(date) === false) { //ページが存在しない場合
          // embedにカーソルを置いて行が作成された場合も、ファイルなしとして検出される
          // 曜日ごとにテンプレートを適用する
          const dayOfWeekTemplates: { [key: string]: string } = {
            "0": logseq.settings![SettingKeys.sundayTemplate] as string, //Sunday
            "1": logseq.settings![SettingKeys.mondayTemplate] as string, //Monday
            "2": logseq.settings![SettingKeys.tuesdayTemplate] as string, //Tuesday
            "3": logseq.settings![SettingKeys.wednesdayTemplate] as string, //Wednesday
            "4": logseq.settings![SettingKeys.thursdayTemplate] as string, //Thursday
            "5": logseq.settings![SettingKeys.fridayTemplate] as string, //Friday
            "6": logseq.settings![SettingKeys.saturdayTemplate] as string, //Saturday
          }
          const templateName = dayOfWeekTemplates[dayOfWeekKey]
          if (templateName) {
            await pageTemplate(templateName, date)
            templateInserted = true
          }
        }
    if (templateInserted)
      logseq.UI.showMsg(t("Template inserted"), "info", { timeout: 5000 })
    processingCheckPage = false
  }, 1500)
}

// ページにテンプレートを挿入する
export const pageTemplate = async (templateName: string, pageName: string): Promise<boolean> => {
  if (await logseq.App.existTemplate(templateName)) {
    const tempBlock = await logseq.Editor.appendBlockInPage(pageName, "") as { uuid: BlockEntity["uuid"] } | null
    if (tempBlock) {
      const newBlock = await logseq.Editor.insertBlock(tempBlock.uuid, "", { before: false, sibling: true, focus: false })
      if (newBlock) {
        await logseq.App.insertTemplate(newBlock.uuid, templateName)
        await new Promise(resolve => setTimeout(resolve, 500))
        await logseq.Editor.removeBlock(tempBlock.uuid)
        return true
      }
    }
    console.error("Failed to insert template" + " " + templateName)
    return false
  } else {
    logseq.UI.showMsg(t("Template not found") + ": " + templateName, "info", { timeout: 5000 })
    console.error(t("Template not found") + ": " + templateName)
    return false
  }
}
