import { BlockUUID, PageEntity } from '@logseq/libs/dist/LSPlugin.user'
import { addDays, format, isFriday, isSameDay, isSaturday, isSunday, isThursday, isToday, isWednesday, startOfISOWeek, startOfWeek } from 'date-fns' //https://date-fns.org/
import { t } from "logseq-l10n"
import { getConfigPreferredDateFormat, getConfigPreferredLanguage } from '..'
import { holidaysWorld, lunarString } from '../lib/holidays'
import { DayShortCode, addEventListenerOnce, colorMap, createElementWithClass, formatRelativeDate, getJournalDayDate, getWeekStartOn, getWeeklyNumberFromDate, getWeeklyNumberString, localizeDayOfWeekString, localizeMonthString, openPageFromPageName, shortDayNames, userColor } from '../lib/lib'
import { advancedQuery, queryCodeFileFromOriginalName } from '../lib/query/advancedQuery'


let processingFoundBoundaries: boolean = false
export const boundariesProcess = async (targetElementName: string, remove: boolean, repeat: number, selectStartDate?: Date) => {
  if (repeat >= 3
    || processingFoundBoundaries === true) return
  if (!selectStartDate
    || (targetElementName === "weeklyJournal"
      && remove === true)) { //selectStartDateがある場合はチェックしない
    const checkWeekBoundaries = parent.document.getElementById('boundariesInner') as HTMLDivElement | null
    if (checkWeekBoundaries) {
      if (remove === true) checkWeekBoundaries.remove()
      else return
    }
  }

  let firstElement: HTMLDivElement | null
  switch (targetElementName) {
    case "journals":
      firstElement = parent.document.getElementById("journals") as HTMLDivElement
      break
    case "is-journals":
      firstElement = parent.document.body.querySelector("#main-content-container div.is-journals.page>div.relative") as HTMLDivElement
      break
    case "weeklyJournal":
      firstElement = parent.document.body.querySelector("#main-content-container div.page.relative>div.relative") as HTMLDivElement
      break
    default:
      firstElement = null
      break
  }
  if (firstElement === null)
    setTimeout(() => boundariesProcess(targetElementName, false, repeat + 1), 300)
  processingFoundBoundaries = true//ここからreturnする場合は必ずfalseにすること


  const weekStartsOn: 0 | 1 | 6 = getWeekStartOn()

  if (firstElement) {
    const today = new Date()
    //スクロールの場合とそうでない場合でweekBoundariesを作成するかどうかを判定する
    let weekBoundaries: HTMLDivElement
    if (selectStartDate) {
      if (targetElementName === "weeklyJournal") {
        weekBoundaries = parent.document.getElementById("weekBoundaries") as HTMLDivElement | null || document.createElement('div')
        weekBoundaries.id = 'weekBoundaries'
      } else
        weekBoundaries = parent.document.getElementById("weekBoundaries") as HTMLDivElement
    } else {
      weekBoundaries = document.createElement('div')
      weekBoundaries.id = 'weekBoundaries'
    }
    firstElement.insertBefore(weekBoundaries, firstElement.firstChild)

    //weekBoundariesにelementを追加する
    const boundariesInner: HTMLDivElement = document.createElement('div')
    boundariesInner.id = 'boundariesInner'

    let targetDate: Date//今日の日付もしくはそのページの日付を求める
    if (targetElementName === 'journals')
      targetDate = today
    else
      if (targetElementName === 'is-journals') {
        const { journalDay } = await logseq.Editor.getCurrentPage() as { journalDay: PageEntity["journalDay"] }
        if (!journalDay) {
          console.error('journalDay is undefined')
          processingFoundBoundaries = false
          return
        }
        targetDate = getJournalDayDate(String(journalDay)) as Date
      } else
        if (targetElementName === "weeklyJournal")
          targetDate = selectStartDate as Date
        else {
          console.error('targetElementName is undefined')
          processingFoundBoundaries = false
          return
        }

    // 次の週を表示するかどうかの判定
    const flagShowNextWeek: boolean = checkIfNextWeekVisible(weekStartsOn, isThursday(targetDate), isFriday(targetDate), isSaturday(targetDate), targetDate)

    await createDaysElements(
      getWeekOffsetDays(flagShowNextWeek) as number[], //どの週を表示するか
      selectStartDate ? //targetDateを週の初めにする
        selectStartDate :
        weekStartsOn === 1
          && logseq.settings?.weekNumberFormat === "ISO(EU) format"
          ? startOfISOWeek(targetDate)
          : startOfWeek(targetDate, { weekStartsOn }),
      boundariesInner,
      today,
      targetDate,
      targetElementName,
      flagShowNextWeek
    )
    weekBoundaries.appendChild(boundariesInner)
  }
  processingFoundBoundaries = false
}


