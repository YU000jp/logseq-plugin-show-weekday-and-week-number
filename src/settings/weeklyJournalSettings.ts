import { LSPluginBaseInfo, SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user"
import { t } from "logseq-l10n"
import { SettingKeys } from "./SettingKeys"
import { weekNumberFormat } from "./settings"

// 週間ジャーナル設定
export const weeklyJournalSettings = (logseqSettings: LSPluginBaseInfo['settings'] | undefined, logseqDbGraph: boolean, logseqMdModel: boolean): SettingSchemaDesc[] => [
  //Weekly Journal
  {
    key: SettingKeys.heading004,
    title: "4. " + t("Weekly Journal"),
    type: "heading",
    default: "",
    description: "",
  },
  {
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
  {
    // Headline of each days
    key: SettingKeys.booleanWeeklyJournalHeadline,
    title: t("Enable [headline of each days]") + "🆕",
    type: "boolean",
    default: false,
    // その週のジャーナルにあるプロパティの値を取得して、日付ごとにヘッドラインを表示するクエリーを自動生成する。過去のWeekly Journalには適用されません。
    description: t("Automatically generate a query to display headlines for each day by obtaining the value of the property in the journal for that week. Not applied to past Weekly Journals."),
  },
  {
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
  {
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
  {
    // If no daily journal page found, create link only instead of embed
    key: SettingKeys.booleanWeeklyJournalLinkOnly,
    title: t("If no page found, not create page (before today)") + "🆕",
    type: "boolean",
    default: false,
    description: t("If the daily journal page does not exist, create a link only instead of embed. This prevents automatic creation of new blank journal pages."),
  },
  {
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
]
