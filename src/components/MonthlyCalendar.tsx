import React, { useEffect, useMemo, useState } from 'react'
import { addDays, Day, eachDayOfInterval, getISOWeek, getWeek, isSameDay, isSameISOWeek, isSameWeek, isSameYear, isToday, startOfISOWeek, startOfMonth, startOfWeek } from 'date-fns'
import { format } from 'date-fns/format'
import { t } from 'logseq-l10n'
import { separate } from '../journals/nav'
import { getWeeklyNumberFromDate, getWeeklyNumberString, localizeDayOfWeekString, localizeMonthDayString, localizeMonthString, openPageFromPageName, shortDayNames, userColor, colorMap, resolveColorChoice, toTranslucent } from '../lib'
import { applyWeekendColor } from '../calendar/boundaries'
import { getHolidays } from '../lib/holidays'
import { findPageUuid } from '../lib/query/advancedQuery'

type Props = {
  targetDate: Date
  preferredDateFormat: string
  flag?: { singlePage?: boolean, weekly?: boolean }
}

const WeeklyCell: React.FC<{ date: Date, ISO: boolean, weekStartsOn: Day }> = ({ date, ISO, weekStartsOn }) => {
  const weekNumber = ISO ? getISOWeek(date) : getWeek(date, { weekStartsOn })
  return <td style={{ fontSize: '0.85em' }}>{weekNumber}</td>
}

