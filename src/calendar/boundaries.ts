import { addDays, startOfISOWeek, startOfWeek } from 'date-fns' //https://date-fns.org/
import { t } from "logseq-l10n"
import { getWeekStartOn, getCurrentPageJournalDay, getDateFromJournalDay, DayShortCode, colorMap } from '../lib'
import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import TwoLineCalendar from '../components/TwoLineCalendar'
import { ensureBoundariesMountPoint } from './boundariesMount'
import { separate } from '../journals/nav'


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
        weekBoundaries = parent.document.getElementById("weekBoundaries") as HTMLDivElement | null || parent.document.createElement('div')
        weekBoundaries.id = 'weekBoundaries'
      } else
        weekBoundaries = parent.document.getElementById("weekBoundaries") as HTMLDivElement
    } else {
      weekBoundaries = parent.document.createElement('div')
      weekBoundaries.id = 'weekBoundaries'
    }
    firstElement.insertBefore(weekBoundaries, firstElement.firstChild)

    //weekBoundariesにelementを追加する
    const boundariesInner: HTMLDivElement = parent.document.createElement('div')
    boundariesInner.id = 'boundariesInner'

    let targetDate: Date//今日の日付もしくはそのページの日付を求める
    if (targetElementName === 'journals')
      targetDate = today
    else
      if (targetElementName === 'is-journals') {
        const journalDay = await getCurrentPageJournalDay() as any
        if (!journalDay) {
          console.error('journalDay is undefined')
          processingFoundBoundaries = false
          return
        }
        targetDate = getDateFromJournalDay(String(journalDay)) as Date
      } else
        if (targetElementName === "weeklyJournal")
          targetDate = selectStartDate as Date
        else {
          console.error('targetElementName is undefined')
          processingFoundBoundaries = false
          return
        }

    // 次の週を表示するかどうかの判定
    const isDayThursday = targetDate.getDay() === 4
    const isDayFriday = targetDate.getDay() === 5
    const isDaySaturday = targetDate.getDay() === 6
    const flagShowNextWeek: boolean = checkIfNextWeekVisible(weekStartsOn, isDayThursday, isDayFriday, isDaySaturday, targetDate)

    // Instead of building DOM here, mount a React TwoLineCalendar into boundariesInner.
    const offsets = getWeekOffsetDays(flagShowNextWeek) as number[]
    const startForComponent = selectStartDate ?
      selectStartDate :
      weekStartsOn === 1 && logseq.settings?.weekNumberFormat === "ISO(EU) format"
        ? startOfISOWeek(targetDate)
        : startOfWeek(targetDate, { weekStartsOn })

    // append the container wrapper so existing layout is preserved
    weekBoundaries.appendChild(boundariesInner)

    try {
      const mount = ensureBoundariesMountPoint(boundariesInner)
      // unmount previous root if exists
      try {
        const prev = (window as any).__boundariesRoot || (parent as any).__boundariesRoot
        if (prev && typeof prev.unmount === 'function') prev.unmount()
      } catch (e) { /* ignore */ }
      const root: Root = createRoot(mount)
      ;(window as any).__boundariesRoot = root
      root.render(React.createElement(TwoLineCalendar, { startDate: startForComponent, offsets, targetElementName, onRequestScroll: (deltaWeeks: number) => {
        // deltaWeeks is -1 or +1
        const newStart = addDays(startForComponent, deltaWeeks * 7)
        boundariesProcess(targetElementName, true, 0, newStart)
      } }))
    } catch (e) {
      console.error('Failed to mount TwoLineCalendar React component', e)
    }
  }
  processingFoundBoundaries = false
}
// Legacy DOM builder functions (week number, side month, per-day DOM construction, indicator)
// were removed in favor of the React `TwoLineCalendar` component.
// The React component is now the canonical implementation; keeping only small shared helpers below.


// 週末の色を適用する
export const applyWeekendColor = (dayCell: HTMLElement, day: DayShortCode) => {
  const color = colorMap[logseq.settings!["userWeekend" + day] as string]
  if (color) dayCell.style.color = color
}


//次の週を表示するかどうかの判定
const checkIfNextWeekVisible = (weekStartsOn: number, isDayThursday: boolean, isDayFriday: boolean, isDaySaturday: boolean, targetDate: Date): boolean => {
  if (weekStartsOn === 0) return isDayThursday || isDayFriday || isDaySaturday
  if (weekStartsOn === 1) return isDayFriday || isDaySaturday || targetDate.getDay() === 0 // Sunday
  // fallback: when weekStartsOn === 6 (Saturday), show next week for Wed/Thu/Fri
  return targetDate.getDay() === 3 || isDayThursday || isDayFriday // Wednesday(3), Thursday(4), Friday(5)
}


//どの週を表示するか
const getWeekOffsetDays = (flagShowNextWeek: boolean): number[] =>
  flagShowNextWeek === true ?
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] //次の週を表示する場合
    : [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6] //次の週を表示しない場合


export const removeBoundaries = () => {
  const weekBoundaries = parent.document.getElementById("weekBoundaries") as HTMLDivElement | null
  if (weekBoundaries) weekBoundaries.remove()
}