const daySideWeekNumber = (date: Date, boundariesInner: HTMLDivElement) => {
  const { year, weekString, quarter } = getWeeklyNumberFromDate(date, logseq.settings?.weekNumberFormat === "US format" ? 0 : 1) // 週番号を取得する
  const weekNumberString = getWeeklyNumberString(year, weekString, quarter) // 週番号からユーザー指定文字列を取得する
  const weekNumberElement = createElementWithClass('span', 'daySide', 'daySideWeekNumber')
  weekNumberElement.innerText = "W" + weekString
  weekNumberElement.title = t("Week number: ") + weekNumberString
  if (logseq.settings!.booleanWeeklyJournal === true)
    addEventListenerOnce(weekNumberElement, "click", (event) => openPageFromPageName(weekNumberString, (event as MouseEvent).shiftKey))
  else
    weekNumberElement.style.cursor = 'unset'
  boundariesInner.appendChild(weekNumberElement)
}


const daySideMonth = (date: Date, boundariesInner: HTMLDivElement, monthDuplicate: Date | null): Date => {
  const sideMonthElement = createElementWithClass('span', 'daySide')
  //monthDuplicateが存在したら、dateの6日後を代入する
  const dateShowMonth: Date = monthDuplicate ? addDays(date, 6) as Date : date

  const monthString: string = localizeMonthString(dateShowMonth, false)
  sideMonthElement.innerText = monthString

  if (monthDuplicate //上下の月が一致する場合は、非表示にする
    && dateShowMonth.getMonth() === monthDuplicate.getMonth()
    && dateShowMonth.getFullYear() === monthDuplicate.getFullYear()) {
    sideMonthElement.style.visibility = 'hidden'
  } else {
    const monthString: string = format(dateShowMonth, "yyyy/MM")
    sideMonthElement.title = monthString
    sideMonthElement.addEventListener("click", ({ shiftKey }) => openPageFromPageName(monthString, shiftKey))// 2023/10のようなページを開く
  }
  boundariesInner.appendChild(sideMonthElement)
  return dateShowMonth
}


// 週の上下スクロールボタン
const weekScrollButtons = (index: number, boundariesInner: HTMLDivElement, targetElementName: string, startDate: Date) => {
  const sideScrollElement = createElementWithClass('span', 'daySide', 'daySideScroll')
  sideScrollElement.innerText = index === 6 ? '↑' : '↓'
  sideScrollElement.title = index === 6 ? t("Previous week") : t("Next week")
  boundariesInner.appendChild(sideScrollElement)
  addEventListenerOnce(sideScrollElement, 'click', () => {
    //boundariesInnerを削除する
    boundariesInner.remove()
    //startDateを1週間ずらす
    boundariesProcess(targetElementName, true, 0, addDays(startDate, index === 6 ? -7 : 7) as Date)
  })
}


