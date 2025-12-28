import { LSPluginBaseInfo, SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user"
import { t } from "logseq-l10n"
import { SettingKeys } from "./SettingKeys"

// 日報詳細設定（"Behind journal title"以降、Journal Boundariesより前まで）
export const dailyJournalSettings = (logseqSettings: LSPluginBaseInfo['settings'] | undefined, logseqDbGraph: boolean, logseqMdModel: boolean): SettingSchemaDesc[] => {
  const isEnabled = logseqSettings?.[SettingKeys.booleanBesideJournalTitle] === true

  return [
    // Behind journal title
    {
      key: SettingKeys.heading001,
      title: "1. " + t("Daily Journal Details"),
      type: "heading" as const,
      default: "",
      description: "",
    },
    {
      key: SettingKeys.booleanBesideJournalTitle,
      title: t("Enable feature"),
      type: "boolean" as const,
      default: true,
      description: "",
    },
    ...(isEnabled
      ? [
        {
          key: SettingKeys.longOrShort,
          title: t("Day of the week long or short"),
          type: "enum" as const,
          default: "long",
          enumChoices: ["long", "short"],
          description: "",
        },
        {
          key: SettingKeys.underHolidaysAlert,
          title: t("Enable Holidays alert"),
          type: "boolean" as const,
          default: true,
          description: "",
        },
        {
          key: SettingKeys.booleanWeekNumber,
          title: t("Enable week number"),
          type: "boolean" as const,
          default: true,
          description: "",
        },
        {
          key: SettingKeys.booleanWeekNumberHideYear,
          title: t("Hide the year of week number"),
          type: "boolean" as const,
          default: true,
          description: t(
            "Enabling this setting conceals the year representation in the date format. For instance, 2023-W30 displays as W30. Typically, the notation of week numbers follows the rules based on ISO 8601. The reason for distinguishing the year is that the first week of a year might be included in the last week of the previous year. Only in such cases does it display as 2023-W53."
          ),
        },
        {
          key: SettingKeys.weekNumberOfTheYearOrMonth,
          title: t("Show week number of the year or month (unit)"),
          type: "enum" as const,
          default: "Year",
          enumChoices: ["Year", "Month"],
          description: "",
        },
        {
          key: SettingKeys.booleanRelativeTime,
          title: t("Enable relative time"),
          type: "boolean" as const,
          default: true,
          description: t("like `3 days ago`"),
        },
        {
          key: SettingKeys.booleanDayOfWeek,
          title: t("Enable day of the week"),
          type: "boolean" as const,
          default: true,
          description: "",
        },
        {
          key: SettingKeys.booleanMonthlyJournalLink,
          title: t("Enable monthly journal link"),
          type: "boolean" as const,
          default: false,
          // [[2023/10]]のような階層のMonthly Journalを開くリンクを設置する
          description: t("Place a link to open the Monthly Journal of the hierarchy like [[2023/10]]"),
        },
        {
          key: SettingKeys.booleanSettingsButton,
          title: t("Show settings button"),
          type: "boolean" as const,
          default: true,
          description: "",
        },
        {
          //20240721
          key: SettingKeys.booleanPrevNextLink,
          title: t("Show previous and next link"),
          type: "boolean" as const,
          default: true,
          description: t("Single journal page only"),
        },
        {
          key: SettingKeys.booleanShowIcsEvents,
          title: t("Show ICS events"),
          type: "boolean" as const,
          default: false,
          description: t("Enable to display ICS calendar events in the journal details."),
        },
        {
          key: SettingKeys.booleanShowUserEvents,
          title: t("Show user events"),
          type: "boolean" as const,
          default: false,
          description: t("Enable to display user-defined events in the journal details."),
        },
      ]
      : []),
  ]
}
