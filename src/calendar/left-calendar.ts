import { addDays, Day, eachDayOfInterval, getISOWeek, getWeek, isSameDay, isSameISOWeek, isSameMonth, isSameWeek, isSameYear, isToday, startOfISOWeek, startOfMonth, startOfWeek } from "date-fns"
import { format } from "date-fns/format"
import { t } from "logseq-l10n"
import { getConfigPreferredDateFormat, getConfigPreferredLanguage, getLeftSidebarFooterSelector, pluginName } from ".."
import { separate } from "../journals/nav"
import { holidaysWorld, lunarString } from "../lib/holidays"
import { getWeeklyNumberFromDate, getWeeklyNumberString, localizeDayOfWeekString, localizeMonthDayString, localizeMonthString, openPageFromPageName, removeElementById, shortDayNames, userColor } from "../lib/lib"
import { doesPageExist } from "../lib/query/advancedQuery"
import { applyWeekendColor } from "./boundaries"

export const keyLeftCalendarContainer = "left-calendar-container"

export let currentCalendarDate: Date = new Date() //今日の日付を取得
let flagWeekly = false //週間表示フラグ
let loadingCalendar = false //カレンダー読み込み中フラグ
let calendarLoadTimeout: ReturnType<typeof setTimeout> | null = null //タイムアウトIDを保存

export const loadLeftCalendar = (logseqDbGraph: boolean) => {
    // すでに読み込み中の場合は、既存のタイムアウトをキャンセル
    if (calendarLoadTimeout !== null) {
        clearTimeout(calendarLoadTimeout)
        calendarLoadTimeout = null
    }

    // 読み込み中フラグをチェック
    if (loadingCalendar) return

    loadingCalendar = true

    if (parent.document.getElementById(keyLeftCalendarContainer))
        removeElementById(keyLeftCalendarContainer)//すでに存在する場合は削除する

    calendarLoadTimeout = setTimeout(async () => {
        calendarLoadTimeout = null

        //左サイドバーのフッターに追加する
        const footerElement: HTMLElement | null = parent.document.querySelector(getLeftSidebarFooterSelector()) as HTMLElement | null
        if (footerElement === null) {
            loadingCalendar = false // 読み込み完了フラグをリセット
            return //nullの場合はキャンセル
        }

        const containerElement: HTMLDivElement = document.createElement("div")
        containerElement.className = "nav-content-item mt-6 is-expand flex-shrink-0"
        containerElement.id = keyLeftCalendarContainer
        const detailsElement: HTMLDetailsElement = document.createElement("details")
        detailsElement.className = "nav-content-item-inner"
        detailsElement.open = true
        const summaryElement: HTMLElement = document.createElement("summary")
        summaryElement.className = "header items-center pl-4"
        summaryElement.style.cursor = "row-resize"
        summaryElement.style.backgroundColor = "var(--ls-tertiary-background-color)"
        summaryElement.innerText = t("Monthly Calendar")// タイトルを入れる
        summaryElement.title = pluginName //プラグイン名を入れる
        const innerElement: HTMLDivElement = document.createElement("div")
        innerElement.className = "bg"
        innerElement.id = "left-calendar-inner"
        detailsElement.appendChild(summaryElement)
        detailsElement.appendChild(innerElement)
        containerElement.appendChild(detailsElement)
        if (logseqDbGraph)
            footerElement.insertAdjacentElement("afterend", containerElement) //DBグラフの場合は後ろ
        else
            footerElement.insertAdjacentElement("beforebegin", containerElement)

        //スペースに表示する
        setTimeout(async () => {
            const innerElement: HTMLDivElement | null = parent.document.getElementById("left-calendar-inner") as HTMLDivElement | null

            if (innerElement === null) {
                loadingCalendar = false // 読み込み完了フラグをリセット
                return //nullの場合はキャンセル
            }

            if (innerElement.dataset.flag !== "true")//すでに存在する場合はキャンセル
                createCalendar(new Date(), await getConfigPreferredDateFormat(), innerElement)

            innerElement.dataset.flag = "true" //フラグを立てる
        }, 1)

        loadingCalendar = false // 読み込み完了フラグをリセット
    }, 500)
}

