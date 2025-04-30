import { addWeeks, eachDayOfInterval, format, getWeeksInMonth, isSameMonth, subWeeks } from "date-fns"
import { t } from "logseq-l10n"
import { getConfigPreferredDateFormat } from ".."
import { getWeeklyNumberFromDate, localizeDayOfWeekDayString, localizeMonthString, openPageFromPageName } from "../lib/lib"


export const createNavLink = (text: string, pageName: string) => {
      const link = document.createElement("a")
      link.textContent = text
      link.classList.add("text-sm")
      link.title = pageName
      link.style.marginRight = "1.0em"
      link.addEventListener("click", ({ shiftKey }) => openPageFromPageName(pageName, shiftKey)
      )
      return link
}


export const createNavLinkWeekNumber = (day: Date, ISO: boolean, configWeekNumberFormat: string) => {

      const monthFirstWeekNumber: {
            year: number
            weekString: string
            quarter: number
      } = getWeeklyNumberFromDate(day, ISO ? 1 : 0)

      // weekNumberFormat ["YYYY-Www", "YYYY/qqq/Www", "YYYY/Www"]
      const linkString = configWeekNumberFormat === "YYYY-Www" ? // fix a bug https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/pull/163
            `${monthFirstWeekNumber.year}-W${monthFirstWeekNumber.weekString}`
            : configWeekNumberFormat === "YYYY/qqq/Www" ?
                  `${monthFirstWeekNumber.year}/Q${monthFirstWeekNumber.quarter}/W${monthFirstWeekNumber.weekString}`
                  : `${monthFirstWeekNumber.year}/W${monthFirstWeekNumber.weekString}`

      const monthFirstWeekNumberLink = createNavLink(monthFirstWeekNumber.weekString, linkString)
      monthFirstWeekNumberLink.title = linkString
      monthFirstWeekNumberLink.style.marginRight = "1.0em"
      return monthFirstWeekNumberLink
}


export const spanFreeSpace = (text: string, flag?: { sm?: true }) => {
      const space = document.createElement("span")
      space.style.paddingRight = "0.88em"
      space.textContent = text
      if (flag && flag.sm)
            space.classList.add("text-sm")
      return space
}

const createYearLinks = (navElement: HTMLElement, year: number, currentYear: boolean = false) => {
      const yearLink = createNavLink(year.toString(), year.toString())
      if (currentYear) yearLink.style.textDecoration = "underline"
      navElement.appendChild(yearLink)
}

const createQuarterLinks = (navElement: HTMLElement, year: number, currentQuarter: number) => {
      for (let i = 1; i <= 4; i++)
            if (currentQuarter === i) {
                  const quarterLink = spanFreeSpace(`Q${i}`)
                  quarterLink.style.textDecoration = "underline"
                  navElement.appendChild(quarterLink)
            } else
                  navElement.appendChild(createNavLink(`Q${i}`, `${year}/Q${i}`))
}

const createMonthLinks = (navElement: HTMLElement, year: number, startMonth: number, endMonth: number) => {
      for (let i = startMonth; i <= endMonth; i++) {
            const monthLink = createNavLink(localizeMonthString(new Date(year, i - 1, 1), false), `${year}/${i.toString().padStart(2, "0")}`)
            if (startMonth <= i && i <= endMonth)
                  monthLink.style.fontWeight = "bold"
            navElement.appendChild(monthLink)
      }
}

const getPageRelativeElement = async (): Promise<HTMLDivElement | null> => {
      const selector = "div.page.relative div.relative"
      let pageRelative: HTMLDivElement | null = null
      for (let i = 0; i < 10; i++) { // リトライ回数を10回に増やす
            pageRelative = parent.document.querySelector(selector) as HTMLDivElement | null
            if (pageRelative) break
            await new Promise(resolve => setTimeout(resolve, 1000)) // リトライ間隔を1秒に調整
      }
      return pageRelative
}

const createNavElement = (id: string) =>
      Object.assign(document.createElement("div"), {
            id,
            className: "flex justify-center items-center text-sm",
            // style: {
            // }
      })

const createCommonNav = async (pageRelative: HTMLDivElement, navElement: HTMLElement, year: number, quarter?: number) => {
      // Year
      createYearLinks(navElement, year - 1)
      createYearLinks(navElement, year, true)
      createYearLinks(navElement, year + 1)

      // span ">",{sm:true}
      navElement.appendChild(spanFreeSpace(">", { sm: true }))

      if (logseq.settings!.weekNumberOptions === "YYYY/qqq/Www" && quarter !== undefined) {
            // Quarter
            createQuarterLinks(navElement, year, quarter)
            // span ">",{sm:true}
            navElement.appendChild(spanFreeSpace(">", { sm: true }))
      }

      // Month
      createMonthLinks(navElement, year, quarter ? quarter * 3 - 2 : 1, quarter ? quarter * 3 : 12)

      pageRelative.insertBefore(navElement, pageRelative.firstChild)
}

