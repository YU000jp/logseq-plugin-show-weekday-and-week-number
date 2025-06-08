import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user"
import { t } from "logseq-l10n"
import { SettingKeys } from "./SettingKeys"
import { countryName, language } from "./languageCountry"


/* user setting */
// https://logseq.github.io/plugins/types/SettingSchemaDesc.html


export const weekNumberFormat: string[] = ["YYYY-Www", "YYYY/qqq/Www", "YYYY/Www", "YYYY-qqq-Www"]

const highlightColors: string[] = [
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

export const settingsTemplate = (userLanguage): SettingSchemaDesc[] => [

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
    type: "enum",
    enumChoices: highlightColors,
    default: "--highlight-bg-color",
    description: "default: `--highlight-bg-color`",
  },
  {//20240120
    key: SettingKeys.booleanBoundariesIndicator,
    title: t("Show indicator of journal entries") + "🆙",
    type: "boolean",
    default: true,
    //ページが存在する場合に、インディケーターを表示する
    description: "",
  },
  {//week start 通常はformatに従う
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
  {//20240906
    key: SettingKeys.userWeekendMon,
    title: t("Decide the colour of Monday.") + "🆕",
    type: "enum",
    enumChoices: ["", "blue", "red", "green"],
    default: "",
    description: "",
  },
  {//20240906
    key: SettingKeys.userWeekendTue,
    title: t("Decide the colour of Tuesday.") + "🆕",
    type: "enum",
    enumChoices: ["", "blue", "red", "green"],
    default: "",
    description: "",
  },
  {//20240906
    key: SettingKeys.userWeekendWed,
    title: t("Decide the colour of Wednesday.") + "🆕",
    type: "enum",
    enumChoices: ["", "blue", "red", "green"],
    default: "",
    description: "",
  },
  {//20240906
    key: SettingKeys.userWeekendThu,
    title: t("Decide the colour of Thursday.") + "🆕",
    type: "enum",
    enumChoices: ["", "blue", "red", "green"],
    default: "",
    description: "",
  },
  {//20240906
    key: SettingKeys.userWeekendFri,
    title: t("Decide the colour of Friday.") + "🆕",
    type: "enum",
    enumChoices: ["", "blue", "red", "green"],
    default: "",
    description: "",
  },
  {//20240906
    key: SettingKeys.userWeekendSat,
    title: t("Decide the colour of Saturday.") + "🆕",
    type: "enum",
    enumChoices: ["blue", "", "red", "green"],
    default: "blue",
    description: "",
  },
  {//20240906
    key: SettingKeys.userWeekendSun,
    title: t("Decide the colour of Sunday.") + "🆕",
    type: "enum",
    enumChoices: ["red", "", "blue", "green"],
    default: "red",
    description: "",
  },
  {//ハイライトカラーの指定(シングルページ)
    key: SettingKeys.boundariesHighlightColorSinglePage,
    title: t("Highlight color (single page)"),
    type: "string",
    inputAs: "color",
    default: "#f59e0b",
    description: "default-color: `#f59e0b`",
  },
  {//ハイライトカラーの指定(今日の日付)
    key: SettingKeys.boundariesHighlightColorToday,
    title: t("Highlight color (today)"),
    type: "string",
    inputAs: "color",
    default: "#22c55e",
    description: "default-color: `#22c55e`",
  },
  {//今日以前のページを開こうとして、それが見つからない場合は、ページを作成しない
    key: SettingKeys.booleanNoPageFoundCreatePage,
    title: t("If no page found, not create page (before today)"),
    type: "boolean",
    default: true,
    description: "",
  },
  {// 特定の日付に色を付けるためのユーザー設定
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
  {//ユーザーカラーの指定
    key: SettingKeys.choiceUserColor,
    title: "",
    type: "string",
    inputAs: "color",
    default: "#00BFFF",
    description: t("User color") + "🆕",
  },
  // 共通設定ここまで



  //Behind journal title
  {
    key: SettingKeys.heading001,
    title: "1. " + t("Daily Journal Details"),
    type: "heading",
    default: "",
    description: "",
  },
  { // 有効トグル
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
  {// 20240123
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
  {//Monthly Journalのリンクを作成する
    key: SettingKeys.booleanMonthlyJournalLink,
    title: t("Enable monthly journal link"),
    type: "boolean",
    default: false,
    // [[2023/10]]のような階層のMonthly Journalを開くリンクを設置する
    description: t("Place a link to open the Monthly Journal of the hierarchy like [[2023/10]]"),
  },
  {//設定ボタンを表示する
    key: SettingKeys.booleanSettingsButton,
    title: t("Show settings button"),
    type: "boolean",
    default: true,
    description: "",
  },
  {//前後へのリンクを表示する
    //20240721
    key: SettingKeys.booleanPrevNextLink,
    title: t("Show previous and next link") + "🆕",
    type: "boolean",
    default: true,
    description: t("Single journal page only"),
  },
  // ここまでトグルの対象



  // Journal Boundaries

  // Two-lines mini-Calendar
  {
    key: SettingKeys.heading002,
    title: "2. " + t("Two-lines mini-Calendar") + t("(Journal Boundaries)"),
    type: "heading",
    default: "",
    description: "",
  },
  { // 有効トグル
    key: SettingKeys.booleanBoundariesAll,
    title: t("Enable feature"),
    type: "boolean",
    default: false,
    description: "",
  },
  { // 有効トグル
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
  { // Weekly Journalで有効にするかどうか
    key: SettingKeys.booleanBoundariesOnWeeklyJournal,
    title: "",
    type: "boolean",
    default: false,
    description: t("Use on Weekly Journal"),
  },
  { // Monthly Journalで有効にするかどうか
    key: SettingKeys.booleanBoundariesOnMonthlyJournal,
    title: "",
    type: "boolean",
    default: false,
    description: t("Use on Monthly Journal") + "🆕",
  },
  { // Quarterly Journalで有効にするかどうか
    key: SettingKeys.booleanBoundariesOnQuarterlyJournal,
    title: "",
    type: "boolean",
    default: false,
    description: t("Use on Quarterly Journal") + "🆕",
  },
  { // Yearly Journalで有効にするかどうか
    key: SettingKeys.booleanBoundariesOnYearlyJournal,
    title: "",
    type: "boolean",
    default: false,
    description: t("Use on Yearly Journal") + "🆕",
  },
  {//20240108
    key: SettingKeys.boundariesBottom,
    title: t("Show it on bottom"),
    type: "boolean",
    default: true,
    description: "",
  },
  {//月を表示する
    key: SettingKeys.booleanBoundariesShowMonth,
    title: t("Show month"),
    type: "boolean",
    default: true,
    description: "",
  },
  {//週番号を表示する
    key: SettingKeys.booleanBoundariesShowWeekNumber,
    title: t("Show week number"),
    type: "boolean",
    default: true,
    description: "",
  },
  //20240121
  {
    key: SettingKeys.booleanBoundariesHolidays,
    //休日をハイライトする
    title: t("Highlight holidays"),
    type: "boolean",
    default: true,
    description: "",
  },
  // ここまでトグルの対象



  // Left Calendar 20240714-
  {
    key: SettingKeys.heading003,
    title: "3. " + t("Left Calendar") + t("(Journal Boundaries)") + "🆙",
    type: "heading",
    default: "",
    description: "",
  },
  {// 有効トグル
    key: SettingKeys.booleanLeftCalendar,
    title: t("Enable feature"),
    type: "boolean",
    default: true,
    description: "",
  },
  {//週番号を表示する
    key: SettingKeys.booleanLcWeekNumber,
    title: t("Show week number"),
    type: "boolean",
    default: true,
    description: "",
  },
  {// 祝日をハイライトするかどうか
    key: SettingKeys.booleanLcHolidays,
    title: t("Highlight holidays"),
    type: "boolean",
    default: true,
    description: "",
    //共通設定に、choiceHolidaysColorあり
  },
  {// 祝日のアラートを表示するかどうか
    key: SettingKeys.lcHolidaysAlert,
    title: t("Enable Holidays alert"),
    type: "enum",
    enumChoices: ["none", "Today only", "Monthly"],
    default: "Today only",
    description: "",
  },
  // ここまでトグルの対象



  //Weekly Journal
  {
    key: SettingKeys.heading004,
    title: "4. " + t("Weekly Journal"),
    type: "heading",
    default: "",
    description: "",
  },
  { // 有効トグル
    key: SettingKeys.booleanWeeklyJournal,
    title: t("Enable feature"),
    type: "boolean",
    default: true,
    description: t("Enable the link and function. If there is no content available on a page with a week number like 2023-W25, a template will be inserted."),
  },
  {
    key: SettingKeys.weeklyJournalTemplateName,
    title: t("Template name"),
    type: "string",
    default: "",
    description: t("Input the template name (default is blank)"),
  },
  {
    key: SettingKeys.weeklyJournalSetPageTag,
    title: t("Set page tag (Add to tags property)"),
    type: "string",
    default: "",
    description: t("Input a page name (default is blank)"),
  },
  {//20240615
    // Headline of each days
    key: SettingKeys.booleanWeeklyJournalHeadline,
    title: t("Enable [headline of each days]") + "🆕",
    type: "boolean",
    default: false,
    // その週のジャーナルにあるプロパティの値を取得して、日付ごとにヘッドラインを表示するクエリーを自動生成する。過去のWeekly Journalには適用されません。
    description: t("Automatically generate a query to display headlines for each day by obtaining the value of the property in the journal for that week. Not applied to past Weekly Journals."),
  },
  {//20240615
    // Headline of each days用 プロパティ名指定
    key: SettingKeys.weeklyJournalHeadlineProperty,
    title: t("headline of each days > Property name for headline of each days") + "🆕",
    type: "string",
    default: "headline",
    // 各ジャーナルのブロックに、このプロパティ名を持つブロックを用意します。ジャーナルテンプレートに取り込むと便利です。変更すると、リネームがおこなわれます。
    description: t("Prepare a block with this property name in each journal block. It is convenient to incorporate it into the journal template. If you change it, the rename will be done."),
  },
  {
    key: SettingKeys.booleanWeeklyJournalThisWeek,
    title: t("Enable \"This Week\" section"),
    type: "boolean",
    default: true,
    // 各曜日へのリンク。マウスオーバーでツールチップ
    description: t("Links to each day. Tooltip on mouseover."),
  },
  {//20240629
    //This Week セクションに、各曜日のページを埋め込む (アナログ手帳のように横並びにする)
    key: SettingKeys.weeklyEmbed,
    title: t("Side opening workspace > Embed each day's page in the \"This Week\" section "),
    type: "boolean",
    default: true,
    // 上の項目が有効の場合のみ有効
    // アナログ手帳のように横並びにする
    // `#.ThisWeek` タグが `This Week` セクションに追加されます。タグが追加されると、ポップアップが表示されます。(過去セクションにはタグが追加されません。)
    // ページに移動することなく、そのまま表示・編集することができます。
    description: `
    ${t("Only effective if the above item is enabled")}
    ${t("Like an analog notebook with side-by-side pages")}
    ${t("The `#.ThisWeek` tag is added to the `This Week` section. If the tag is added, a popup will be displayed. (The tag is not added to the past section.)")}
    ${t("You can view and edit it as it is without moving to that page.")}`,
  },
  {//20240518
    key: SettingKeys.weekNumberOptions,
    title: t("Week number format options") + "🆕",
    type: "enum",
    enumChoices: weekNumberFormat,
    default: "YYYY-Www",
    description: t("This is a breaking change for existing users. Please change the old page name using one of the following toggles.")
  },
  {
    key: SettingKeys.heading011,
    title: t("For compatibility. Replace page titles (Weekly Journals)"),
    type: "heading",
    default: "",
    description: `
      YYYY: ${t("4-digit year")} (e.g. 2023)
      qqq: ${t("Quarter")} (e.g. Q1)
      Www: ${t("Week")} (e.g. W30)
  
      ${t("year range")}: 2022-${new Date().getFullYear() + 1}
      ${t("Click this toggle to run it.")}
      `,
  },
  //20240518
  {
    key: SettingKeys.weekNumberChangeQ,
    title: " YYYY-Www  ->  YYYY/qqq/Www",
    type: "boolean",
    default: false,
    description: "",
  },
  //20240518
  {
    key: SettingKeys.weekNumberChangeQS,
    title: " YYYY/Www  ->  YYYY/qqq/Www",
    type: "boolean",
    default: false,
    description: "",
  },
  //20240518
  {
    key: SettingKeys.weekNumberChangeSlash,
    title: " YYYY-Www  ->  YYYY/Www",
    type: "boolean",
    default: false,
    description: "",
  },
  //20240519
  {
    key: SettingKeys.weekNumberChangeRevert,
    title: " YYYY/qqq/Www  ->  YYYY/Www",
    type: "boolean",
    default: false,
    description: "",
  },
  {
    key: SettingKeys.weekNumberChangeToQfull,
    title: " YYYY-Www  ->  YYYY-qqq-Www",
    type: "boolean",
    default: false,
    description: "",
  },
  {
    key: SettingKeys.weekNumberChangeFRevertToISO,
    title: " YYYY-qqq-Www  ->  YYYY-Www",
    type: "boolean",
    default: false,
    description: "",
  },
  // ここまでトグルの対象



  //Monthly Journal
  {
    key: SettingKeys.heading005,
    title: "5. " + t("Monthly Journal"),
    type: "heading",
    default: "",
    description: "",
  },
  { // 有効トグル
    key: SettingKeys.booleanMonthlyJournal,
    title: t("Enable feature"),
    type: "boolean",
    default: true,
    description: t("Enable the link and function. If there is no content available on a page with a month number like 2024/05, a template will be inserted."),
  },
  {
    key: SettingKeys.monthlyJournalTemplateName,
    title: t("Template name"),
    type: "string",
    default: "",
    description: t("Input the template name (default is blank)"),
  },
  // ここまでトグルの対象



  //Quarterly Journal
  {
    key: SettingKeys.heading006,
    title: "6. " + t("Quarterly Journal"),
    type: "heading",
    default: "",
    description: "",
  },
  { // 有効トグル
    key: SettingKeys.booleanQuarterlyJournal,
    title: t("Enable feature"),
    type: "boolean",
    default: true,
    description: t("Enable the link and function. If there is no content available on a page with a quarterly number like 2024/Q1, a template will be inserted."),
  },
  {
    key: SettingKeys.quarterlyJournalTemplateName,
    title: t("Template name"),
    type: "string",
    default: "",
    description: t("Input the template name (default is blank)"),
  },
  {
    key: SettingKeys.quarterlyJournalSetPageTag,
    title: t("Set page tag (Add to tags property)"),
    type: "string",
    default: "",
    description: t("Input a page name (default is blank)"),
  },
  // ここまでトグルの対象


  // Yearly Journal
  {//20240721
    key: SettingKeys.heading007,
    title: "7. " + t("Yearly Journal") + "🆕",
    type: "heading",
    default: "",
    description: "",
  },
  { // 有効トグル
    key: SettingKeys.booleanYearlyJournal,
    title: t("Enable feature"),
    type: "boolean",
    default: true,
    description: t("Enable the link and function. If there is no content available on a page with a yearly number like 2024, a template will be inserted."),
  },
  {// テンプレート名
    key: SettingKeys.yearlyJournalTemplateName,
    title: t("Template name"),
    type: "string",
    default: "",
    description: t("Input the template name (default is blank)"),
  },
]