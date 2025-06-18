import { addDays, format, getWeekOfMonth, isSaturday, isSunday, subDays } from "date-fns"
import { t } from "logseq-l10n"
import { HolidayUtil, Lunar } from "lunar-typescript"
import { getConfigPreferredDateFormat, getConfigPreferredLanguage } from "."
import { fetchJournalTitles } from "./fetchJournalTitles"
import { exportHolidaysBundle } from "./lib/holidays"
import { createLinkMonthlyLink, createSettingButton, getRelativeDateString, getDayOfWeekName, getQuarterFromWeekNumber, getRelativeTimeHtml, getWeeklyNumberFromDate, getWeeklyNumberString, getWeekNumberHtml, localizeMonthString, openPageFromPageName, userColor } from "./lib/lib"
import { separate } from "./journals/nav"

// プロセス中かどうかを判定するフラグ
let processingBehind: boolean = false

const createLinkElement = (text: string, title: string, onClick: (ev: MouseEvent) => void): HTMLAnchorElement => {
  const link = document.createElement("a")
  link.textContent = text
  link.title = title
  link.addEventListener("click", onClick)
  return link
}

const createSpanElement = (id: string, textContent: string, style: string = ""): HTMLSpanElement => {
  const spanElement = document.createElement("span")
  spanElement.id = id
  spanElement.textContent = textContent
  if (style) spanElement.style.cssText = style
  return spanElement
}

//Daily Journal Details 機能
export const dailyJournalDetails = async (dayDate: Date, titleElement: HTMLElement) => {
  if (processingBehind) return // プロセス中の場合は処理をキャンセルする

  // 日付のバリデーション
  if (!(dayDate instanceof Date) || isNaN(dayDate.getTime())) {
    console.error("Invalid date provided to dailyJournalDetails:", dayDate)
    return
  }

  const baseLineElement: HTMLSpanElement = createBaseLineElement(dayDate)
  moveTitleElement(titleElement)
  titleElement.insertAdjacentElement("afterend", baseLineElement)

  if (logseq.settings!.booleanMonthlyJournalLink)
    enableMonthlyJournalLink(dayDate, baseLineElement)

  addHolidayInfo(dayDate, baseLineElement)

  if (logseq.settings!.booleanPrevNextLink)
    baseLineElement.appendChild(enablePrevNextLink(dayDate, await getConfigPreferredDateFormat()))

  if (logseq.settings!.booleanSettingsButton)
    baseLineElement.appendChild(createSettingButton())

  addUserColor(dayDate, titleElement)

  setTimeout(() => processingBehind = false, 300)
}

const createBaseLineElement = (journalDate: Date): HTMLSpanElement => {
  // 日付のバリデーション
  if (!(journalDate instanceof Date) || isNaN(journalDate.getTime())) {
    console.error("Invalid date provided to createBaseLineElement:", journalDate)
    return createSpanElement("showWeekday", "")
  }

  const dayOfWeekName = getDayOfWeekName(journalDate)
  const printHtmlWeekNumber = getWeekNumberHtml(journalDate)
  const relativeTime = getRelativeTimeHtml(journalDate)

  const dateInfoElement: HTMLSpanElement = document.createElement("span")
  dateInfoElement.classList.add("showWeekday")
  dateInfoElement.innerHTML = logseq.settings!.booleanDayOfWeek
    ? logseq.settings!.booleanWeekendsColor
      ? `<span style="color:var(${isSaturday(journalDate) ? "--ls-wb-stroke-color-blue" : (isSunday(journalDate) ? "--ls-wb-stroke-color-red" : "")})">${dayOfWeekName}</span>${printHtmlWeekNumber}${relativeTime}`
      : `<span>${dayOfWeekName}</span>${printHtmlWeekNumber}${relativeTime}`
    : `${printHtmlWeekNumber}${relativeTime}`
  return dateInfoElement
}