const createWeekNav = (navElement: HTMLElement, monthStartDay: Date, ISO: boolean) => {
      // span ">",{sm:true}
      navElement.appendChild(spanFreeSpace(">", { sm: true }))

      // span "Week"
      navElement.appendChild(spanFreeSpace(t("Week")))

      for (let i = 0; i < getWeeksInMonth(monthStartDay, { weekStartsOn: ISO ? 1 : 0 }); i++) {
            const week = addWeeks(monthStartDay, i)
            if (!isSameMonth(week, monthStartDay)) break
            navElement.appendChild(createNavLinkWeekNumber(week, ISO, logseq.settings!.weekNumberOptions as string))
      }
}

// MonthlyJournal用ナビゲーションを作成する
export const monthlyJournalCreateNav = async (
      monthStartDay: Date,
      year: number
): Promise<boolean> => {
      const pageRelative = await getPageRelativeElement()
      if (!pageRelative) return Promise.resolve(false)

      pageRelative.dataset.monthlyJournalNav = "true"
      const navElement = createNavElement("journalNav")

      const ISO = logseq.settings!.booleanISOWeek === true
      const { quarter } = getWeeklyNumberFromDate(monthStartDay, ISO ? 1 : 0)

      await createCommonNav(pageRelative, navElement, year, quarter)
      createWeekNav(navElement, monthStartDay, ISO)

      return Promise.resolve(true)
}

// QuarterlyJournal用ナビゲーションを作成する
export const quarterlyJournalCreateNav = async (
      year: number,
      quarterly: number,
): Promise<boolean> => {
      const pageRelative = await getPageRelativeElement()
      if (!pageRelative) return Promise.resolve(false)

      pageRelative.dataset.quarterlyJournalNav = "true"
      const navElement = createNavElement("journalNav")

      await createCommonNav(pageRelative, navElement, year, quarterly)

      return Promise.resolve(true)
}

// YearlyJournal用ナビゲーションを作成する
export const yearlyJournalCreateNav = async (
      year: number,
): Promise<boolean> => {
      const pageRelative = await getPageRelativeElement()
      if (!pageRelative) return Promise.resolve(false)

      pageRelative.dataset.yearlyJournalNav = "true"
      const navElement = createNavElement("journalNav")

      await createCommonNav(pageRelative, navElement, year)

      return Promise.resolve(true)
}

// WeeklyJournal用ナビゲーションを作成する
export const weeklyJournalCreateNav = async (
      ISO: boolean,
      yearString: string,
      weekNumberString: string,
      weekStart: Date,
      weekEnd: Date,
      prevWeekStart: Date,
      nextWeekStart: Date,
): Promise<boolean> => {

      const pageRelative = await getPageRelativeElement()
      if (!pageRelative) return Promise.resolve(false)

      pageRelative.dataset.weeklyJournalNav = "true"
      const navElement = createNavElement("journalNav")

      // Year
      const thisYearNavLink = createNavLink(yearString, yearString)
      thisYearNavLink.style.textDecoration = "underline"
      navElement.appendChild(thisYearNavLink)

      if (logseq.settings!.weekNumberOptions === "YYYY/qqq/Www") {
            const { quarter } = getWeeklyNumberFromDate(weekStart, ISO ? 1 : 0)
            const putSpanQuarterMark = createNavLink(`Q${quarter}`, `${yearString}/Q${quarter}`)
            putSpanQuarterMark.style.textDecoration = "underline"
            navElement.appendChild(putSpanQuarterMark)
      }

      // WeekStartの月
      const thisMonthNavLink = createNavLink(localizeMonthString(weekStart, true), format(weekStart, "yyyy/MM"))
      thisMonthNavLink.style.textDecoration = "underline"
      navElement.appendChild(thisMonthNavLink)

      // WeekEndの月
      if (!isSameMonth(weekStart, weekEnd))
            navElement.appendChild(createNavLink(localizeMonthString(weekEnd, true), format(weekEnd, "yyyy/MM")))

      // span ">",{sm:true}
      navElement.appendChild(spanFreeSpace(">", { sm: true }))

      // Week
      navElement.appendChild(spanFreeSpace(t("Week")))
      navElement.appendChild(createNavLinkWeekNumber(subWeeks(weekStart, 2), ISO, logseq.settings!.weekNumberOptions as string))
      navElement.appendChild(createNavLinkWeekNumber(prevWeekStart, ISO, logseq.settings!.weekNumberOptions as string))
      const thisWeekLink = spanFreeSpace(weekNumberString)
      thisWeekLink.style.textDecoration = "underline"
      navElement.appendChild(thisWeekLink)
      navElement.appendChild(createNavLinkWeekNumber(nextWeekStart, ISO, logseq.settings!.weekNumberOptions as string))
      navElement.appendChild(createNavLinkWeekNumber(addWeeks(weekStart, 2), ISO, logseq.settings!.weekNumberOptions as string))

      // span ">",{sm:true}
      navElement.appendChild(spanFreeSpace(">", { sm: true }))

      // day
      for (const day of eachDayOfInterval({ start: weekStart, end: weekEnd }))
            navElement.appendChild(createNavLink(localizeDayOfWeekDayString(day), format(day, await getConfigPreferredDateFormat())))

      pageRelative.insertBefore(navElement, pageRelative.firstChild)
      return Promise.resolve(true)
}