export const MonthlyCalendar: React.FC<Props> = ({ targetDate: initialTargetDate, preferredDateFormat, flag }) => {
  const [targetDate, setTargetDate] = useState<Date>(initialTargetDate)
  const today = new Date()
  const year = targetDate.getFullYear()
  const month = targetDate.getMonth() + 1
  const localizeMonthLong = localizeMonthString(targetDate, true)
  const startOfMonthDay = startOfMonth(targetDate)
    const ISO = (logseq.settings!.weekNumberFormat === 'ISO(EU) format');
    const weekStartsOn: Day = logseq.settings!.boundariesWeekStart === 'Monday' ? 1 : logseq.settings!.boundariesWeekStart === 'Saturday' ? 6 : 0;
    const calendarFirstDay: Date = (logseq.settings!.boundariesWeekStart === 'unset' && ISO) ? startOfISOWeek(startOfMonthDay) : startOfWeek(startOfMonthDay, { weekStartsOn });
    const calendarLastDay: Date = addDays(calendarFirstDay, 34);
    const eachDays = eachDayOfInterval({ start: calendarFirstDay, end: calendarLastDay });
    const dayOfWeekArray = eachDays.slice(0, 7).map(date => localizeDayOfWeekString(date, false));
    const formatSeparate = separate() as '/' | '-';
    const enableWeekNumber = logseq.settings!.booleanLcWeekNumber as boolean;
    const formatYearMonthTargetDate = format(targetDate, `yyyy${formatSeparate}MM`);
    const formatYearMonthThisMonth = format(today, `yyyy${formatSeparate}MM`);
    const isCurrentMonth = formatYearMonthTargetDate === formatYearMonthThisMonth
    const headerFontSize = isCurrentMonth ? '1.4em' : '1.05em'
  
    const [pageExistsMap, setPageExistsMap] = useState<Record<string, boolean>>({});
    const [holidayMap, setHolidayMap] = useState<Record<string, string>>({});
    const [alerts, setAlerts] = useState<Array<{ date: Date, text: string, isToday: boolean }>>([]);
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
    const [weekExistsMap, setWeekExistsMap] = useState<Record<string, boolean>>({});
  
    const cellRefs = React.useRef<Map<string, HTMLTableCellElement | null>>(new Map());
    // remove any legacy alerts injected outside React to avoid duplicates
    useEffect(() => {
      try {
        const existing = parent.document.querySelectorAll('.leftCalendarHolidayAlert') as NodeListOf<HTMLElement>
        if (existing && existing.length > 0) existing.forEach(e => e.remove())
      } catch (e) { /* ignore in environments without parent */ }
    }, [])
  useEffect(() => {
    // check page existence and holidays for displayed days
    const run = async () => {
      const pMap: Record<string, boolean> = {}
      const hMap: Record<string, string> = {}
      const wMap: Record<string, boolean> = {}
      for (const d of eachDays) {
        const pageName = format(d, preferredDateFormat)
        if (pageName) {
          try { pMap[pageName] = await findPageUuid(pageName) as boolean } catch { pMap[pageName] = false }
          try { hMap[pageName] = await getHolidays(d) } catch { hMap[pageName] = '' }
        }
      }
      // check weekly pages for each week's start
      if (logseq.settings!.booleanWeeklyJournal === true) {
        for (let w = 0; w < eachDays.length; w += 7) {
          const date = eachDays[w]
          const { year, weekString, quarter } = getWeeklyNumberFromDate(date, logseq.settings?.weekNumberFormat === 'US format' ? 0 : 1)
          const pageName = getWeeklyNumberString(year, weekString, quarter)
          try { wMap[pageName] = await findPageUuid(pageName) as boolean } catch { wMap[pageName] = false }
        }
      }
      setPageExistsMap(pMap)
      setHolidayMap(hMap)
      setWeekExistsMap(wMap)
    }
    run()
  }, [preferredDateFormat, targetDate])

  // After render, apply userColor to actual TD elements and build alerts list
  useEffect(() => {
    const newAlerts: Array<{ date: Date, text: string, isToday: boolean }> = []
    for (const d of eachDays) {
      const key = d.toISOString()
      const el = cellRefs.current.get(key)
      if (!el) continue
      // Apply userColor (mutates element styles) and get eventName
      try {
        const eventName = userColor(d, el as HTMLElement)
        const isTodayFlag = isToday(d)
        // collect unique messages per date via a Set (dedupe)
        const msgs: Set<string> = new Set()
        if (eventName) {
          for (const ev of eventName.split('\n')) msgs.add(ev.trim())
        }
        // holidays
        const pageName = format(d, preferredDateFormat)
        const holiday = pageName ? holidayMap[pageName] || '' : ''
        if (holiday) {
          if ((logseq.settings!.lcHolidaysAlert === 'Today only' && isTodayFlag) || logseq.settings!.lcHolidaysAlert === 'Monthly')
            for (const h of holiday.split('\n')) msgs.add(h.trim())
        }

        // push deduped and ordered: user events first, then holidays
        for (const m of Array.from(msgs)) newAlerts.push({ date: d, text: m, isToday: isTodayFlag })

        // enhance tooltip/title on the cell: show user events, holiday, then page name
        const titleParts: string[] = []
        if (eventName) titleParts.push(...eventName.split('\n').map(s => s.trim()).filter(Boolean))
        if (holiday) titleParts.push(...holiday.split('\n').map(s => s.trim()).filter(Boolean))
        if (pageName) titleParts.push(pageName)
        if (titleParts.length > 0) el.title = titleParts.join('\n')
      } catch (e) { /* ignore */ }
    }
    setAlerts(newAlerts)
  }, [holidayMap, pageExistsMap, targetDate])

  // Group alerts by date for UI (yyyy-MM-dd)
  const groupedAlerts = useMemo(() => {
    const map: Record<string, Array<{ date: Date, text: string, isToday: boolean }>> = {}
    for (const a of alerts) {
      const k = format(a.date, 'yyyy-LL-dd')
      map[k] = map[k] || []
      map[k].push(a)
    }
    // sort keys ascending
    const ordered: Record<string, typeof map[string]> = {}
    Object.keys(map).sort().forEach(k => { ordered[k] = map[k] })
    return ordered
  }, [alerts])

  const toggleGroup = (k: string) => setCollapsedGroups(s => ({ ...s, [k]: !s[k] }))

  // apply weekday-specific color to rendered TDs when appropriate
  useEffect(() => {
    for (const d of eachDays) {
      const key = d.toISOString()
      const el = cellRefs.current.get(key)
      if (!el) continue
      try {
        if (logseq.settings?.booleanWeekendsColor === true) {
          // applyWeekendColor actually reads per-day settings (userWeekendMon..Sun)
          applyWeekendColor(el as HTMLElement, shortDayNames[d.getDay()])
        }
      } catch (e) { /* ignore */ }
    }
  }, [holidayMap, pageExistsMap, targetDate])

  const onPrev = () => setTargetDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n })
  const onNext = () => setTargetDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n })
  const onThis = () => setTargetDate(new Date())

  return (
    <div id="left-calendar" className="flex flex-col items-start" style={{ minWidth: '220px', overflowX: 'auto' }}>
      <table style={{ width: 'auto', tableLayout: 'auto' as const, borderCollapse: 'collapse' as const, border: '1px solid rgba(0,0,0,0.08)' }}>
        <thead>
          <tr>
            <th><button className="cursor" title={t('Previous month')} onClick={onPrev}>{'<'}</button></th>
            <th colSpan={enableWeekNumber ? 4 : 3} className="cursor" title={formatYearMonthTargetDate} onClick={(e) => openPageFromPageName(formatYearMonthTargetDate, (e as any).shiftKey)} style={{ fontSize: headerFontSize }}>{localizeMonthLong + (isSameYear(targetDate, today) ? '' : ` ${year}`)}</th>
            <th colSpan={2}><button className="cursor" title={formatYearMonthThisMonth} onClick={onThis}>{'<> '}</button></th>
            <th><button className="cursor" title={t('Next month')} onClick={onNext}>{'>'}</button></th>
          </tr>
          <tr>
            {enableWeekNumber && <th>W</th>}
            {dayOfWeekArray.map((d, i) => {
              // determine day index from the first week slice
              const dowDate = eachDays[i]
              const dayIdx = dowDate ? dowDate.getDay() : i
              const suffix = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayIdx]
              const settingKey = (`userWeekend${suffix}`) as keyof typeof logseq.settings
              const colorName = (logseq.settings && (logseq.settings as any)[settingKey]) as string | undefined
              const headerColor = colorName ? colorMap[colorName] : undefined
              return (
                <th key={i} style={{ fontSize: '0.75em', whiteSpace: 'nowrap', color: headerColor, borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '4px' }}>{d}</th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: eachDays.length / 7 }).map((_, weekIndex) => (
            <tr key={weekIndex}>
              {enableWeekNumber && (() => {
                const wkDate = eachDays[weekIndex * 7]
                const { year: wkYear, weekString, quarter } = getWeeklyNumberFromDate(wkDate, logseq.settings?.weekNumberFormat === 'US format' ? 0 : 1)
                const wkPageName = getWeeklyNumberString(wkYear, weekString, quarter)
                const wkExists = wkPageName ? weekExistsMap[wkPageName] : false
                const weekNum = ISO ? getISOWeek(wkDate) : getWeek(wkDate, { weekStartsOn })
                if (logseq.settings!.booleanWeeklyJournal === true) {
                  return (
                    <td style={{ fontSize: '0.85em' }}>
                      <button
                        className={wkPageName ? 'cursor' : ''}
                        onClick={(e) => openPageFromPageName(wkPageName, (e as any).shiftKey)}
                        style={{ background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', textDecoration: wkExists ? 'underline' : 'none', cursor: 'pointer' }}
                      >
                        {weekNum}
                      </button>
                    </td>
                  )
                }
                return <td style={{ fontSize: '0.85em' }}>{weekNum}</td>
              })()}
              {eachDays.slice(weekIndex * 7, weekIndex * 7 + 7).map((date) => {
                const key = date.toISOString()
                const pageName = format(date, preferredDateFormat)
                const holiday = pageName ? holidayMap[pageName] || '' : ''
                const exists = pageName ? pageExistsMap[pageName] : false
                const isOtherMonth = date.getMonth() !== month - 1
                const checkIsToday = isToday(date)
                const style: React.CSSProperties = { border: '1px solid rgba(0,0,0,0.06)', padding: '6px', whiteSpace: 'nowrap' }
                if (isOtherMonth) { style.opacity = 0.4; style.fontSize = '0.9em' }
                if (checkIsToday) { style.border = `2px solid ${logseq.settings!.boundariesHighlightColorToday}`; style.borderRadius = '50%' }
                if (flag?.singlePage === true && isSameDay(date, initialTargetDate)) style.border = `3px solid ${logseq.settings!.boundariesHighlightColorSinglePage}`
                if (flag?.weekly === true && (ISO ? isSameISOWeek(date, initialTargetDate) : isSameWeek(date, initialTargetDate, { weekStartsOn }))) style.borderBottom = `3px solid ${logseq.settings!.boundariesHighlightColorSinglePage}`
                // highlight holiday according to plugin setting (use underline + text color)
                let holidayClass = ''
                if (holiday && logseq.settings!.booleanLcHolidays === true) {
                  const cssColor = resolveColorChoice(logseq.settings!.choiceHolidaysColor as string | undefined)
                  // apply a subtle background using translucent version when possible
                  const bg = toTranslucent(cssColor, 0.12)
                  style.backgroundColor = bg
                  // make the date number bolder for emphasis
                  style.fontWeight = '700'
                  holidayClass = ' lc-holiday'
                }

                // compute inline style for date number (underline when page exists and indicator setting enabled)
                const dayNumberInlineStyle: React.CSSProperties = {}
                if (exists && logseq.settings!.booleanBoundariesIndicator === true) {
                  dayNumberInlineStyle.textDecoration = 'underline'
                }

                return (
                  <td
                    key={key}
                    ref={(el) => cellRefs.current.set(key, el)}
                    onClick={(e) => pageName && openPageFromPageName(pageName, (e as any).shiftKey)}
                    className={`${pageName ? 'cursor' : ''} lc-day-cell${holidayClass}`}
                    title={holiday !== '' ? `${holiday}\n${pageName}` : pageName}
                    style={style}
                  >
                    <span className="lc-day-number" style={dayNumberInlineStyle}>{date.getDate()}</span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Alerts section (similar to appendHolidayAlert) */}
      <div id="left-calendar-alerts" style={{ marginTop: '0.5rem', width: '100%' }}>
        {Object.keys(groupedAlerts).length === 0 && <div className="text-sm text-gray-500 ml-2">{t('No alerts')}</div>}
        {Object.entries(groupedAlerts).map(([k, items]) => {
          const first = items[0]
          const headerLabel = first.isToday ? t('Today') : localizeMonthDayString(first.date)
          const collapsed = collapsedGroups[k]
          return (
            <div key={k} style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '0.25rem 0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => toggleGroup(k)}>
                <div style={{ fontSize: '0.9em', fontWeight: 600 }}>{headerLabel} <span style={{ fontWeight: 400, marginLeft: 6, color: 'var(--ls-ui-fg-muted)' }}>({items.length})</span></div>
                <div style={{ fontSize: '0.9em', color: 'var(--ls-ui-fg-muted)' }}>{collapsed ? '▸' : '▾'}</div>
              </div>
              {!collapsed && (
                <div style={{ marginTop: '0.25rem', paddingLeft: '0.5rem' }}>
                  {items.map((a, i) => (
                    <div key={i} className="text-sm text-gray-500 leftCalendarHolidayAlert" style={{ marginBottom: 4 }}>
                      {a.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MonthlyCalendar
