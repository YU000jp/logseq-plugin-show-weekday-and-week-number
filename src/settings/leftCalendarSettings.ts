import { LSPluginBaseInfo, SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user"
import { t } from "logseq-l10n"
import { SettingKeys } from "./SettingKeys"

// 左カレンダー設定（Left Calendar）
export const leftCalendarSettings = (logseqSettings: LSPluginBaseInfo['settings'] | undefined, logseqDbGraph: boolean, logseqMdModel: boolean): SettingSchemaDesc[] => [
  // Left Calendar 20240714-
  {
    key: SettingKeys.heading003,
    title: "3. " + t("Left Calendar") + t("(Journal Boundaries)") + "🆙",
    type: "heading",
    default: "",
    description: "",
  },
  {
    key: SettingKeys.booleanLeftCalendar,
    title: t("Enable feature"),
    type: "boolean",
    default: true,
    description: "",
  },
  {
    key: SettingKeys.booleanLcWeekNumber,
    title: t("Show week number"),
    type: "boolean",
    default: true,
    description: "",
  },
  {
    key: SettingKeys.booleanLcHolidays,
    title: t("Highlight holidays"),
    type: "boolean",
    default: true,
    description: "",
    //共通設定に、choiceHolidaysColorあり
  },
  {
    key: SettingKeys.lcHolidaysAlert,
    title: t("Enable Holidays alert"),
    type: "enum",
    enumChoices: ["none", "Today only", "Monthly"],
    default: "Today only",
    description: "",
  },
]
