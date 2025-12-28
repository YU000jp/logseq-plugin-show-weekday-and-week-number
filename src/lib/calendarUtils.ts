import { toTranslucent, resolveColorChoice, getWeekendColor } from './lib'
import type { CSSProperties } from 'react'

export type UserColorInfo = { color?: string; fontWeight?: string; eventName?: string }

// Compute cell background and class based on user event and holiday priority
export const computeCellBackground = (userInfo: UserColorInfo | undefined, holidayText: string | undefined, isHolidayEnabled: boolean, choiceHolidaysColor?: string, choiceUserColor?: string) => {
  if (userInfo && userInfo.color) {
    const cssColor = resolveColorChoice(userInfo.color)
    return { backgroundColor: toTranslucent(cssColor, 0.12), fontWeight: userInfo.fontWeight, className: 'lc-user-event' }
  }
  if (holidayText && isHolidayEnabled) {
    const cssColor = resolveColorChoice(choiceHolidaysColor)
    return { backgroundColor: toTranslucent(cssColor, 0.12), fontWeight: '700', className: 'lc-holiday' }
  }
  return { backgroundColor: undefined, fontWeight: undefined, className: '' }
}

// Compute inline style for day-number (color + fontWeight) preferring user color, then weekend color
export const computeDayNumberStyle = (userInfo: UserColorInfo | undefined, dateDayIndex: number, enableWeekendsColor?: boolean): CSSProperties => {
  const s: CSSProperties = {}
  if (userInfo && userInfo.color) {
    s.color = userInfo.color
    s.fontWeight = userInfo.fontWeight as any || s.fontWeight
    return s
  }
  if (enableWeekendsColor) {
    const wk = getWeekendColor(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dateDayIndex])
    if (wk) s.color = wk
  }
  return s
}

// Determine alert item background (user alerts use user color; holiday alerts use holidaysBg)
export const computeAlertBackground = (alertSource: 'user' | 'holiday' | 'ics' | undefined, dateIso: string, userColorMap: Record<string, UserColorInfo>, holidaysBg: string, choiceUserColor?: string) => {
  if (alertSource === 'user') {
    const u = userColorMap[dateIso]
    if (u && u.color) {
      const cssColor = resolveColorChoice(u.color)
      return toTranslucent(cssColor, 0.12)
    }
    const cssColor = resolveColorChoice(choiceUserColor)
    return toTranslucent(cssColor, 0.12)
  }
  if (alertSource === 'ics') {
    const cssColor = resolveColorChoice(choiceUserColor)
    return toTranslucent(cssColor, 0.08)
  }
  return holidaysBg
}