const addHolidayInfo = async (dayDate: Date, baseLineElement: HTMLSpanElement) => {
  const userLanguage = await getConfigPreferredLanguage()
  if (userLanguage === "zh-Hant" || userLanguage === "zh-CN") {
    if (logseq.settings!.booleanUnderLunarCalendar || logseq.settings!.underHolidaysAlert) {
      const LunarDate = Lunar.fromDate(dayDate)
      if (logseq.settings!.booleanUnderLunarCalendar)
        enableUnderLunarCalendar(LunarDate, baseLineElement)
      if (logseq.settings!.underHolidaysAlert)
        enableUnderLunarCalendarHoliday(LunarDate, baseLineElement)
    }
  } else
    if (logseq.settings!.underHolidaysAlert)
      enableUnderHolidayForWorldCountry(dayDate, baseLineElement)
}

const addUserColor = (dayDate: Date, titleElement: HTMLElement) => {
  if (logseq.settings!.userColorList) {
    const eventName = userColor(dayDate, titleElement)
    if (eventName)
      titleElement.title = `${eventName}\n${titleElement.title}`
  }
}

const enablePrevNextLink = (journalDate: Date, preferredDateFormat: string) => {
  const prevNextLink = createSpanElement("journalTitleDetailsPrevNextLink", "")
  prevNextLink.classList.add("text-sm")

  // 前の日記のリンクボタンを作成する
  const prevLink = createLinkElement("←", t("Previous day"), (ev) => openPageFromPageName(format(subDays(journalDate, 1), preferredDateFormat), ev.shiftKey))
  prevNextLink.appendChild(prevLink)

  // ここに0.5文字分のスペースを入れる
  const space = createSpanElement("", "")
  space.style.padding = "0 0.5em"
  prevNextLink.appendChild(space)

  // 次の日記のリンクボタンを作成する
  const nextLink = createLinkElement("→", t("Next day"), (ev) => openPageFromPageName(format(addDays(journalDate, 1), preferredDateFormat), ev.shiftKey))
  prevNextLink.appendChild(nextLink)
  return prevNextLink
}

const moveTitleElement = (titleElement: HTMLElement) => {
  //h1から.blockを削除
  if (titleElement.classList.contains("block"))
    titleElement.classList.remove("block")

  //h1の中にdateInfoElementを挿入
  const aTag = titleElement.parentElement // 親要素を取得する

  if (aTag
    && aTag.tagName.toLowerCase() === "a") {
    //For journals
    //<a><h1>日付タイトル</h1></a>の構造になっているが、<h1><a>日付タイトル</a></h1>にしたい
    const titleElementTextContent = titleElement.textContent
    //titleElementのテキストコンテンツを削除
    titleElement.textContent = ""
    //aタグと同じ階層にtitleElementを移動する
    aTag.insertAdjacentElement("afterend", titleElement)
    //titleElementの中にaTagを移動する
    titleElement.appendChild(aTag)
    //移動したaタグの中身にtitleElementTextContentを戻す
    aTag.textContent = titleElementTextContent
    //aタグから.initial-colorを削除
    if (aTag.classList.contains("initial-color"))
      aTag.classList.remove("initial-color")
  }
}

export const enableRelativeTime = (journalDate: Date): string => {
  const formatString: string = getRelativeDateString(journalDate)
  return formatString !== "" ? `<span><small>(${formatString})</small></span>` : ""
}

