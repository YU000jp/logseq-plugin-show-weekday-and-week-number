import { BlockUUID } from "@logseq/libs/dist/LSPlugin.user"
import { getISOWeek, getISOWeekYear, getWeek, getWeekYear } from "date-fns"
import { t } from "logseq-l10n"

export const getJournalDayDate = (str: string): Date => new Date(
  Number(str.slice(0, 4)), //year
  Number(str.slice(4, 6)) - 1, //month 0-11
  Number(str.slice(6)) //day
)

//日付から週番号を求める
export function getWeeklyNumberFromDate(journalDate: Date, weekStartsOn: 0 | 1): { year: number, weekString: string } {
  let year: number
  let week: number
  if (logseq.settings?.weekNumberFormat === "ISO(EU) format") {
    year = getISOWeekYear(journalDate)
    week = getISOWeek(journalDate)
  } else {
    //NOTE: getWeekYear関数は1月1日がその年の第1週の始まりとなる(デフォルト)
    //weekStartsOnは先に指定済み
    year = getWeekYear(journalDate, { weekStartsOn })
    week = getWeek(journalDate, { weekStartsOn })
  }
  const weekString: string = (week < 10) ? String("0" + week) : String(week) //weekを2文字にする
  return { year, weekString }//weekを2文字にする
}

//日付からローカライズされた曜日を求める
export const localizeDayOfWeek = (weekday, journalDate: Date, locales?: string) => new Intl.DateTimeFormat((locales ? locales : "default"), { weekday }).format(journalDate)

//titleElementの日付をローカライズする(Element書き換え)
export function titleElementReplaceLocalizeDayOfWeek(journalDate: Date, titleElement: HTMLElement) {
  const replace = (textContent, long: string, short: string) => {
    textContent = textContent!.replace(long, localizeDayOfWeek("long", journalDate))
    textContent = textContent!.replace(short, localizeDayOfWeek("short", journalDate))
  }
  const dayOfWeek = journalDate.getDay() //journalDateで曜日を取得する
  switch (dayOfWeek) {
    case 0:
      replace(titleElement.textContent, "Sunday", "Sun")
      break
    case 1:
      replace(titleElement.textContent, "Monday", "Mon")
      break
    case 2:
      replace(titleElement.textContent, "Tuesday", "Tue")
      break
    case 3:
      replace(titleElement.textContent, "Wednesday", "Wed")
      break
    case 4:
      replace(titleElement.textContent, "Thursday", "Thu")
      break
    case 5:
      replace(titleElement.textContent, "Friday", "Fri")
      break
    case 6:
      replace(titleElement.textContent, "Saturday", "Sat")
      break
  }
}

//相対時間表示
export const formatRelativeDate = (targetDate: Date): string => {
  const currentDate = new Date()

  // 日付を比較するために年月日の部分だけを取得
  const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
  const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())

  // 比較した結果、同じ日付だった場合は空文字を返す
  // if (targetDateOnly.getTime() === currentDateOnly.getTime()) {
  //   return '';
  // }
  // 相対的な日付差を計算
  const diffInDays: number = Math.floor((targetDateOnly.getTime() - currentDateOnly.getTime()) / (1000 * 60 * 60 * 24))

  // 相対的な日付差をローカライズした文字列に変換
  return new Intl.RelativeTimeFormat(("default"), { numeric: 'auto' }).format(diffInDays, 'day') as string
} //formatRelativeDate end

export const getWeekStartOn = (): 0 | 1 | 6 => {
  let weekStartsOn: 0 | 1 | 6
  switch (logseq.settings!.boundariesWeekStart) {
    case "Sunday":
      weekStartsOn = 0
      break
    case "Monday":
      weekStartsOn = 1
      break
    case "Saturday":
      weekStartsOn = 6
      break
    default: //"unset"
      weekStartsOn = (logseq.settings?.weekNumberFormat === "US format") ? 0 : 1
      break
  }
  return weekStartsOn
}

// プラグイン初期設定用。実際は「:」より前の文字列を使い、指定する
export const convertLanguageCodeToCountryCode = (languageCode: string): string => {
  switch (languageCode) {
    case "en":
      return "US: United States of America"
    case "fr":
      return "FR: France"
    case "de":
      return "DE: Deutschland"
    case "nl":
      return "NL: Nederland"
    case "zh-CN":
      return "CN: 中华人民共和国"
    case "zh-Hant":
      return "TW: 中華民國"
    case "af":
      return "ZA: South Africa"
    case "es":
      return "ES: España"
    case "nb-NO":
      return "NO: Norge"
    case "pl":
      return "PL: Polska"
    case "pt-BR":
      return "BR: Brasil"
    case "pt-PT":
      return "PT: Portugal"
    case "ru":
      return "RU: Россия"
    case "ja":
      return "JP: 日本"
    case "it":
      return "IT: Italia"
    case "tr":
      return "TR: Türkiye"
    case "uk":
      return "UA: Україна"
    case "ko":
      return "KR: 대한민국"
    case "sk":
      return "SK: Slovenská republika"
    default:
      return "US: United States of America"
  }
}

export const createSettingButton = (): HTMLButtonElement => {
  const button: HTMLButtonElement = document.createElement("button")
  button.textContent = "⚙"
  button.title = t("Open plugin setting")
  button.style.marginLeft = "1em"
  button.addEventListener("click", () => {
    logseq.showSettingsUI()
  })
  return button
}

export const createLinkMonthlyLink = (linkString: string, pageName: string, elementTitle: string): HTMLButtonElement => {
  const button: HTMLButtonElement = document.createElement("button")
  button.textContent = linkString
  button.title = elementTitle
  button.style.marginLeft = "1em"
  button.addEventListener("click", ({ shiftKey }) => openPageFromPageName(pageName, shiftKey))
  return button
}

export const openPageFromPageName = async (pageName: string, shiftKey: boolean) => {
  if (shiftKey === true) {
    const page = await logseq.Editor.getPage(pageName) as { uuid: BlockUUID } | null
    if (page) logseq.Editor.openInRightSidebar(page.uuid) //ページが存在しない場合は開かない
  } else {
    logseq.App.replaceState('page', { name: pageName })
  }
}

export const removeProvideStyle = (className: string) => {
  const doc = parent.document.head.querySelector(
    `style[data-injected-style^="${className}"]`
  ) as HTMLStyleElement | null
  if (doc) doc.remove()
}
