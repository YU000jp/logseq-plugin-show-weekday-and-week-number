import { LSPluginBaseInfo, SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user"
import { t } from "logseq-l10n"
import { SettingKeys } from "./SettingKeys"

// 四半期ジャーナル設定
export const quarterlyJournalSettings = (logseqSettings: LSPluginBaseInfo['settings'] | undefined, logseqDbGraph: boolean, logseqMdModel: boolean): SettingSchemaDesc[] => {
  const isFeatureEnabled = logseqSettings?.[SettingKeys.booleanQuarterlyJournal] === true;

  return [
    // Quarterly Journal
    {
      key: SettingKeys.heading006,
      title: "6. " + t("Quarterly Journal"),
      type: "heading",
      default: "",
      description: "",
    },
    {
      key: SettingKeys.booleanQuarterlyJournal,
      title: t("Enable feature"),
      type: "boolean",
      default: true,
      description: t("Enable the link and function. If there is no content available on a page with a quarterly number like 2024/Q1, a template will be inserted."),
    },
    ...(isFeatureEnabled
      ? [
          {
            key: SettingKeys.quarterlyJournalTemplateName,
            title: t("Template name"),
            type: "string" as const,
            default: "",
            description: t("Input the template name (default is blank)"),
          },
          {
            key: SettingKeys.quarterlyJournalSetPageTag,
            title: t("Set page tag (Add to tags property)"),
            type: "string" as const,
            default: "",
            description: t("Input a page name (default is blank)"),
          },
        ]
      : []),
  ];
};