const createButton = (text: string, title: string, onClick: () => void): HTMLButtonElement => {
    const button = document.createElement("button")
    button.textContent = text
    button.className = "cursor"
    button.title = title
    button.addEventListener("click", onClick, { once: true })
    return button
}

const createTableCell = (text: string, className: string = "", title: string = "", colSpan: number = 1, type: 'td' | 'th' = 'td'): HTMLTableCellElement => {
    const cell = document.createElement(type) as HTMLTableCellElement
    cell.textContent = text
    cell.className = className
    cell.title = title
    cell.colSpan = colSpan
    return cell
}

const createTableHeaderCell = (text: string, className: string = "", title: string = "", colSpan: number = 1): HTMLTableCellElement => {
    return createTableCell(text, className, title, colSpan, 'th')
}

const createDayCell = async (
    date: Date,
    month: number,
    preferredDateFormat: string,
    innerElement: HTMLDivElement,
    targetDate: Date,
    ISO: boolean,
    weekStartsOn: Day,
    flag?: { singlePage?: boolean, weekly?: boolean }
): Promise<HTMLTableCellElement> => {
    const dayCell = document.createElement("td")
    dayCell.textContent = date.getDate().toString()
    const holiday = await checkDay(date, month, dayCell, preferredDateFormat, innerElement)
    const pageName = format(date, preferredDateFormat) as string
    if (pageName) {
        dayCell.addEventListener("click", ({ shiftKey }) => openPageFromPageName(pageName, shiftKey))
        dayCell.classList.add("cursor")
        dayCell.title = holiday !== "" ? holiday + "\n" + pageName : pageName
    }
    if (flag?.singlePage === true && isSameDay(date, targetDate))
        dayCell.style.border = `3px solid ${logseq.settings!.boundariesHighlightColorSinglePage}`
    else
        if (flag?.weekly === true && (ISO ? isSameISOWeek(date, targetDate) : isSameWeek(date, targetDate, { weekStartsOn })))
            dayCell.style.borderBottom = `3px solid ${logseq.settings!.boundariesHighlightColorSinglePage}`
    return dayCell
}