// 1日ずつ区画を作成する
const createDaysElements = async (days: number[], startDate: Date, boundariesInner: HTMLDivElement, today: Date, targetDate: Date, targetElementName: string, flagShowNextWeek: boolean) => {
  let monthDuplicate: Date | null = null
  const preferredDateFormat = await getConfigPreferredDateFormat()
  //ミニカレンダー作成 1日ずつ処理
  for (const [index, numDays] of days.entries()) {
    const dayDate: Date = numDays === 0 ? startDate : addDays(startDate, numDays) as Date // dateを取得する
    const dateFormatString: string = format(dayDate, preferredDateFormat) //日付をフォーマットする
    const dayCell = createElementWithClass('span', 'day')
    try {
      if (index === 7) {
        const element: HTMLDivElement = document.createElement('div')
        element.style.width = "100%"
        boundariesInner.append(element)
      }
      if (index === 0
        || index === 7)
        //daySideElement作成    
        //月を表示する場合
        if (logseq.settings!.booleanBoundariesShowMonth === true)
          monthDuplicate = daySideMonth(dayDate, boundariesInner, monthDuplicate) //daySideElement作成

      //dayElement作成
      // const isBooleanBeforeToday: boolean = isBefore(dayDate, today)
      const isBooleanToday: boolean = isToday(dayDate)
      const isBooleanTargetSameDay: boolean = isSameDay(targetDate, dayDate)
      dayCell.classList.add('day')
      const dayOfWeekElement: HTMLSpanElement = document.createElement('span')
      dayOfWeekElement.classList.add('dayOfWeek')
      dayOfWeekElement.innerText = localizeDayOfWeekString(dayDate, false) // 曜日を取得する

      // 20240121
      // 祝日のカラーリング機能
      if (logseq.settings!.booleanBoundariesHolidays === true) {
        const configPreferredLanguage = await getConfigPreferredLanguage()
        // Chinese lunar-calendar and holidays
        if (logseq.settings!.booleanLunarCalendar === true // プラグイン設定で太陰暦オンの場合
          && (configPreferredLanguage === "zh-Hant" //中国語の場合
            || configPreferredLanguage === "zh-CN")) {
          dayOfWeekElement.style.fontSize = ".88em"
          dayOfWeekElement.innerHTML += ` <smaLl>${lunarString(dayDate, dayCell, true)}</small>` //文字数が少ないため、小さく祝日名を表示する
        } else {
          // World holidays
          const displayNameOfHoliday = holidaysWorld(dayDate, dayCell, true)
          if (displayNameOfHoliday
            && (configPreferredLanguage === "ja" //日本語の場合
              || configPreferredLanguage === "ko" // 韓国語の場合
            )) dayOfWeekElement.innerHTML += ` <smaLl>${displayNameOfHoliday}</small>` //文字数が少ないため、小さく祝日名を表示する
        }
      }

      dayCell.appendChild(dayOfWeekElement)
      const dayOfMonthElement: HTMLSpanElement = document.createElement('span')
      dayOfMonthElement.classList.add('dayOfMonth')
      dayOfMonthElement.innerText = `${dayDate.getDate()}`
      dayCell.appendChild(dayOfMonthElement)
      //日付と相対時間をtitleに追加する
      dayCell.title += logseq.settings?.booleanRelativeTime === true ?
        dateFormatString + '\n' + formatRelativeDate(dayDate)//相対時間を表示する場合
        : dateFormatString

      //indexが0~6
      if (targetElementName === 'weeklyJournal') {
        if (index >= 7
          && index <= 14)
          dayCell.classList.add('thisWeek')
      } else {
        if ((flagShowNextWeek === true
          && index < 7)
          || (flagShowNextWeek === false
            && index > 6))
          dayCell.classList.add('thisWeek')
      }
      if (targetElementName !== 'journals'
        && targetElementName !== "weeklyJournal"
        && isBooleanTargetSameDay === true)
        dayCell.style.border = `1px solid ${logseq.settings!.boundariesHighlightColorSinglePage}` //シングルページの日付をハイライト
      else
        if (isBooleanToday === true)
          dayCell.style.border = `1px solid ${logseq.settings!.boundariesHighlightColorToday}` //今日をハイライト

      if (logseq.settings?.booleanWeekendsColor === true)
        applyWeekendColor(dayCell, shortDayNames[dayDate.getDay()])

      // ユーザー設定日
      if (logseq.settings!.userColorList as string !== "") {
        const eventName = userColor(dayDate, dayCell)
        if (eventName)
          dayCell.title = `${eventName}\n${dayCell.title}`
      }

      dayCell.addEventListener("click", openPageToSingleDay(dateFormatString))

      //20240115
      //エントリーが存在するかどうかのインディケーターを表示する
      if (logseq.settings!.booleanBoundariesIndicator === true)
        await indicator(dateFormatString, dayOfMonthElement)

    } finally {
      boundariesInner.appendChild(dayCell)
      if (index === 6
        || index === 13) {
        //daySideElement作成    
        //週番号を表示する場合
        if (logseq.settings!.booleanBoundariesShowWeekNumber === true)
          daySideWeekNumber(dayDate, boundariesInner)
        weekScrollButtons(index, boundariesInner, targetElementName, startDate)
      }
    }
  }
}


