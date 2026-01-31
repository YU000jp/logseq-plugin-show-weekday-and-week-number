import {
	addDays,
	eachDayOfInterval,
	format,
	getISOWeek,
	getWeek,
	isSameDay,
	isSameISOWeek,
	isSameWeek,
	isSameYear,
	isToday,
	startOfISOWeek,
	startOfMonth,
	startOfWeek,
} from "date-fns"
import { t } from "logseq-l10n"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { separate } from "../journals/nav"
import {
	colorMap,
	getUserColorData,
	getRelativeDateString,
	getWeeklyNumberFromDate,
	getWeeklyNumberString,
	localizeDayOfWeekString,
	localizeMonthDayString,
	localizeMonthString,
	openPageFromPageName,
	resolveColorChoice,
	toTranslucent
} from "../lib"
import { computeAlertBackground, computeCellBackground, computeDayNumberStyle, UserColorInfo } from "../lib/calendarUtils"
import { getHolidays } from "../lib/holidays"
import { getIcsEventsForDate, IcsEvent, loadIcsOnce } from "../lib"
import { findPageUuid } from "../lib/query/advancedQuery"
import { useJournalPreview } from "./JournalPreview"

// local Day type (0=Sun..6=Sat) — keep as a simple alias where used in this component
type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type Props = {
	targetDate: Date;
	preferredDateFormat: string;
	flag?: { singlePage?: boolean; weekly?: boolean };
	onTargetDateChange?: (date: Date) => void;
	settingsUpdateKey?: number;
};

type AlertItem = { date: Date; text: string; isToday: boolean; source?: "user" | "holiday" | "ics"; description?: string; uid?: string; ics?: IcsEvent }

const WeeklyCell: React.FC<{ date: Date; ISO: boolean; weekStartsOn: Day }> = ({ date, ISO, weekStartsOn }) => {
	const weekNumber = ISO ? getISOWeek(date) : getWeek(date, { weekStartsOn });
	return <td style={{ fontSize: "0.85em" }}>{weekNumber}</td>;
};