//月間カレンダーを作成する
export const createCalendar = async (targetDate: Date, preferredDateFormat: string, innerElement: HTMLDivElement, flag?: { singlePage?: boolean, weekly?: boolean }) => {
    const calendarElement: HTMLElement = document.createElement("div")
    calendarElement.className = "flex items-center"
    calendarElement.id = "left-calendar"

    // Weeklyフラグの場合は週間表示フラグを立てる
    flagWeekly = flag?.weekly === true ? true : false

    currentCalendarDate = targetDate // 更新
    const year = targetDate.getFullYear() //年を取得
    const month = targetDate.getMonth() + 1 //0から始まるため+1する
    const today = new Date()
    const localizeMonthLong = localizeMonthString(targetDate, true) //月の文字列を取得
    const startOfMonthDay: Date = startOfMonth(targetDate) //月の最初の日を取得
    const ISO: boolean = logseq.settings!.weekNumberFormat === "ISO(EU) format" ? true : false //ISO(EU) formatかどうか
    const weekStartsOn: Day = logseq.settings!.boundariesWeekStart === "Monday" ? 1 : logseq.settings!.boundariesWeekStart === "Saturday" ? 6 : 0

    //カレンダーは7列x5行。週番号の1列を左に追加して、合計8列にする

    const calendarFirstDay: Date = logseq.settings!.boundariesWeekStart === "unset"
        && ISO ?
        startOfISOWeek(startOfMonthDay)
        : startOfWeek(startOfMonthDay, { weekStartsOn })
    const calendarLastDay: Date = addDays(calendarFirstDay, 34) //35日後の日付を取得
    const eachDays = eachDayOfInterval({ start: calendarFirstDay, end: calendarLastDay })//すべての行の日付を取得

    //一行目は曜日名 (ローカライズ)
    const dayOfWeekArray: string[] = eachDays.slice(0, 7).map(date => localizeDayOfWeekString(date, false))

    const formatSeparate = separate() as "/" | "-"
    const enableWeekNumber = logseq.settings!.booleanLcWeekNumber as boolean //週番号を表示するかどうか
    const formatYearMonthTargetDate: string = format(targetDate, `yyyy${formatSeparate}MM`)
    const formatYearMonthThisMonth: string = format(today, `yyyy${formatSeparate}MM`)

    //ここまでのデータを仮で、mainDivElementにすべて出力したい
    //tableで、一行目、二行目、三行目、四行目、五行目、六行目、七行目、八行目を作成する
    // ISO === true ? getISOWeek(date) : getWeek(date)}W
    calendarElement.innerHTML = ""
    const tableElement = document.createElement("table")

    // <thead>を作成
    const theadElement = document.createElement("thead")


    // 1段目のナビゲーションを作成
    const headerNavElement = document.createElement("tr")

    // 前月に戻るボタン
    const prevButton = createButton("<", t("Previous month"), () => {
        const prevMonth = new Date(targetDate)
        prevMonth.setMonth(prevMonth.getMonth() - 1)
        removeCalendarAndNav()
        createCalendar(prevMonth, preferredDateFormat, innerElement)
    })
    const prevHeaderCell = createTableHeaderCell("")
    prevHeaderCell.appendChild(prevButton)
    headerNavElement.appendChild(prevHeaderCell)

    // 月のセルを作成
    const monthHeaderCell = createTableHeaderCell(localizeMonthLong + (isSameYear(targetDate, today) ? "" : ` ${year}`), "cursor", formatYearMonthTargetDate, enableWeekNumber ? 4 : 3)
    monthHeaderCell.addEventListener("click", ({ shiftKey }) => openPageFromPageName(formatYearMonthTargetDate, shiftKey))
    monthHeaderCell.style.fontSize = "1.4em"
    headerNavElement.appendChild(monthHeaderCell)
    theadElement.appendChild(headerNavElement)

    // 今月に戻るボタン
    const thisMonthButton = createButton("<>", formatYearMonthThisMonth, () => {
        removeCalendarAndNav()
        createCalendar(today, preferredDateFormat, innerElement)
    })
    const thisMonthHeaderCell = createTableHeaderCell("", "", "", 2)
    thisMonthHeaderCell.appendChild(thisMonthButton)
    headerNavElement.appendChild(thisMonthHeaderCell)

    // 次月に進むボタン
    const nextButton = createButton(">", t("Next month"), () => {
        const nextMonth = new Date(targetDate)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        removeCalendarAndNav()
        createCalendar(nextMonth, preferredDateFormat, innerElement)
    })
    const nextHeaderCell = createTableHeaderCell("")
    nextHeaderCell.appendChild(nextButton)
    headerNavElement.appendChild(nextHeaderCell)

    theadElement.appendChild(headerNavElement)


    // 2段目の曜日名を作成
    const headerRowElement = document.createElement("tr")

    // 週番号のセルを作成
    if (enableWeekNumber)
        headerRowElement.appendChild(createTableHeaderCell("W"))

    // 曜日名のセルを作成
    for (const day of dayOfWeekArray)
        headerRowElement.appendChild(createTableHeaderCell(day))

    theadElement.appendChild(headerRowElement)
    tableElement.appendChild(theadElement)


    // 3段目以降の日付を作成
    const tbodyElement = document.createElement("tbody")
    for (let index = 0; index < eachDays.length; index++) {
        const date = eachDays[index]
        const weekNumber = enableWeekNumber ?
            `${ISO ? getISOWeek(date) : getWeek(date, { weekStartsOn })}` : ""
        const day = date.getDate().toString()

        // 先頭の日付の場合
        if (index % 7 === 0) {
            const rowElement = document.createElement("tr")

            // 週番号を表示するかどうか
            if (enableWeekNumber) {
                const weekNumberCell = createTableCell(weekNumber, "", t("Week"))
                if (weekNumber === "W53") weekNumberCell.style.opacity = "0.5"
                weekNumberCell.style.fontSize = "0.85em"
                const { year, weekString, quarter } = getWeeklyNumberFromDate(date, logseq.settings?.weekNumberFormat === "US format" ? 0 : 1) // 週番号を取得する
                const pageName = getWeeklyNumberString(year, weekString, quarter) // 週番号からユーザー指定文字列を取得する
                if (logseq.settings!.booleanWeeklyJournal === true) {
                    weekNumberCell.addEventListener("click", ({ shiftKey }) => openPageFromPageName(pageName, shiftKey))
                    weekNumberCell.classList.add("cursor")
                    if (await doesPageExist(pageName) as boolean)
                        weekNumberCell.style.textDecoration = "underline"
                    weekNumberCell.title = pageName
                }
                rowElement.appendChild(weekNumberCell)
            }
            const dayCell = await createDayCell(date, month, preferredDateFormat, innerElement, targetDate, ISO, weekStartsOn, flag)
            if (dayCell) rowElement.appendChild(dayCell)
            tbodyElement.appendChild(rowElement)
        } else {
            const rowElement = tbodyElement.lastElementChild as HTMLTableRowElement | null
            if (rowElement) {
                const dayCell = await createDayCell(date, month, preferredDateFormat, innerElement, targetDate, ISO, weekStartsOn, flag)
                if (dayCell) rowElement.appendChild(dayCell)
            }
        }
    }

    tableElement.appendChild(tbodyElement)
    calendarElement.appendChild(tableElement)
    innerElement.appendChild(calendarElement)


    //テスト出力用div
    //     const divEle: HTMLDivElement = document.createElement("div")
    //     divEle.innerHTML = `
    // <hr/>
    // <div id="testOutput">
    // <pre>
    // today: ${format(today, preferredDateFormat)}
    // year: ${year}
    // month: ${month}
    // localizeMonthLong: ${localizeMonthLong}
    // startOfMonthDay: ${format(startOfMonthDay, preferredDateFormat)}
    // calendarFirstDay: ${format(calendarFirstDay, preferredDateFormat)}
    // calendarLastDay: ${format(calendarLastDay, preferredDateFormat)}
    // eachDayOfInterval: ${eachDays.length}
    // eachDays: ${eachDays.map(date => format(date, preferredDateFormat)).join(", ")}
    // dayOfWeekArray: ${dayOfWeekArray.join(", ")}
    // </pre>
    // </div>
    // }
    // `
    //     leftCalendarElement.appendChild(divEle)
}