// 日誌のページが存在するかどうかのインディケーターを表示する
const indicator = async (targetPageName: string, dayOfMonthElement: HTMLSpanElement) => {
  const pageEntities = await advancedQuery(queryCodeFileFromOriginalName, `"${targetPageName}"`) as { file: PageEntity["file"] }[] | null
  if (pageEntities && pageEntities.length > 0)
    if (pageEntities[0].file) {
      const indicatorElement = createElementWithClass('span', 'indicator')
      indicatorElement.innerText = "●"
      indicatorElement.title = t("Page exists")
      dayOfMonthElement.appendChild(indicatorElement)
    }
}


// 週末の色を適用する
const applyWeekendColor = (dayCell: HTMLElement, day: DayShortCode) => {
  const color = colorMap[logseq.settings!["userWeekend" + day] as string]
  if (color) dayCell.style.color = color
}


//次の週を表示するかどうかの判定
const checkIfNextWeekVisible = (weekStartsOn: number, isDayThursday: boolean, isDayFriday: boolean, isDaySaturday: boolean, targetDate: Date): boolean =>
  //日曜日始まり、木曜、金曜、土曜がtargetDateの場合
  (weekStartsOn === 0 && (isDayThursday || isDayFriday || isDaySaturday))
    //月曜日始まり、金曜、土曜、日曜がtargetDateの場合
    || (weekStartsOn === 1 && (isDayFriday || isDaySaturday || isSunday(targetDate)))
    //土曜日始まり、水曜、木曜、金曜がtargetDateの場合
    || (weekStartsOn === 6 && (isWednesday(targetDate) || isDayThursday || isDayFriday))
    ? true : false


//どの週を表示するか
const getWeekOffsetDays = (flagShowNextWeek: boolean): number[] =>
  flagShowNextWeek === true ?
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] //次の週を表示する場合
    : [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6] //次の週を表示しない場合


// 日誌のページを開く function
export function openPageToSingleDay(pageName: string): (this: HTMLSpanElement, ev: MouseEvent) => any {
  return async (event) => {
    if (event.shiftKey) {//Shiftキーを押しながらクリックした場合は、サイドバーでページを開く
      const page = await logseq.Editor.getPage(pageName, { includeChildren: false }) as { uuid: BlockUUID } | null
      if (page)
        logseq.Editor.openInRightSidebar(page.uuid)//ページが存在しない場合は開かない
    } else
      //Shiftキーを押さずにクリックした場合は、ページを開く
      if (logseq.settings!.booleanNoPageFoundCreatePage === true)
        //ページが存在しない場合は作成しない
        if (await logseq.Editor.getPage(pageName) as { name: string } | null)
          logseq.App.pushState('page', { name: pageName })//ページが存在する場合は開く
        else
          logseq.UI.showMsg(t("Page not found"), "warning", { timeout: 3000 })//ページが存在しない場合は警告を表示する
      else
        logseq.App.pushState('page', { name: pageName })//ページが存在しない場合も作成される
  }
}


export const removeBoundaries = () => {
  const weekBoundaries = parent.document.getElementById("weekBoundaries") as HTMLDivElement | null
  if (weekBoundaries) weekBoundaries.remove()
}

