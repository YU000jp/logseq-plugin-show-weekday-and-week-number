import { LSPluginBaseInfo, SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user"
import { t } from "logseq-l10n"
import { SettingKeys } from "./SettingKeys"

// ジャーナル境界設定（Two-lines mini-Calendar～）
export const journalBoundariesSettings = (logseqSettings: LSPluginBaseInfo['settings'] | undefined, logseqDbGraph: boolean, logseqMdModel: boolean): SettingSchemaDesc[] => {

  const settings: SettingSchemaDesc[] = [
    // Journal Boundaries
    // Two-lines mini-Calendar
    {
      key: SettingKeys.heading002,
      title: "2. " + t("Two-lines mini-Calendar") + t("(Journal Boundaries)"),
      type: "heading",
      default: "",
      description: "",
    },
    {
      key: SettingKeys.booleanBoundariesAll,
      title: t("Enable feature"),
      type: "boolean",
      default: false,
      description: "",
    },
  ]

  if (logseqSettings?.booleanBoundariesAll === true) {
    settings.push(
      {
        key: SettingKeys.booleanBoundaries,
        title: "",
        type: "boolean",
        default: true,
        description: t("Use on single journal"),
      },
      {
        key: SettingKeys.booleanJournalsBoundaries,
        title: "",
        type: "boolean",
        default: true,
        description: t("Use on journals"),
      },
      {
        key: SettingKeys.booleanBoundariesOnWeeklyJournal,
        title: "",
        type: "boolean",
        default: false,
        description: t("Use on Weekly Journal"),
      },
      {
        key: SettingKeys.booleanBoundariesOnMonthlyJournal,
        title: "",
        type: "boolean",
        default: false,
        description: t("Use on Monthly Journal") + "🆕",
      },
      {
        key: SettingKeys.booleanBoundariesOnQuarterlyJournal,
        title: "",
        type: "boolean",
        default: false,
        description: t("Use on Quarterly Journal") + "🆕",
      },
      {
        key: SettingKeys.booleanBoundariesOnYearlyJournal,
        title: "",
        type: "boolean",
        default: false,
        description: t("Use on Yearly Journal") + "🆕",
      },
      {
        key: SettingKeys.boundariesBottom,
        title: t("Show it on bottom"),
        type: "boolean",
        default: true,
        description: "",
      },
      // Month and week-number are always shown in the Two-line calendar.
      //20240121
      {
        key: SettingKeys.booleanBoundariesHolidays,
        //休日をハイライトする
        title: t("Highlight holidays"),
        type: "boolean",
        default: true,
        description: "",
      }
    )
  }

  return settings
}