//カレンダーとナビゲーションを削除 (再描画時に使用)
export const removeCalendarAndNav = () => {

    //.leftCalendarHolidayAlertを削除
    const leftCalendarHolidayAlerts = parent.document.querySelectorAll(".leftCalendarHolidayAlert") as NodeListOf<HTMLDivElement>
    if (leftCalendarHolidayAlerts)
        for (const leftCalendarHolidayAlert of leftCalendarHolidayAlerts)
            leftCalendarHolidayAlert.remove()

    // #left-calendarを削除
    removeElementById("left-calendar")
}


const checkDay = async (dayDate: Date, month: number, dayCell: HTMLElement, preferredDateFormat: string, parentElementForHolidays: HTMLElement): Promise<string> => {

    // 土日の色を変える
    if (logseq.settings!.booleanWeekendsColor === true)
        if (dayDate.getDay() === 6) { //土曜日
            dayCell.style.color = 'var(--ls-wb-stroke-color-blue)'
            dayCell.style.fontWeight = "1500"
        } else
            if (dayDate.getDay() === 0) { //日曜日
                dayCell.style.color = 'var(--ls-wb-stroke-color-red)'
                dayCell.style.fontWeight = "1500"
            }

    // 月が異なる場合はopacityを下げる
    if (dayDate.getMonth() !== month - 1) {
        dayCell.style.opacity = "0.4"
        dayCell.style.fontSize = "0.9em"
    }

    // 今日の日付の場合は背景色を変える
    const checkIsToday: boolean = isToday(dayDate)
    if (checkIsToday === true) {
        dayCell.style.border = `2px solid ${logseq.settings!.boundariesHighlightColorToday}`
        dayCell.style.borderRadius = "50%"
    }

    // ページが存在する場合は下線を引く
    if (logseq.settings!.booleanBoundariesIndicator === true)
        setTimeout(async () => {
            const pageName = format(dayDate, preferredDateFormat)
            if (pageName)
                if (await doesPageExist(pageName) as boolean)
                    dayCell.style.textDecoration = "underline"
        }, 1)

    // ユーザー設定日
    if (logseq.settings!.userColorList as string !== "") {
        const eventName = userColor(dayDate, dayCell)
        if (eventName) {
            dayCell.style.fontSize = "1.3em"

            if (eventName.includes("\n")) // eventNameが\nで区切られている場合
                for (const event of eventName.split("\n"))
                    appendHolidayAlert(checkIsToday, dayDate, event, parentElementForHolidays) // アラートスペースに表示する
            else
                appendHolidayAlert(checkIsToday, dayDate, eventName, parentElementForHolidays) // アラートスペースに表示する

            // 祝日を表示する
            if (logseq.settings!.booleanLcHolidays === false)
                return eventName
            else {
                const holiday = await checkAndAppendHoliday(dayDate, dayCell, checkIsToday, parentElementForHolidays)
                return holiday !== "" ? `${eventName}\n${holiday}` : eventName
            }
        }
    } else {
        if (logseq.settings?.booleanWeekendsColor === true)
            applyWeekendColor(dayCell, shortDayNames[dayDate.getDay()])
    }

    // 祝日を表示する ユーザー設定日オフの場合
    return logseq.settings!.booleanLcHolidays === true ? await checkAndAppendHoliday(dayDate, dayCell, checkIsToday, parentElementForHolidays) : ""
}