export const MonthlyCalendar: React.FC<Props> = ({ targetDate: initialTargetDate, preferredDateFormat, flag, onTargetDateChange, settingsUpdateKey }) => {
	const [targetDate, setTargetDate] = useState<Date>(initialTargetDate);
	// If parent updates the prop targetDate (via refresh), sync internal state
	useEffect(() => {
		setTargetDate(initialTargetDate);
	}, [initialTargetDate]);
	const today = new Date();
	const year = targetDate.getFullYear();
	const month = targetDate.getMonth() + 1;
	const localizeMonthLong = localizeMonthString(targetDate, true);
	const startOfMonthDay = startOfMonth(targetDate);
	const ISO = logseq.settings!.weekNumberFormat === "ISO(EU) format";
	const weekStartsOn: Day = logseq.settings!.boundariesWeekStart === "Monday" ? 1 : logseq.settings!.boundariesWeekStart === "Saturday" ? 6 : 0;
	const calendarFirstDay: Date = logseq.settings!.boundariesWeekStart === "unset" && ISO ? startOfISOWeek(startOfMonthDay) : startOfWeek(startOfMonthDay, { weekStartsOn });
	const calendarLastDay: Date = addDays(calendarFirstDay, 34);
	const eachDays = eachDayOfInterval({ start: calendarFirstDay, end: calendarLastDay });
	const dayOfWeekArray = eachDays.slice(0, 7).map((date) => localizeDayOfWeekString(date, false));
	const formatSeparate = separate() as "/" | "-";
	const enableWeekNumber = logseq.settings!.booleanLcWeekNumber as boolean;
	const formatYearMonthTargetDate = format(targetDate, `yyyy${formatSeparate}MM`);
	const formatYearMonthThisMonth = format(today, `yyyy${formatSeparate}MM`);
	const isCurrentMonth = formatYearMonthTargetDate === formatYearMonthThisMonth;
	const headerFontSize = isCurrentMonth ? "1.4em" : "1.05em";

	const [pageExistsMap, setPageExistsMap] = useState<Record<string, boolean>>({});
	const [holidayMap, setHolidayMap] = useState<Record<string, string>>({});
	const [alerts, setAlerts] = useState<Array<AlertItem>>([]);
	const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
	const [weekExistsMap, setWeekExistsMap] = useState<Record<string, boolean>>({});
	const [userColorMap, setUserColorMap] = useState<Record<string, { color?: string; fontWeight?: string; eventName?: string }>>({});
	const [icsMap, setIcsMap] = useState<Record<string, IcsEvent[]>>({});
	const [expandedIcs, setExpandedIcs] = useState<Record<string, boolean>>({});
	const monthInputRef = useRef<HTMLInputElement | null>(null);
	const todayGroupRef = useRef<HTMLDivElement | null>(null);
	const [hasScrolledToToday, setHasScrolledToToday] = useState<boolean>(false);
	// Inline editor state for editing user events (replaces modal)
	const [showInlineEditor, setShowInlineEditor] = useState<boolean>(false);
	const [editorText, setEditorText] = useState<string>((logseq.settings!.userColorList as string) || "");
	useEffect(() => {
		// check page existence, holidays, and compute userColor data for displayed days
		const run = async () => {
			const pMap: Record<string, boolean> = {};
			const hMap: Record<string, string> = {};
			const wMap: Record<string, boolean> = {};
			const uMap: Record<string, { color?: string; fontWeight?: string; eventName?: string }> = {};
			for (const d of eachDays) {
				const pageName = format(d, preferredDateFormat);
				if (pageName) {
					try {
						pMap[pageName] = (await findPageUuid(pageName)) as boolean;
					} catch {
						pMap[pageName] = false;
					}
					try {
						hMap[pageName] = await getHolidays(d);
					} catch {
						hMap[pageName] = "";
					}
				}
				// compute user color data (pure, no DOM mutation)
				try {
					const info = getUserColorData(d);
					if (info && info.eventName) uMap[d.toISOString()] = info;
				} catch (e) {
					/* ignore */
				}
			}
			// check weekly pages for each week's start
			if (logseq.settings!.booleanWeeklyJournal === true) {
				for (let w = 0; w < eachDays.length; w += 7) {
					const date = eachDays[w];
					const { year, weekString, quarter } = getWeeklyNumberFromDate(date, logseq.settings?.weekNumberFormat === "US format" ? 0 : 1);
					const pageName = getWeeklyNumberString(year, weekString, quarter);
					try {
						wMap[pageName] = (await findPageUuid(pageName)) as boolean;
					} catch {
						wMap[pageName] = false;
					}
				}
			}
			setPageExistsMap(pMap);
			setHolidayMap(hMap);
			setWeekExistsMap(wMap);
			setUserColorMap(uMap);
			// load ICS events for visible range (one-shot; live updates come from sync in left-calendar)
			try {
				const raw = (logseq.settings!.lcIcsUrls as string) || ""
				const urls = String(raw || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean)
				if (urls.length > 0) {
					await loadIcsOnce(urls)
					const map: Record<string, IcsEvent[]> = {}
					for (const d of eachDays) {
						const key = format(d, "yyyy-LL-dd")
						map[key] = getIcsEventsForDate(d)
					}
					setIcsMap(map)
				} else {
					// If URLs are cleared, drop stale ICS state immediately.
					setIcsMap({})
				}
			} catch (e) {
				// ignore
				setIcsMap({})
			}
		};
		run();
	}, [preferredDateFormat, targetDate, settingsUpdateKey]);

	// Build alerts list using computed holidayMap and userColorMap (no DOM mutations)
	useEffect(() => {
		const newAlerts: AlertItem[] = [];
		for (const d of eachDays) {
			const isTodayFlag = isToday(d);
			// use a map to preserve source info; if same text exists for both user and holiday, prefer 'user'
			const msgs: Record<string, "user" | "holiday"> = {};
			const u = userColorMap[d.toISOString()];
			if (u && u.eventName) {
				for (const ev of u.eventName.split("\n")) msgs[ev.trim()] = "user";
			}
			const pageName = format(d, preferredDateFormat);
			const holiday = pageName ? holidayMap[pageName] || "" : "";
			if (holiday) {
				if ((logseq.settings!.lcHolidaysAlert === "Today only" && isTodayFlag) || logseq.settings!.lcHolidaysAlert === "Monthly")
					for (const h of holiday.split("\n")) {
						const k = h.trim();
						if (!k) continue;
						// do not overwrite a user-sourced message
						if (!msgs[k]) msgs[k] = "holiday";
					}
			}
			// include ICS events (added below with source='ics')
			const icsKey = format(d, "yyyy-LL-dd")
			const icsEvents = icsMap[icsKey] || []
			for (const [m, src] of Object.entries(msgs)) newAlerts.push({ date: d, text: m, isToday: isTodayFlag, source: src });
			// push ICS with proper source and description (avoid duplicate text)
			for (const ev of icsEvents) {
				const label = ev.isTodo ? `TODO: ${ev.summary}` : ev.summary
				// if same text already present from user, skip; otherwise add as 'ics'
				const already = newAlerts.find(a => a.date.getTime() === d.getTime() && a.text === label)
				if (!already) newAlerts.push({ date: d, text: label, isToday: isTodayFlag, source: 'ics', description: ev.description, uid: ev.uid, ics: ev })
			}
		}
		setAlerts(newAlerts);
	}, [holidayMap, pageExistsMap, userColorMap, icsMap, targetDate]);

	// Group alerts by date for UI (yyyy-MM-dd)
	const groupedAlerts = useMemo(() => {
		const map: Record<string, Array<AlertItem>> = {};
		for (const a of alerts) {
			const k = format(a.date, "yyyy-LL-dd");
			map[k] = map[k] || [];
			map[k].push(a);
		}
		// sort keys ascending
		const ordered: Record<string, Array<AlertItem>> = {};
		Object.keys(map)
			.sort()
			.forEach((k) => {
				ordered[k] = map[k];
			});
		return ordered;
	}, [alerts]);

	const toggleGroup = (k: string) => setCollapsedGroups((s) => ({ ...s, [k]: !s[k] }));

	// Auto-collapse past events when setting is enabled
	useEffect(() => {
		const autoCollapse = logseq.settings!.booleanLcAutoCollapsePastEvents as boolean;
		if (!autoCollapse) return;

		const todayStr = format(new Date(), "yyyy-LL-dd");
		const newCollapsed: Record<string, boolean> = {};
		
		for (const k of Object.keys(groupedAlerts)) {
			// Don't auto-collapse today's events
			if (k !== todayStr && k < todayStr) {
				newCollapsed[k] = true;
			}
		}
		
		setCollapsedGroups((prev) => ({ ...prev, ...newCollapsed }));
	}, [groupedAlerts]);

	// Scroll to Today group when it first becomes available
	useEffect(() => {
		if (!hasScrolledToToday && todayGroupRef.current) {
			todayGroupRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			setHasScrolledToToday(true);
		}
	}, [groupedAlerts, hasScrolledToToday]);

	// Reset scroll flag when target date changes
	useEffect(() => {
		setHasScrolledToToday(false);
	}, [targetDate]);

	// Internal: perform immediate removal from settings.userColorList
	const performRemoveImmediate = async (date: Date, text: string) => {
		try {
			const current = (logseq.settings!.userColorList as string) || "";
			if (!current) return;
			const lines = current
				.split(/\r?\n/)
				.map((l) => l.trim())
				.filter(Boolean);
			const keep: string[] = [];
			for (const line of lines) {
				const parts = line.split("::");
				const dateString = (parts[0] || "").trim();
				const eventName = (parts.slice(1).join("::") || "").trim();
				if (eventName !== text) {
					keep.push(line);
					continue;
				}
				const matches =
					(dateString.split("/").length === 3 && (format(date, "yyyy/MM/dd") === dateString || format(date, "yyyy/M/d") === dateString)) ||
					(dateString.split("/").length === 2 && (format(date, "MM/dd") === dateString || format(date, "M/d") === dateString));
				if (!matches) keep.push(line);
				// if matches, drop the line
			}
			const newValue = keep.join("\n");
			await logseq.updateSettings({ userColorList: newValue });
			setTargetDate((d) => new Date(d.getTime()));
			logseq.UI.showMsg("Removed", "success", { timeout: 1200 });
		} catch (e) {
			logseq.UI.showMsg("Failed to remove", "warning", { timeout: 1800 });
		}
	};

	// Pending removal state and timers (keyed by `${date.toISOString()}::${text}`)
	const pendingRemovalTimers = React.useRef<Record<string, number>>({});
	const [pendingRemovals, setPendingRemovals] = useState<Record<string, boolean>>({});
	// keys that should be hidden immediately when timer expires
	const [hiddenRemovals, setHiddenRemovals] = useState<Record<string, boolean>>({});

	// Tooltip preview state
	const [hoverPage, setHoverPage] = useState<string | undefined>(undefined);
	const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
	const { html: hoverHtml } = useJournalPreview(hoverPage, preferredDateFormat);

	// Ensure tooltip element in parent document and update on changes
	useEffect(() => {
		const id = "lc-journal-tooltip-root"
		try {
			const doc = parent.document
			let el = doc.getElementById(id) as HTMLDivElement | null
			if (!hoverPage) {
				if (el) el.remove()
				return
			}
			if (!el) {
				el = doc.createElement("div")
				el.id = id
				doc.body.appendChild(el)
			}
			el.style.position = "fixed"
			// shift 1em to the right to avoid overlapping the cursor/cell
			const em = parseFloat(getComputedStyle(doc.documentElement).fontSize || "16") || 16
			el.style.left = `${tooltipPos.left + em}px`
			el.style.top = `${tooltipPos.top}px`
			el.style.zIndex = "99999"
			// use computed colors from parent body to avoid semi-transparent CSS vars
			const bodyStyle = getComputedStyle(doc.body)
			el.style.background = bodyStyle.backgroundColor || "rgba(255,255,255,1)"
			el.style.color = bodyStyle.color || "var(--ls-ui-fg)"
			el.style.boxShadow = "0 6px 18px rgba(0,0,0,0.15)"
			// increase opacity to make background less transparent
			// make fully opaque for readability
			el.style.opacity = "1"
			// reduce font-size for tooltip content
			el.style.fontSize = "0.85em"
			el.style.padding = "10px"
			el.style.borderRadius = "8px"
			el.style.maxWidth = "420px"
			el.style.maxHeight = "360px"
			el.style.overflow = "auto"
			el.style.pointerEvents = "auto"
			if (hoverHtml) el.innerHTML = hoverHtml
			else el.textContent = hoverPage
		} catch (e) {
			// parent document might be unavailable
		}
		return () => {
			try {
				const el = parent.document.getElementById("lc-journal-tooltip-root") as HTMLDivElement | null
				if (el) el.remove()
			} catch (e) {}
		}
	}, [hoverPage, hoverHtml, tooltipPos])

	const formatIcsWhen = (ev?: IcsEvent) => {
		if (!ev) return undefined
		const start = ev.start || ev.date
		const end = ev.end
		if (ev.isAllDay) {
			return t("All day")
		}
		try {
			const startStr = format(start, "HH:mm")
			const endStr = end ? format(end, "HH:mm") : undefined
			return endStr ? `${startStr}–${endStr}` : startStr
		} catch {
			return undefined
		}
	}

	const makeKey = (date: Date, text: string) => `${date.toISOString()}::${text}`;

	// Schedule removal with 3-second undo window; second click cancels
	const removeUserEvent = (date: Date, text: string) => {
		const key = makeKey(date, text);
		if (pendingRemovals[key]) {
			// cancel pending
			const id = pendingRemovalTimers.current[key];
			if (id) clearTimeout(id);
			delete pendingRemovalTimers.current[key];
			setPendingRemovals((s) => {
				const c = { ...s };
				delete c[key];
				return c;
			});
			logseq.UI.showMsg("Cancelled", "warning", { timeout: 1000 });
			return;
		}
		// schedule
		setPendingRemovals((s) => ({ ...s, [key]: true }));
		const id = window.setTimeout(async () => {
			try {
				// hide immediately in UI
				setHiddenRemovals((s) => ({ ...s, [key]: true }));
				await performRemoveImmediate(date, text);
			} finally {
				delete pendingRemovalTimers.current[key];
				setPendingRemovals((s) => {
					const c = { ...s };
					delete c[key];
					return c;
				});
				setHiddenRemovals((s) => {
					const c = { ...s };
					delete c[key];
					return c;
				});
			}
		}, 3000);
		pendingRemovalTimers.current[key] = id;
		logseq.UI.showMsg("Will remove in 3s (click again to cancel)", "warning", { timeout: 2000 });
	};

	// No direct DOM mutation: weekend color will be applied via getWeekendColor in render

	// compute holidays background color from settings
	const holidaysCssColor = resolveColorChoice(logseq.settings!.choiceHolidaysColor as string | undefined);
	const holidaysBg = toTranslucent(holidaysCssColor, 0.12);

	const onPrev = () =>
		setTargetDate((d) => {
			const n = new Date(d);
			n.setMonth(n.getMonth() - 1);
			return n;
		});
	const onNext = () =>
		setTargetDate((d) => {
			const n = new Date(d);
			n.setMonth(n.getMonth() + 1);
			return n;
		});
	// const onThis = () => setTargetDate(new Date());

	// notify parent when internal date changes
	useEffect(() => {
		try {
			if (onTargetDateChange) onTargetDateChange(targetDate);
		} catch (e) {
			/* ignore */
		}
	}, [targetDate]);

	return (
		<div
			id="left-calendar"
			className={`flex flex-col items-start ${showInlineEditor ? "lc-hidden-for-edit" : ""}`}
			style={{ minWidth: "220px", overflowX: "auto", position: "relative" }}>
			<table style={{ width: "auto", tableLayout: "auto" as const, borderCollapse: "collapse" as const, border: "1px solid rgba(0,0,0,0.08)" }}>
				<thead>
					<tr>
						<th>
							<button
								className="cursor"
								title={t("Previous month")}
								onClick={onPrev}>
								{"<"}
							</button>
						</th>
						<th style={{ position: "absolute", left: "1em", top: 0 }}>
							<button
								className="cursor"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									// prefer showPicker when available, fallback to click()
									if (monthInputRef.current) {
										try {
											(monthInputRef.current as any).showPicker?.();
										} catch {}
										if (!(monthInputRef.current as any).showPicker) monthInputRef.current.click();
									}
								}}
								style={{
									marginLeft: 8,
									padding: "2px 6px",
									fontSize: "0.85em",
									borderRadius: 6,
									border: "1px solid var(--ls-border-color)",
									background: "none",
								}}>
								📅
							</button>
						</th>
						<th
							colSpan={enableWeekNumber ? 5 : 4}
							className="cursor"
							title={formatYearMonthTargetDate}
							onClick={(e) => openPageFromPageName(formatYearMonthTargetDate, (e as any).shiftKey)}
							onMouseEnter={(e) => {
								if (formatYearMonthTargetDate) {
									setHoverPage(formatYearMonthTargetDate)
									const rect = (e.target as HTMLElement).getBoundingClientRect()
									setTooltipPos({ left: rect.right + 8, top: rect.top })
								}
							}}
							onMouseMove={(e) => setTooltipPos({ left: (e as React.MouseEvent).clientX + 12, top: (e as React.MouseEvent).clientY + 8 })}
							onMouseLeave={() => setHoverPage(undefined)}
							style={{ fontSize: headerFontSize }}>
							<div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
								<span>{localizeMonthLong + (isSameYear(targetDate, today) ? "" : ` ${year}`)}</span>
								{/* hidden native month input to let user pick year+month without extra UI libs */}
								<input
									type="month"
									ref={monthInputRef}
									style={{ display: "none" }}
									value={`${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`}
									onClick={(e) => e.stopPropagation()}
									onChange={(e) => {
										const v = (e.target as HTMLInputElement).value;
										if (!v) return;
										const [y, m] = v.split("-");
										const d = new Date(Number(y), Number(m) - 1, 1);
										setTargetDate(d);
									}}
								/>
							</div>
						</th>
						<th>
							<button
								className="cursor"
								title={t("Next month")}
								onClick={onNext}>
								{">"}
							</button>
						</th>
					</tr>
					<tr>
						{enableWeekNumber && <th>W</th>}
						{dayOfWeekArray.map((d, i) => {
							// determine day index from the first week slice
							const dowDate = eachDays[i];
							const dayIdx = dowDate ? dowDate.getDay() : i;
							const suffix = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIdx];
							const settingKey = `userWeekend${suffix}` as keyof typeof logseq.settings;
							const colorName = (logseq.settings && (logseq.settings as any)[settingKey]) as string | undefined;
							const headerColor = colorName ? colorMap[colorName] : undefined;
							return (
								<th
									key={i}
									style={{ fontSize: "0.75em", whiteSpace: "nowrap", color: headerColor, borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "4px" }}>
									{d}
								</th>
							);
						})}
					</tr>
				</thead>
				<tbody>
					{Array.from({ length: eachDays.length / 7 }).map((_, weekIndex) => (
						<tr key={weekIndex}>
							{enableWeekNumber &&
								(() => {
									const wkDate = eachDays[weekIndex * 7];
									const { year: wkYear, weekString, quarter } = getWeeklyNumberFromDate(wkDate, logseq.settings?.weekNumberFormat === "US format" ? 0 : 1);
									const wkPageName = getWeeklyNumberString(wkYear, weekString, quarter);
									const wkExists = wkPageName ? weekExistsMap[wkPageName] : false;
									const weekNum = ISO ? getISOWeek(wkDate) : getWeek(wkDate, { weekStartsOn });
									if (logseq.settings!.booleanWeeklyJournal === true) {
										return (
											<td style={{ fontSize: "0.85em" }}>
												<button
													className={wkPageName ? "cursor" : ""}
													onClick={(e) => openPageFromPageName(wkPageName, (e as any).shiftKey)}
													onMouseEnter={(e) => {
														if (wkPageName) {
															setHoverPage(wkPageName)
															const rect = (e.target as HTMLElement).getBoundingClientRect()
															setTooltipPos({ left: rect.right + 8, top: rect.top })
														}
													}}
													onMouseMove={(e) => setTooltipPos({ left: (e as React.MouseEvent).clientX + 12, top: (e as React.MouseEvent).clientY + 8 })}
													onMouseLeave={() => setHoverPage(undefined)}
													style={{
														background: "none",
														border: "none",
														padding: 0,
														margin: 0,
														font: "inherit",
														textDecoration: wkExists ? "underline" : "none",
														cursor: "pointer",
													}}>
													{weekNum}
												</button>
											</td>
										);
									}
									return <td style={{ fontSize: "0.85em" }}>{weekNum}</td>;
								})()}
							{eachDays.slice(weekIndex * 7, weekIndex * 7 + 7).map((date) => {
								const key = date.toISOString();
								const pageName = format(date, preferredDateFormat);
								const holiday = pageName ? holidayMap[pageName] || "" : "";
								const icsKeyForCell = format(date, "yyyy-LL-dd")
								const icsEventsForCell = icsMap[icsKeyForCell] || []
								const exists = pageName ? pageExistsMap[pageName] : false;
								const u = userColorMap[key];
								const isOtherMonth = date.getMonth() !== month - 1;
								const checkIsToday = isToday(date);
								const style: React.CSSProperties = { border: "1px solid rgba(0,0,0,0.06)", padding: "6px", whiteSpace: "nowrap" };
								if (isOtherMonth) {
									style.opacity = 0.4;
									style.fontSize = "0.9em";
								}
								if (checkIsToday) {
									style.border = `2px solid ${logseq.settings!.boundariesHighlightColorToday}`;
									style.borderRadius = "50%";
								}
								if (flag?.singlePage === true && isSameDay(date, initialTargetDate))
									style.border = `3px solid ${logseq.settings!.boundariesHighlightColorSinglePage}`;
								if (flag?.weekly === true && (ISO ? isSameISOWeek(date, initialTargetDate) : isSameWeek(date, initialTargetDate, { weekStartsOn })))
									style.borderBottom = `3px solid ${logseq.settings!.boundariesHighlightColorSinglePage}`;
								// determine cell background and class via shared utility
								const hasIcs = icsEventsForCell.length > 0
								const bgInfo = computeCellBackground(
									u as UserColorInfo | undefined,
									holiday,
									logseq.settings!.booleanLcHolidays === true,
									logseq.settings!.choiceHolidaysColor as string | undefined,
									logseq.settings!.choiceUserColor as string | undefined,
									hasIcs
								);
								let holidayClass = bgInfo.className || "";
								if (bgInfo.backgroundColor) style.backgroundColor = bgInfo.backgroundColor;
								if (bgInfo.fontWeight) style.fontWeight = bgInfo.fontWeight as any;

								// compute inline style for date number (underline when page exists)
								const dayNumberInlineStyle: React.CSSProperties = {};
								if (exists) {
									dayNumberInlineStyle.textDecoration = "underline";
								}

								// apply userColor and weekend color via shared utility
								const dnStyle = computeDayNumberStyle(u as UserColorInfo | undefined, date.getDay(), logseq.settings?.booleanWeekendsColor === true);
								Object.assign(dayNumberInlineStyle, dnStyle);

								// build title from user events, holiday, then page name
								const titleParts: string[] = [];
								if (u && u.eventName)
									titleParts.push(
										...u.eventName
											.split("\n")
											.map((s) => s.trim())
											.filter(Boolean)
									);
								if (holiday)
									titleParts.push(
										...holiday
											.split("\n")
											.map((s) => s.trim())
											.filter(Boolean)
									);
								if (icsEventsForCell.length > 0) {
									titleParts.push(
										...icsEventsForCell
											.map((ev) => (ev.isTodo ? `TODO: ${ev.summary}` : ev.summary))
											.map((s) => String(s || "").trim())
											.filter(Boolean)
									)
								}
								if (pageName) titleParts.push(pageName);
								const combinedTitle = titleParts.length > 0 ? titleParts.join("\n") : undefined;

									return (
										<td
											key={key}
											onClick={(e) => pageName && openPageFromPageName(pageName, (e as any).shiftKey)}
											className={`${pageName ? "cursor" : ""} lc-day-cell${holidayClass}`}
											// use custom tooltip instead of native title
											aria-label={combinedTitle ?? pageName}
											onMouseEnter={(e) => {
												const rect = (e.target as HTMLElement).getBoundingClientRect()
												setTooltipPos({ left: rect.right + 8, top: rect.top })
												// If user/holiday/ICS exists, show them as a header in the tooltip (reuse existing marker parsing)
												if ((u && u.eventName) || holiday || icsEventsForCell.length > 0) {
													const extraLines: string[] = []
													if (u && u.eventName) {
														extraLines.push(
															...u.eventName
																.split("\n")
																.map((s) => s.trim())
																.filter(Boolean)
														)
													}
													if (holiday) {
														extraLines.push(
															...holiday
																.split("\n")
																.map((s) => s.trim())
																.filter(Boolean)
														)
													}
													if (icsEventsForCell.length > 0) {
														extraLines.push(
															...icsEventsForCell
																.map((ev) => (ev.isTodo ? `TODO: ${ev.summary}` : ev.summary))
																.map((s) => String(s || "").trim())
																.filter(Boolean)
														)
													}
													const marker = "__HOL__::";
													const payload = marker + encodeURIComponent(extraLines.join("\n")) + "|||" + (pageName || "");
													setHoverPage(payload)
													return
												}
												if (pageName) {
													setHoverPage(pageName)
												}
											}}
											onMouseMove={(e) => {
												setTooltipPos({ left: (e as React.MouseEvent).clientX + 12, top: (e as React.MouseEvent).clientY + 8 })
											}}
											onMouseLeave={() => setHoverPage(undefined)}
										style={style}>
											<span
												className="lc-day-number"
												style={dayNumberInlineStyle}>
												{date.getDate()}
											</span>
										</td>
									);
							})}
						</tr>
					))}
				</tbody>
			</table>
			{/* Alerts section (similar to appendHolidayAlert) */}
			<div
				id="left-calendar-alerts"
				style={{ marginTop: "0.5rem", width: "100%" }}>
				<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.25rem" }}>
					{" "}
					{showInlineEditor && <div style={{ flexGrow: 1, fontWeight: "600", fontSize: "0.95em" }}>{t("User event")}</div>}
					<button
						className="cursor"
						title={t("User event")}
						onClick={() => {
							setEditorText((logseq.settings!.userColorList as string) || "");
							setShowInlineEditor(true);
						}}
						style={{ background: "none", border: "1px solid var(--ls-border-color)", padding: "2px 6px", borderRadius: 6 }}>
						□
					</button>
				</div>
				{showInlineEditor && (
					<div
						className="lc-inline-editor"
						style={{ marginBottom: "0.5rem" }}>
						<label style={{ display: "block", marginBottom: 6, fontSize: "0.85em" }}>
							{t("Input in the form of yyyy/mm/dd::Event name")}
							<br />
							{t("If you input in the form of mm/dd::Event name, the color will be applied every year on that day.")}
						</label>
						<textarea
							className="lc-inline-textarea"
							value={editorText}
							onChange={(e) => setEditorText((e.target as HTMLTextAreaElement).value)}
							style={{ width: "100%", minHeight: 240, marginBottom: 8 }}
							title={t("Enter multiple lines in the textarea.")}
							placeholder={t("Enter here")}


						/>
						<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
							{/* サンプル挿入ボタンを設置したい */}
							<button
								className="cursor"
								onClick={() => {
									// 当日の日付でサンプルを挿入
									const sample = `${format(new Date(), "yyyy/MM/dd")}::Sample`;
									//サンプルの値を現在のtextareaの値の最後尾に挿入
									setEditorText((prev) => (prev ? prev + "\n" + sample : sample));
								}}
								style={{ padding: "6px 10px", width: "100%" }}>
								{t("Insert Sample")}
							</button>
							<button
								className="cursor"
								onClick={() => {
									setShowInlineEditor(false);
								}}
								style={{ padding: "6px 10px", width: "100%" }}>
								{t("Cancel")}
							</button>
							<button
								className="cursor"
								onClick={async () => {
									try {
										await logseq.updateSettings({ userColorList: editorText });
										logseq.UI.showMsg("Saved", "success", { timeout: 1500 });
										setTargetDate((d) => new Date(d.getTime()));
									} catch (e) {
										logseq.UI.showMsg("Failed to save", "warning", { timeout: 2000 });
									} finally {
										setShowInlineEditor(false);
									}
								}}
								style={{ padding: "6px 10px", width: "100%" }}>
								{t("Confirm")}
							</button>
						</div>
					</div>
				)}
				{Object.keys(groupedAlerts).length === 0 && (
					<div
						className="text-sm ml-2"
						style={{ color: "var(--ls-ui-fg-muted)" }}>
						{t("No alerts")}
					</div>
				)}
				{Object.entries(groupedAlerts)
					.filter(([k, items]) => {
						// Filter past events if the setting is enabled
						const hidePast = logseq.settings!.booleanLcHidePastEvents as boolean;
						if (!hidePast) return true;
						
						const todayStr = format(today, "yyyy-LL-dd");
						// Always show today and future events
						return k >= todayStr;
					})
					.map(([k, items]) => {
					const first = items[0];
					const headerLabel = first.isToday ? t("Today") : localizeMonthDayString(first.date);
					const relativeLabel = first.isToday ? "" : getRelativeDateString(first.date, today);
					const collapsed = collapsedGroups[k];
					return (
						<div
							key={k}
							ref={first.isToday ? todayGroupRef : null}
							style={{ borderTop: "1px solid rgba(0,0,0,0.06)", padding: "0.25rem 0.5rem" }}>
							<div
								style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
								onClick={() => toggleGroup(k)}>
								<div style={{ fontSize: "0.9em", fontWeight: 600 }}>
									{headerLabel}
									<span style={{ fontWeight: 400, marginLeft: 6, color: "var(--ls-ui-fg-muted)" }}>({items.length})</span>
									{relativeLabel && (
										<span style={{ fontWeight: 400, marginLeft: 8, color: "var(--ls-ui-fg-muted)" }}>
											({relativeLabel})
										</span>
									)}
								</div>
								<div style={{ fontSize: "0.9em", color: "var(--ls-ui-fg-muted)" }}>{collapsed ? "▸" : "▾"}</div>
							</div>
							{!collapsed && (
								<div style={{ marginTop: "0.25rem", paddingLeft: "0.5rem" }}>
									{items.map((a, i) => {
										const isTodayItem = isSameDay(a.date, today);
										const isYesterdayItem = isSameDay(a.date, addDays(today, -1));
										const shouldHighlight = isTodayItem || isYesterdayItem;
										const itemBg = computeAlertBackground(
											a.source,
											a.date.toISOString(),
											userColorMap,
											holidaysBg,
											logseq.settings!.choiceUserColor as string | undefined
										);
										const key = makeKey(a.date, a.text)
										return (
											<div
												key={i}
												className="text-sm leftCalendarHolidayAlert"
												style={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
													marginBottom: 4,
													color: shouldHighlight ? "var(--ls-ui-fg)" : "var(--ls-ui-fg-muted)",
													backgroundColor: itemBg,
													padding: "4px 6px",
													borderRadius: 6,
													border: shouldHighlight ? `1px solid ${logseq.settings!.boundariesHighlightColorToday}` : "1px solid transparent",
												}}>
												<div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
													<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
														<div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
															<span
																style={{
																	fontSize: '0.72em',
																	fontWeight: shouldHighlight ? 800 : 700,
																	letterSpacing: '0.04em',
																	padding: '1px 6px',
																	borderRadius: 999,
																	border: '1px solid var(--ls-border-color)',
																	color: 'var(--ls-ui-fg-muted)',
																	background: 'var(--ls-secondary-background-color)',
																	flex: '0 0 auto',
																}}>
																{a.source === 'holiday' ? 'HOL' : a.source === 'ics' ? 'ICS' : 'USR'}
															</span>
															{a.source === 'ics' ? (
																<button
																	className="cursor"
																	onClick={(e) => {
																		e.stopPropagation();
																		setExpandedIcs((s) => ({ ...s, [key]: !s[key] }));
																	}}
																	style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', minWidth: 0, flex: 1 }}>
																	<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{a.text}</span>
																</button>
															) : (
																<span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{a.text}</span>
															)}
														</div>
														{a.source === "user" &&
															(() => {
																const pending = !!pendingRemovals[key];
																return (
																	<button
																		className="cursor"
																		aria-label={pending ? "Cancel removal" : "Remove"}
																		title={pending ? "Cancel" : "Remove"}
																		onClick={(e) => {
																			e.stopPropagation();
																			removeUserEvent(a.date, a.text);
																		}}
																		style={{
																			background: "none",
																			border: "none",
																			color: pending ? "var(--ls-error-color, #ef4444)" : "var(--ls-ui-fg-muted)",
																			fontSize: "0.9em",
																			cursor: "pointer",
																		}}>
																		{pending ? "Cancel" : "×"}
																	</button>
																);
															})()}
													</div>
													{expandedIcs[key] && a.source === 'ics' && (
														<div style={{ marginTop: 6, padding: 8, background: 'rgba(0,0,0,0.03)', borderRadius: 6, color: 'var(--ls-ui-fg)'}}>
															<div style={{ fontSize: '0.9em', fontWeight: 650, marginBottom: 6 }}>{a.text}</div>
															{(() => {
																const when = formatIcsWhen(a.ics)
																const location = a.ics?.location
																const status = a.ics?.status
																const organizer = a.ics?.organizer
																const desc = a.description
																return (
																	<div style={{ display: 'grid', gap: 6 }}>
																		{when ? (
																			<div style={{ fontSize: '0.82em', color: 'var(--ls-ui-fg-muted)' }}>
																				<span style={{ fontWeight: 600 }}>{t("Time")}: </span>
																				<span>{when}</span>
																			</div>
																		) : null}
																		{location ? (
																			<div style={{ fontSize: '0.82em', color: 'var(--ls-ui-fg-muted)' }}>
																				<span style={{ fontWeight: 600 }}>{t("Location")}: </span>
																				<span style={{ whiteSpace: 'pre-wrap' }}>{location}</span>
																			</div>
																		) : null}
																		{status ? (
																			<div style={{ fontSize: '0.82em', color: 'var(--ls-ui-fg-muted)' }}>
																				<span style={{ fontWeight: 600 }}>{t("Status")}: </span>
																				<span>{status}</span>
																			</div>
																		) : null}
																		{organizer ? (
																			<div style={{ fontSize: '0.82em', color: 'var(--ls-ui-fg-muted)' }}>
																				<span style={{ fontWeight: 600 }}>{t("Organizer")}: </span>
																				<span style={{ whiteSpace: 'pre-wrap' }}>{organizer}</span>
																			</div>
																		) : null}
																		{desc ? (
																			<div style={{ marginTop: 2, whiteSpace: 'pre-wrap', fontSize: '0.85em', color: 'var(--ls-ui-fg)' }}>{desc}</div>
																		) : null}
																	</div>
																)
															})()}
														</div>
													)}
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Inline editor replaces modal; no modal rendering here */}
		</div>
	);
};

export default MonthlyCalendar;
