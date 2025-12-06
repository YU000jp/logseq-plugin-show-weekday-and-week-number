import { LSPluginBaseInfo, SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user"
import { t } from "logseq-l10n"
import { language, countryName } from "./languageCountry"
import { SettingKeys } from "./SettingKeys"
import { highlightColors } from "./settings"

// 共通設定（共通設定とユーザーカラーまで）
export const commonSettings = (logseqSettings: LSPluginBaseInfo['settings'] | undefined, logseqDbGraph: boolean, logseqMdModel: boolean, userLanguage: string): SettingSchemaDesc[] => [
  //共通設定
  {
    key: SettingKeys.heading000,
    title: "0. " + t("Common settings"),
    type: "heading",
    default: "",
    description: "",
  },
  {
    key: SettingKeys.weekNumberFormat,
    title: t("Week number calculation (across years)"),
    type: "enum",
    default: "ISO(EU) format",
    enumChoices: ["US format", "ISO(EU) format"],
    description: t("`US format`: Sunday, `ISO(EU) format`: Monday, [>> document here](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/Week-number-format)"),
  },
  {
    key: SettingKeys.localizeOrEnglish,
    title: t("Select language (default)"),
    type: "enum",
    default: "default",
    enumChoices: language,
    // defaultを選択すると、ブラウザの言語設定に従う(ローカライズ)
    description: t("If default is selected, the browser's language settings are followed (localisation)."),
  },
  {
    key: SettingKeys.holidaysCountry,
    title: t("Holidays > Select your country name"),
    type: "enum",
    enumPicker: "select",
    enumChoices: countryName,
    description: t("If possible to set the State and Region, do so individually.") + 'https://github.com/commenthol/date-holidays#supported-countries-states-regions',
    default: userLanguage,
  },
  {
    key: SettingKeys.holidaysState,
    title: t("Holidays > Select your state of the country (:additional option)"),
    type: "string",
    description: t("2-character alphanumeric code (ex, NY) or blank (default)"),
    default: "",
  },
  {
    key: SettingKeys.holidaysRegion,
    title: t("Holidays > Select your region of the country (:additional option)"),
    type: "string",
    description: t("2 or 3 character alphanumeric code or blank (default)"),
    default: "",
  },
  {
    key: SettingKeys.booleanLunarCalendar,
    title: t("Enable Lunar-calendar based (Chinese only)"),
    type: "boolean",
    default: true,
    description: t("Other language regions are not affected."),
  },
  {
    key: SettingKeys.booleanUnderLunarCalendar,
    title: t("Enable month and day of lunar-calendar (Chinese only)"),
    type: "boolean",
    default: true,
    description: t("Other language regions are not affected."),
  },
  {
    key: SettingKeys.choiceHolidaysColor,
    title: t("Holidays > Highlight Color"),
    type: "string",
    inputAs: "color",
    default: "#ef4444",
    description: t("Pick a color to highlight holidays. You can also use CSS variable names like '--highlight-bg-color' by editing the setting text."),
  },
  {
    key: SettingKeys.booleanBoundariesIndicator,
    title: t("Show indicator of journal entries") + "🆙",
    type: "boolean",
    default: true,
    //ページが存在する場合に、インディケーターを表示する
    description: "",
  },
  {
    key: SettingKeys.boundariesWeekStart,
    title: t("Week start (Unset: by the selected format)"),
    type: "enum",
    enumChoices: ["unset", "Sunday", "Monday", "Saturday"],
    default: "unset",
    description: t("default: `unset`"),
  },
  {
    // 土曜日と日曜日の文字に色を付ける
    key: SettingKeys.booleanWeekendsColor,
    title: t("Colour the letters Saturday and Sunday"),
    type: "boolean",
    default: true,
    description: t("Select your days of the weekends") + "🆕",
  },
  {
    key: SettingKeys.userWeekendMon,
    title: t("Decide the colour of Monday.") + "🆕",
    type: "enum",
    enumChoices: ["", "blue", "red", "green"],
    default: "",
    description: "",
  },
  {
    key: SettingKeys.userWeekendTue,
    title: t("Decide the colour of Tuesday.") + "🆕",
    type: "enum",
    enumChoices: ["", "blue", "red", "green"],
    default: "",
    description: "",
  },
  {
    key: SettingKeys.userWeekendWed,
    title: t("Decide the colour of Wednesday.") + "🆕",
    type: "enum",
    enumChoices: ["", "blue", "red", "green"],
    default: "",
    description: "",
  },
  {
    key: SettingKeys.userWeekendThu,
    title: t("Decide the colour of Thursday.") + "🆕",
    type: "enum",
    enumChoices: ["", "blue", "red", "green"],
    default: "",
    description: "",
  },
  {
    key: SettingKeys.userWeekendFri,
    title: t("Decide the colour of Friday.") + "🆕",
    type: "enum",
    enumChoices: ["", "blue", "red", "green"],
    default: "",
    description: "",
  },
  {
    key: SettingKeys.userWeekendSat,
    title: t("Decide the colour of Saturday.") + "🆕",
    type: "enum",
    enumChoices: ["blue", "", "red", "green"],
    default: "blue",
    description: "",
  },
  {
    key: SettingKeys.userWeekendSun,
    title: t("Decide the colour of Sunday.") + "🆕",
    type: "enum",
    enumChoices: ["red", "", "blue", "green"],
    default: "red",
    description: "",
  },
  {
    key: SettingKeys.boundariesHighlightColorSinglePage,
    title: t("Highlight color (single page)"),
    type: "string",
    inputAs: "color",
    default: "#f59e0b",
    description: "default-color: `#f59e0b`",
  },
  {
    key: SettingKeys.boundariesHighlightColorToday,
    title: t("Highlight color (today)"),
    type: "string",
    inputAs: "color",
    default: "#22c55e",
    description: "default-color: `#22c55e`",
  },
  {
    key: SettingKeys.userColorList,
    title: t("User color") + "🆕",
    type: "string",
    inputAs: "textarea",
    default: "",
    // yyyy/mm/dd::ライブ参加の日 のような形式でtextareaに複数行で入力する
    // mm/dd::Birthday のような形式で入力すると、毎年その日に色が付く
    // textareaに複数行入力する
    description: `
    ${t("Input in the form of yyyy/mm/dd::Event name")}
    ${t("If you input in the form of mm/dd::Event name, the color will be applied every year on that day.")}
    ${t("Enter multiple lines in the textarea.")}
    `,
  },
  {
    key: SettingKeys.choiceUserColor,
    title: "",
    type: "string",
    inputAs: "color",
    default: "#00BFFF",
    description: t("User color") + "🆕",
  },
]
