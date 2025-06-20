import { LSPluginBaseInfo, SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user"
import { t } from "logseq-l10n"
import { SettingKeys } from "./SettingKeys"

// 日報詳細設定（"Behind journal title"以降、Journal Boundariesより前まで）
export const dailyJournalSettings = (logseqSettings: LSPluginBaseInfo['settings'] | undefined, logseqDbGraph: boolean, logseqMdModel: boolean): SettingSchemaDesc[] => [
  // Behind journal title
  {
    key: SettingKeys.heading001,
    title: "1. " + t("Daily Journal Details"),
    type: "heading",
    default: "",
    description: "",
  },
  {
    key: SettingKeys.booleanBesideJournalTitle,
    title: t("Enable feature"),
    type: "boolean",
    default: true,
    description: "",
  },
  {
    key: SettingKeys.longOrShort,
    title: t("Day of the week long or short"),
    type: "enum",
    default: "long",
    enumChoices: ["long", "short"],
    description: "",
  },
  {
    key: SettingKeys.underHolidaysAlert,
    title: t("Enable Holidays alert"),
    type: "boolean",
    default: true,
    description: "",
  },
  {
    key: SettingKeys.booleanWeekNumber,
    title: t("Enable week number"),
    type: "boolean",
    default: true,
    description: "",
  },
  {
    key: SettingKeys.booleanWeekNumberHideYear,
    title: t("Hide the year of week number"),
    type: "boolean",
    default: true,
    description: t(
      "Enabling this setting conceals the year representation in the date format. For instance, 2023-W30 displays as W30. Typically, the notation of week numbers follows the rules based on ISO 8601. The reason for distinguishing the year is that the first week of a year might be included in the last week of the previous year. Only in such cases does it display as 2023-W53."
    ),
  },
  {
    key: SettingKeys.weekNumberOfTheYearOrMonth,
    title: t("Show week number of the year or month (unit)"),
    type: "enum",
    default: "Year",
    enumChoices: ["Year", "Month"],
    description: "",
  },
  {
    key: SettingKeys.booleanRelativeTime,
    title: t("Enable relative time"),
    type: "boolean",
    default: true,
    description: t("like `3 days ago`"),
  },
  {
    key: SettingKeys.booleanDayOfWeek,
    title: t("Enable day of the week"),
    type: "boolean",
    default: true,
    description: "",
  },
  {
    key: SettingKeys.booleanMonthlyJournalLink,
    title: t("Enable monthly journal link"),
    type: "boolean",
    default: false,
    // [[2023/10]]のような階層のMonthly Journalを開くリンクを設置する
    description: t("Place a link to open the Monthly Journal of the hierarchy like [[2023/10]]"),
  },
  {
    key: SettingKeys.booleanSettingsButton,
    title: t("Show settings button"),
    type: "boolean",
    default: true,
    description: "",
  },
  {
    //20240721
    key: SettingKeys.booleanPrevNextLink,
    title: t("Show previous and next link") + "🆕",
    type: "boolean",
    default: true,
    description: t("Single journal page only"),
  },
]
