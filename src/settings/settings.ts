import { LSPluginBaseInfo, SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user"
import { commonSettings } from "./commonSettings"
import { dailyJournalSettings } from "./dailyJournalSettings"
import { journalBoundariesSettings } from "./journalBoundariesSettings"
import { leftCalendarSettings } from "./leftCalendarSettings"
import { monthlyJournalSettings } from "./monthlyJournalSettings"
import { quarterlyJournalSettings } from "./quarterlyJournalSettings"
import { weeklyJournalSettings } from "./weeklyJournalSettings"
import { yearlyJournalSettings } from "./yearlyJournalSettings"


/* user setting */
// https://logseq.github.io/plugins/types/SettingSchemaDesc.html


export const weekNumberFormat: string[] = ["YYYY-Www", "YYYY/qqq/Www", "YYYY/Www", "YYYY-qqq-Www"]

export const highlightColors: string[] = [
  "--highlight-bg-color",
  "--highlight-selected-bg-color",
  "--ls-wb-stroke-color-default",
  "--ls-wb-stroke-color-gray",
  "--ls-wb-stroke-color-red",
  "--ls-wb-stroke-color-yellow",
  "--ls-wb-stroke-color-green",
  "--ls-wb-stroke-color-blue",
  "--ls-wb-stroke-color-purple",
  "--ls-wb-stroke-color-pink",
  "unset"
]

export const styleList = [
  "Tile",
  "Gallery",
  "Expansion",
]

// 各セクションを結合して返す
export const settingsTemplate = (logseqSettings: LSPluginBaseInfo['settings'] | undefined, logseqDbGraph: boolean, logseqMdModel: boolean, userLanguage: string): SettingSchemaDesc[] => [
  ...commonSettings(logseqSettings, logseqDbGraph, logseqMdModel, userLanguage),
  ...dailyJournalSettings(logseqSettings, logseqDbGraph, logseqMdModel),
  ...journalBoundariesSettings(logseqSettings, logseqDbGraph, logseqMdModel),
  ...leftCalendarSettings(logseqSettings, logseqDbGraph, logseqMdModel),
  ...weeklyJournalSettings(logseqSettings, logseqDbGraph, logseqMdModel),
  ...monthlyJournalSettings(logseqSettings, logseqDbGraph, logseqMdModel),
  ...quarterlyJournalSettings(logseqSettings, logseqDbGraph, logseqMdModel),
  ...yearlyJournalSettings(logseqSettings, logseqDbGraph, logseqMdModel),
]