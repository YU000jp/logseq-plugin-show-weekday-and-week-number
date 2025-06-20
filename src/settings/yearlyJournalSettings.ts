import { LSPluginBaseInfo, SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user"
import { t } from "logseq-l10n"
import { SettingKeys } from "./SettingKeys"

// 年次ジャーナル設定
export const yearlyJournalSettings = (logseqSettings: LSPluginBaseInfo['settings'] | undefined, logseqDbGraph: boolean, logseqMdModel: boolean): SettingSchemaDesc[] => [
  // Yearly Journal
  {
    key: SettingKeys.heading007,
    title: "7. " + t("Yearly Journal") + "🆕",
    type: "heading",
    default: "",
    description: "",
  },
  {
    key: SettingKeys.booleanYearlyJournal,
    title: t("Enable feature"),
    type: "boolean",
    default: true,
    description: t("Enable the link and function. If there is no content available on a page with a yearly number like 2024, a template will be inserted."),
  },
  {
    key: SettingKeys.yearlyJournalTemplateName,
    title: t("Template name"),
    type: "string",
    default: "",
    description: t("Input the template name (default is blank)"),
  },
]
