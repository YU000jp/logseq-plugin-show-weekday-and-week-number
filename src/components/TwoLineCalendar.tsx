import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { addDays, format, isToday, startOfISOWeek, startOfWeek } from 'date-fns'
import { t } from 'logseq-l10n'
import { getConfigPreferredDateFormat } from '..'
import { getHolidays } from '../lib/holidays'
import { findPageUuid } from '../lib/query/advancedQuery'
import {
  openPageFromPageName,
  getUserColorData,
  getWeekendColor,
  shortDayNames,
  localizeDayOfWeekString,
  localizeMonthString,
  
  getDateFromJournalDay,
  getCurrentPageJournalDay,
  getWeekStartOn,
  getWeeklyNumberFromDate,
  getWeeklyNumberString,
  toTranslucent,
  resolveColorChoice,
} from '../lib'
import { separate } from '../journals/nav'

type Props = {
  startDate: Date
  offsets: number[]
  targetElementName: string
  onRequestScroll?: (deltaWeeks: number) => void
}

const TwoLineCalendar: React.FC<Props> = ({ startDate, offsets, targetElementName, onRequestScroll }) => {
  const [preferredDateFormat, setPreferredDateFormat] = useState<string>('yyyy/MM/dd')
  const [pageExistsMap, setPageExistsMap] = useState<Record<string, boolean>>({})
  const [holidayMap, setHolidayMap] = useState<Record<string, string>>({})

  useEffect(() => {
    const run = async () => {
      const fmt = await getConfigPreferredDateFormat()
      setPreferredDateFormat(fmt)
      const pMap: Record<string, boolean> = {}
      const hMap: Record<string, string> = {}
      for (const offset of offsets) {
        const d = offset === 0 ? startDate : addDays(startDate, offset)
        const pageName = format(d, fmt)
        if (pageName) {
          try {
            pMap[pageName] = Boolean(await findPageUuid(pageName))
          } catch {
            pMap[pageName] = false
          }
          try {
            hMap[pageName] = await getHolidays(d)
          } catch {
            hMap[pageName] = ''
          }
        }
      }
      setPageExistsMap(pMap)
      setHolidayMap(hMap)
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, JSON.stringify(offsets)])

  const days = useMemo(() => offsets.map((o) => (o === 0 ? startDate : addDays(startDate, o))), [startDate, JSON.stringify(offsets)])

  const onScrollClick = useCallback((delta: number) => {
    if (!onRequestScroll) return
    onRequestScroll(delta)
  }, [onRequestScroll])

  const onCellClickFactory = useCallback((pageName?: string) => {
    return () => { if (pageName) openPageFromPageName(pageName, false) }
  }, [])

  const handleMonthClick = useCallback((monthPageName: string) => (e: React.MouseEvent) => {
    openPageFromPageName(monthPageName, (e as any).shiftKey)
  }, [])

  const handleTodayClick = useCallback(async () => {
    const desiredDate: Date = new Date()
    if (onRequestScroll) {
      const weekStartsOn: 0 | 1 | 6 = getWeekStartOn()
      const useISO = weekStartsOn === 1 && (logseq.settings as any)?.weekNumberFormat === 'ISO(EU) format'
      const desiredStart = useISO ? startOfISOWeek(desiredDate) : startOfWeek(desiredDate, { weekStartsOn })
      const s = new Date(startDate)
      s.setHours(0, 0, 0, 0)
      const sStart = useISO ? startOfISOWeek(s) : startOfWeek(s, { weekStartsOn })
      const diffMs = desiredStart.getTime() - sStart.getTime()
      const deltaWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000))
      onRequestScroll(deltaWeeks)
    } else {
      openPageFromPageName(format(new Date(), preferredDateFormat), false)
    }
  }, [onRequestScroll, preferredDateFormat, startDate])

  return (
    <div className="two-line-calendar-root" style={{ padding: '6px' }}>
      <table className="two-line-calendar-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <tbody>
          {/* Row 1 */}
          <tr>
            {/* Leftmost column: may show week number (row1/row3) and short month (row2) depending on settings */}
            <td style={{ width: 'auto', verticalAlign: 'middle' }}>
              {(() => {
                const wkDate = days[0]
                const { year, weekString, quarter } = getWeeklyNumberFromDate(wkDate, (logseq.settings as any)?.weekNumberFormat === 'US format' ? 0 : 1)
                const weekNumLabel = `W${weekString}`
                const weekPageName = getWeeklyNumberString(year, weekString, quarter)
                const weekElementStyle: React.CSSProperties = { fontSize: '0.85em', padding: '4px 6px' }
                return (logseq.settings as any).booleanWeeklyJournal === true ? (
                  <button className="daySide daySideWeekNumber" title={t('Week number: ') + weekPageName} onClick={() => openPageFromPageName(weekPageName, false)} style={{ ...weekElementStyle, cursor: 'pointer', background: 'none', border: 'none' }}>{weekNumLabel}</button>
                ) : (
                  <span className="daySide daySideWeekNumber" style={{ ...weekElementStyle }}>{weekNumLabel}</span>
                )
              })()}
            </td>

            {days.slice(0, 7).map((d) => {
              const key = d.toISOString()
              const pageName = format(d, preferredDateFormat)
              const holiday = pageName ? holidayMap[pageName] || '' : ''
              const isOtherMonth = d.getMonth() !== startDate.getMonth()
              const checkIsToday = isToday(d)
              const cellStyle: React.CSSProperties = { border: '1px solid rgba(0,0,0,0.06)', padding: '6px 4px', whiteSpace: 'nowrap', cursor: pageName ? 'pointer' : 'default', textAlign: 'center' }
              // Do not dim or shrink cells for days from other months — keep uniform appearance.
              if (checkIsToday) { cellStyle.border = `2px solid ${(logseq.settings as any).boundariesHighlightColorToday}`; cellStyle.borderRadius = '50%' }

              if (holiday && (logseq.settings as any).booleanBoundariesHolidays === true) {
                const cssColor = resolveColorChoice((logseq.settings as any).choiceHolidaysColor as string | undefined)
                cellStyle.backgroundColor = toTranslucent(cssColor, 0.12)
                cellStyle.fontWeight = '700'
              }

              const u = getUserColorData(d)

              const titleParts: string[] = []
              if (u && u.eventName) titleParts.push(...u.eventName.split('\n').map(s => s.trim()).filter(Boolean))
              if (holiday) titleParts.push(...holiday.split('\n').map(s => s.trim()).filter(Boolean))
              if (pageName) titleParts.push(pageName)

              const dayNumberInlineStyle: React.CSSProperties = {}
              if (pageName && pageExistsMap[pageName]) {
                dayNumberInlineStyle.textDecoration = 'underline'
              }
              if (u && u.color) {
                dayNumberInlineStyle.color = u.color
                dayNumberInlineStyle.fontWeight = u.fontWeight as any || dayNumberInlineStyle.fontWeight
              } else if ((logseq.settings as any)?.booleanWeekendsColor === true) {
                const wk = getWeekendColor(shortDayNames[d.getDay()])
                if (wk) dayNumberInlineStyle.color = wk
              }

              return (
                <td key={key} onClick={onCellClickFactory(pageName)} className={`${pageName ? 'cursor' : ''} lc-day-cell`} title={titleParts.length > 0 ? titleParts.join('\n') : pageName} style={cellStyle}>
                  <span className="lc-day-number" style={dayNumberInlineStyle}>{d.getDate()}</span>
                </td>
              )
            })}

            <td style={{ width: 32, verticalAlign: 'middle', textAlign: 'center' }}>
              <button title={t('Previous week')} onClick={() => onScrollClick(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>↑</button>
            </td>
          </tr>

          {/* Row 2: weekday labels */}
          <tr>
            {/* second row: leftmost cell used to display short month name when enabled */}
            <td style={{ verticalAlign: 'middle', textAlign: 'center', fontSize: '0.9em', padding: '4px' }}>
              {(() => {
                // use the first displayed day to determine the month label (short)
                const monthLabel = localizeMonthString(days[0], false)
                // build month page name like `yyyy/MM` or `yyyy-MM` depending on separator
                const monthPageName = format(days[0], `yyyy${separate()}MM`)
                if (monthPageName.length === 7) {
                  return (
                    <button
                      className="daySide"
                      title={monthPageName}
                      onClick={handleMonthClick(monthPageName)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.95em' }}
                    >
                      {monthLabel}
                    </button>
                  )
                }
                return <span className="daySide" title={monthLabel}>{monthLabel}</span>
              })()}
            </td>
            {days.slice(0, 7).map((d) => {
              const dayIdx = d.getDay()
              const headerColor = getWeekendColor(shortDayNames[dayIdx])
              return (
                <td key={d.toISOString()} style={{ textAlign: 'center', fontSize: '0.75em', color: headerColor || 'var(--ls-ui-fg-muted)', padding: '4px 2px' }}>{localizeDayOfWeekString(d, false)}</td>
              )
            })}
            <td style={{ width: 32, verticalAlign: 'middle', textAlign: 'center' }}>
              <button title={t('Today')} onClick={handleTodayClick} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>{"<>"}</button>
            </td>
          </tr>

          {/* Row 3 */}
          <tr>
            <td style={{ verticalAlign: 'middle' }}>
              {(() => {
                const wkDate = days[7]
                const { year, weekString, quarter } = getWeeklyNumberFromDate(wkDate, (logseq.settings as any)?.weekNumberFormat === 'US format' ? 0 : 1)
                const weekNumLabel = `W${weekString}`
                const weekPageName = getWeeklyNumberString(year, weekString, quarter)
                const weekElementStyle: React.CSSProperties = { fontSize: '0.85em', padding: '4px 6px' }
                return (logseq.settings as any).booleanWeeklyJournal === true ? (
                  <button className="daySide daySideWeekNumber" title={t('Week number: ') + weekPageName} onClick={() => openPageFromPageName(weekPageName, false)} style={{ ...weekElementStyle, cursor: 'pointer', background: 'none', border: 'none' }}>{weekNumLabel}</button>
                ) : (
                  <span className="daySide daySideWeekNumber" style={{ ...weekElementStyle }}>{weekNumLabel}</span>
                )
              })()}
            </td>

            {days.slice(7, 14).map((d) => {
              const key = d.toISOString()
              const pageName = format(d, preferredDateFormat)
              const holiday = pageName ? holidayMap[pageName] || '' : ''
              const isOtherMonth = d.getMonth() !== startDate.getMonth()
              const checkIsToday = isToday(d)
              const cellStyle: React.CSSProperties = { border: '1px solid rgba(0,0,0,0.06)', padding: '6px 4px', whiteSpace: 'nowrap', cursor: pageName ? 'pointer' : 'default', textAlign: 'center' }
              // Do not dim or shrink cells for days from other months — keep uniform appearance.
              if (checkIsToday) { cellStyle.border = `2px solid ${(logseq.settings as any).boundariesHighlightColorToday}`; cellStyle.borderRadius = '50%' }

              if (holiday && (logseq.settings as any).booleanBoundariesHolidays === true) {
                const cssColor = resolveColorChoice((logseq.settings as any).choiceHolidaysColor as string | undefined)
                cellStyle.backgroundColor = toTranslucent(cssColor, 0.12)
                cellStyle.fontWeight = '700'
              }

              const u = getUserColorData(d)
              const titleParts: string[] = []
              if (u && u.eventName) titleParts.push(...u.eventName.split('\n').map(s => s.trim()).filter(Boolean))
              if (holiday) titleParts.push(...holiday.split('\n').map(s => s.trim()).filter(Boolean))
              if (pageName) titleParts.push(pageName)

              const dayNumberInlineStyle: React.CSSProperties = {}
              if (pageName && pageExistsMap[pageName]) {
                dayNumberInlineStyle.textDecoration = 'underline'
              }
              if (u && u.color) {
                dayNumberInlineStyle.color = u.color
                dayNumberInlineStyle.fontWeight = u.fontWeight as any || dayNumberInlineStyle.fontWeight
              } else if ((logseq.settings as any)?.booleanWeekendsColor === true) {
                const wk = getWeekendColor(shortDayNames[d.getDay()])
                if (wk) dayNumberInlineStyle.color = wk
              }

              return (
                <td key={key} onClick={() => pageName && openPageFromPageName(pageName, false)} className={`${pageName ? 'cursor' : ''} lc-day-cell`} title={titleParts.length > 0 ? titleParts.join('\n') : pageName} style={cellStyle}>
                  <span className="lc-day-number" style={dayNumberInlineStyle}>{d.getDate()}</span>
                </td>
              )
            })}

            <td style={{ width: 32, verticalAlign: 'middle', textAlign: 'center' }}>
              <button title={t('Next week')} onClick={() => onScrollClick(1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>↓</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default TwoLineCalendar