export const enableWeekNumber = (journalDate: Date, weekStartsOn: 0 | 1): string => {
  let printHtmlWeekNumber: string = ""
  if (logseq.settings!.weekNumberOfTheYearOrMonth === "Year") {
    const { year, weekString }: { year: number; weekString: string } = getWeeklyNumberFromDate(journalDate, weekStartsOn as 0 | 1)
    const printWeekNumber = logseq.settings!.booleanWeekNumberHideYear === true && weekString !== "53"
      ? `W<strong>${weekString}</strong>`
      : `${year}-W<strong>${weekString}</strong>`
    const weeklyNumberString = getWeeklyNumberString(year, weekString, getQuarterFromWeekNumber(Number(weekString)))

    if (logseq.settings!.booleanWeeklyJournal === true) {
      const linkId = "weeklyJournal-" + weeklyNumberString
      printHtmlWeekNumber = `<span title="${t("Week number: ") + weeklyNumberString}"><a id="${linkId}">${printWeekNumber}</a></span>`
      setTimeout(() => {
        const element = parent.document.getElementById(linkId) as HTMLSpanElement
        if (element)
          element.addEventListener("click", ({ shiftKey }) => openPageFromPageName(weeklyNumberString, shiftKey))
      }, 150)
    } else {
      printHtmlWeekNumber = `<span title="${weeklyNumberString}">${printWeekNumber}</span>`
    }
  } else {
    // get week numbers of the month
    printHtmlWeekNumber = logseq.settings!.weekNumberFormat === "Japanese format"
      && logseq.settings!.localizeOrEnglish === "default"
      ? `<span title="1か月ごとの週番号">第<strong>${getWeekOfMonth(journalDate, { weekStartsOn })}</strong>週</span>`
      : `<span title="Week number within the month"><strong>W${getWeekOfMonth(journalDate, { weekStartsOn })}</strong><small>/m</small></span>`
  }
  return printHtmlWeekNumber
}

const enableMonthlyJournalLink = (journalDate: Date, dateInfoElement: HTMLSpanElement) => {
  const formatDateString: string = format(journalDate, `yyyy${separate()}MM`)
  dateInfoElement.appendChild(createLinkMonthlyLink(
    localizeMonthString(journalDate, true)
    , formatDateString
    , "Monthly Journal [[" + formatDateString + "]]"))
}

const enableUnderLunarCalendar = (LunarDate: Lunar, baseLineElement: HTMLSpanElement) => {
  const lunarCalendarElement = createSpanElement("lunarCalendarMonthAndDay", LunarDate.getYear() === (new Date().getFullYear()) ? LunarDate.toString().slice(5) : LunarDate.toString())
  baseLineElement.appendChild(lunarCalendarElement)
}

const enableUnderLunarCalendarHoliday = (LunarDate: Lunar, baseLineElement: HTMLSpanElement) => {
  const holiday = HolidayUtil.getHoliday(LunarDate.getYear() + LunarDate.getMonth() + LunarDate.getDay())
  if (holiday) {
    const lunarCalendarElement = createSpanElement("lunarCalendarHoliday", holiday.getName(), "text-decoration: underline")
    baseLineElement.appendChild(lunarCalendarElement)
  }
}

const enableUnderHolidayForWorldCountry = (journalDate: Date, baseLineElement: HTMLSpanElement) => {
  const bundle = exportHolidaysBundle()
  if (!bundle) return undefined
  const checkHoliday = bundle.isHoliday(journalDate)

  if (checkHoliday !== false
    && checkHoliday[0].type === "public") { // 公休日のみ
    const holidayName = checkHoliday[0].name
    if (holidayName) {
      const holidayElement = createSpanElement("holidayForWorldCountry", holidayName, "text-decoration: underline")
      baseLineElement.appendChild(holidayElement)
    }
  }
}

export const removeTitleQuery = () => {
  const titleBehindElements = parent.document.body.querySelectorAll("div#main-content-container div:is(.journal,.is-journals) h1.title+span.showWeekday") as NodeListOf<HTMLElement>
  titleBehindElements.forEach((titleElement) => titleElement.remove())
  const titleElements = parent.document.body.querySelectorAll("div#main-content-container div:is(.journal,.is-journals) h1.title[data-checked]") as NodeListOf<HTMLElement>
  titleElements.forEach((titleElement) => titleElement.removeAttribute("data-checked"))
}

// observer
export const observer = new MutationObserver(async (): Promise<void> => {
  observer.disconnect()
  await fetchJournalTitles(logseq.settings!.booleanBesideJournalTitle as boolean)
  setTimeout(() => observerMain(), 800)
})

//Credit: ottodevs  https://discuss.logseq.com/t/show-week-day-and-week-number/12685/18
export const observerMain = () => observer.observe(
  parent.document.getElementById("main-content-container") as HTMLDivElement,
  {
    attributes: true,
    subtree: true,
    attributeFilter: ["class"],
  }
)