export const refreshMonthlyCalendar = async (targetDate: Date, singlePage: boolean, weekly: boolean) => {
    const innerElement: HTMLDivElement | null = parent.document.getElementById("left-calendar-inner") as HTMLDivElement | null
    if (innerElement) {
        removeCalendarAndNav()
        createCalendar(
            targetDate,
            await getConfigPreferredDateFormat(),
            innerElement,
            { singlePage, weekly })
    }
}


export const refreshCalendarCheckSameMonth = () => {
    const today = new Date()
    if (flagWeekly === true
        || isSameMonth(currentCalendarDate, today) === false)
        refreshMonthlyCalendar(today, false, false)
}


const appendHolidayAlert = (checkIsToday: boolean, date: Date, holiday: string, parentElementForHolidays: HTMLElement) => {
    const element: HTMLDivElement = document.createElement("div")
    element.className = "text-sm text-gray-500 ml-4 leftCalendarHolidayAlert"
    element.textContent = `${checkIsToday === true ?
        t("Today")
        : localizeMonthDayString(date)} >> ${holiday}`
    parentElementForHolidays.insertAdjacentElement("afterend", element)
}


const checkAndAppendHoliday = async (date: Date, dayCell: HTMLElement, checkIsToday: boolean, parentElementForHolidays: HTMLElement) => {
    const configPreferredLanguage = await getConfigPreferredLanguage()

    // Chinese lunar-calendar and holidays
    const holiday: string = logseq.settings!.booleanLunarCalendar === true // プラグイン設定で太陰暦オンの場合
        && (configPreferredLanguage === "zh-Hant" //中国語の場合
            || configPreferredLanguage === "zh-CN") ?
        lunarString(date, dayCell, false)
        : holidaysWorld(date, dayCell, false) // World holidays

    if (holiday !== "" //祝日がある場合
        && ((logseq.settings!.lcHolidaysAlert === "Today only"
            && checkIsToday === true) //今日にマッチする場合
            || logseq.settings!.lcHolidaysAlert === "Monthly"))

        //leftCalendarElementに、祝日の情報を追加する
        appendHolidayAlert(checkIsToday, date, holiday, parentElementForHolidays)

    return holiday
}
