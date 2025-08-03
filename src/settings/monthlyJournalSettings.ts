import { LSPluginBaseInfo, SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user"
import { t } from "logseq-l10n"
import { SettingKeys } from "./SettingKeys"

// 月次ジャーナル設定
export const monthlyJournalSettings = (logseqSettings: LSPluginBaseInfo['settings'] | undefined, logseqDbGraph: boolean, logseqMdModel: boolean): SettingSchemaDesc[] => [
  //Monthly Journal
  {
    key: SettingKeys.heading005,
    title: "5. " + t("Monthly Journal"),
    type: "heading",
    default: "",
    description: "",
  },
  {
    key: SettingKeys.booleanMonthlyJournal,
    title: t("Enable feature"),
    type: "boolean",
    default: true,
    description: t("Enable the link and function. If there is no content available on a page with a month number like 2024/05, a template will be inserted."),
  },
  ...(logseqSettings?.booleanMonthlyJournal === true
    ? [
      {
        key: SettingKeys.monthlyJournalTemplateName,
        title: t("Template name"),
        type: "string" as const,
        default: "",
        description: t("Input the template name (default is blank)"),
      },
    ]
    : []),
]
