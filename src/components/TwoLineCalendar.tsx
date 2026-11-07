import { addDays, format, startOfISOWeek, startOfWeek } from "date-fns";
import { t } from "logseq-l10n";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { separate } from "../journals/nav";
import {
	getUserColorData,
	getWeekendColor,
	IcsEvent,
	getWeeklyNumberFromDate,
	getWeeklyNumberString,
	getWeekStartOn,
	localizeDayOfWeekString,
	localizeMonthString,
	openPageFromPageName,
	shortDayNames,
} from "../lib";
import { getHolidays } from "../lib/holidays";
import { useJournalPreview } from "./JournalPreview";
import { useCalendarData } from "../hooks";
import DayCell from "./DayCell";

type Props = {
	startDate: Date;
	offsets: number[];
	targetElementName: string;
	onRequestScroll?: (deltaWeeks: number) => void;
};

const TwoLineCalendar: React.FC<Props> = ({ startDate, offsets, targetElementName, onRequestScroll }) => {
	const { preferredDateFormat, pageExistsMap, holidayMap, icsMap } = useCalendarData(startDate, offsets);

	// tooltip state
	const [hoverPage, setHoverPage] = useState<string | undefined>(undefined);
	const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
	const { html: hoverHtml } = useJournalPreview(hoverPage, preferredDateFormat);

	useEffect(() => {
		const id = "lc-journal-tooltip-root";
		try {
			const doc = parent.document;
			let el = doc.getElementById(id) as HTMLDivElement | null;
			if (!hoverPage) {
				if (el) el.remove();
				return;
			}
			if (!el) {
				el = doc.createElement("div");
				el.id = id;
				doc.body.appendChild(el);
			}
			el.style.position = "fixed";
			// shift 1em to the right to avoid overlapping the cursor/cell
			const em = parseFloat(getComputedStyle(doc.documentElement).fontSize || "16") || 16;
			el.style.left = `${tooltipPos.left + em}px`;
			el.style.top = `${tooltipPos.top}px`;
			el.style.zIndex = "99999";
			const bodyStyle = getComputedStyle(doc.body);
			el.style.background = bodyStyle.backgroundColor || "rgba(255,255,255,1)";
			el.style.color = bodyStyle.color || "var(--ls-ui-fg)";
			el.style.boxShadow = "0 6px 18px rgba(0,0,0,0.15)";
			// increase opacity to make background less transparent
			el.style.opacity = "1";
			// reduce font-size for tooltip content
			el.style.fontSize = "0.85em";
			el.style.padding = "10px";
			el.style.borderRadius = "8px";
			el.style.maxWidth = "420px";
			el.style.maxHeight = "360px";
			el.style.overflow = "auto";
			el.style.pointerEvents = "auto";
			if (hoverHtml) el.innerHTML = hoverHtml;
			else el.textContent = hoverPage;
		} catch (e) {
			// ignore
		}
		return () => {
			try {
				const el = parent.document.getElementById("lc-journal-tooltip-root") as HTMLDivElement | null;
				if (el) el.remove();
			} catch (e) {}
		};
	}, [hoverPage, hoverHtml, tooltipPos]);

	const days = useMemo(() => offsets.map((o) => (o === 0 ? startDate : addDays(startDate, o))), [startDate, JSON.stringify(offsets)]);

	const onScrollClick = useCallback(
		(delta: number) => {
			if (!onRequestScroll) return;
			onRequestScroll(delta);
		},
		[onRequestScroll]
	);

	const dateInputRef = useRef<HTMLInputElement | null>(null);

	const onCellClickFactory = useCallback(
		(pageName?: string) => (e: React.MouseEvent) => {
			if (pageName) openPageFromPageName(pageName, (e as any).shiftKey);
		},
		[]
	);

	const buildCellHoverPayload = useCallback(
		(u: ReturnType<typeof getUserColorData> | undefined, holiday: string, icsEvents: IcsEvent[], pageName: string) => {
			if ((u && u.eventName) || holiday || icsEvents.length > 0) {
				const extraLines: string[] = [];
				if (u && u.eventName) {
					extraLines.push(
						...u.eventName
							.split("\n")
							.map((s) => s.trim())
							.filter(Boolean)
						);
				}
				if (holiday) {
					extraLines.push(
						...holiday
							.split("\n")
							.map((s) => s.trim())
							.filter(Boolean)
						);
				}
				if (icsEvents.length > 0) {
					extraLines.push(
						...icsEvents
							.map((ev) => (ev.isTodo ? `TODO: ${ev.summary}` : ev.summary))
							.map((s) => String(s || "").trim())
							.filter(Boolean)
						);
				}
				const marker = "__HOL__::";
				return marker + encodeURIComponent(extraLines.join("\n") || "") + "|||" + (pageName || "");
			}
			return pageName;
		},
		[]
	);

	const createCellMouseEnter = useCallback(
		(u: ReturnType<typeof getUserColorData> | undefined, holiday: string, icsEvents: IcsEvent[], pageName: string) => {
			return (e: React.MouseEvent) => {
				const rect = (e.target as HTMLElement).getBoundingClientRect();
				setTooltipPos({ left: rect.right + 8, top: rect.top });
				const payload = buildCellHoverPayload(u, holiday, icsEvents, pageName);
				setHoverPage(payload);
			};
		},
		[buildCellHoverPayload]
	);

	const createCellMouseMove = useCallback((e: React.MouseEvent) => {
		setTooltipPos({ left: (e as React.MouseEvent).clientX + 12, top: (e as React.MouseEvent).clientY + 8 });
	}, []);

	const createCellMouseLeave = useCallback(() => {
		setHoverPage(undefined);
	}, []);

	const handleMonthClick = useCallback(
		(monthPageName: string) => (e: React.MouseEvent) => {
			openPageFromPageName(monthPageName, (e as any).shiftKey);
		},
		[]
	);

	const handleTodayClick = useCallback(async (e: React.MouseEvent) => {
		const desiredDate: Date = new Date();
		if (onRequestScroll) {
			const weekStartsOn: 0 | 1 | 6 = getWeekStartOn();
			const useISO = weekStartsOn === 1 && (logseq.settings as any)?.weekNumberFormat === "ISO(EU) format";
			const desiredStart = useISO ? startOfISOWeek(desiredDate) : startOfWeek(desiredDate, { weekStartsOn });
			const s = new Date(startDate);
			s.setHours(0, 0, 0, 0);
			const sStart = useISO ? startOfISOWeek(s) : startOfWeek(s, { weekStartsOn });
			const diffMs = desiredStart.getTime() - sStart.getTime();
			const deltaWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
			onRequestScroll(deltaWeeks);
		} else {
			openPageFromPageName(format(new Date(), preferredDateFormat), (e as any).shiftKey);
		}
	}, [onRequestScroll, preferredDateFormat, startDate]);

	return (
		<div
			className="two-line-calendar-root"
			style={{ padding: "6px", position: "relative" }}>
			<table
				className="two-line-calendar-table"
				style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
				<tbody>
					{/* Row 1 */}
					<tr>
						{/* Leftmost column: may show week number (row1/row3) and short month (row2) depending on settings */}
						<td style={{ width: "auto", verticalAlign: "middle" }}>
							{(() => {
								const wkDate = days[0];
								const { year, weekString, quarter } = getWeeklyNumberFromDate(wkDate, (logseq.settings as any)?.weekNumberFormat === "US format" ? 0 : 1);
								const weekNumLabel = `W${weekString}`;
								const weekPageName = getWeeklyNumberString(year, weekString, quarter);
								const weekElementStyle: React.CSSProperties = { fontSize: "0.85em", padding: "4px 6px" };
								return (logseq.settings as any).booleanWeeklyJournal === true ? (
									<button
										className="daySide daySideWeekNumber"
										onClick={(e) => openPageFromPageName(weekPageName, (e as any).shiftKey)}
										onMouseEnter={(e) => {
											if (weekPageName) {
												setHoverPage(weekPageName);
												const rect = (e.target as HTMLElement).getBoundingClientRect();
												setTooltipPos({ left: rect.right + 8, top: rect.top });
											}
										}}
										onMouseMove={(e) => setTooltipPos({ left: (e as React.MouseEvent).clientX + 12, top: (e as React.MouseEvent).clientY + 8 })}
										onMouseLeave={() => setHoverPage(undefined)}
										style={{ ...weekElementStyle, cursor: "pointer", background: "none", border: "none" }}>
										{weekNumLabel}
									</button>
								) : (
									<span
										className="daySide daySideWeekNumber"
										style={{ ...weekElementStyle }}>
										{weekNumLabel}
									</span>
								);
							})()}
						</td>

						{days.slice(0, 7).map((d) => {
							const pageName = format(d, preferredDateFormat);
							const holiday = pageName ? holidayMap[pageName] || "" : "";
							const icsKeyForCell = format(d, "yyyy-LL-dd");
							const icsEventsForCell = icsMap[icsKeyForCell] || [];
							const u = getUserColorData(d);

							return (
								<DayCell
									key={d.toISOString()}
									date={d}
									pageName={pageName}
									holiday={holiday}
									icsEvents={icsEventsForCell}
									pageExists={pageName ? pageExistsMap[pageName] : false}
									onClick={onCellClickFactory(pageName)}
									onMouseEnter={createCellMouseEnter(u, holiday, icsEventsForCell, pageName)}
									onMouseMove={createCellMouseMove}
									onMouseLeave={createCellMouseLeave}
								/>
							);
						})}

						<td style={{ width: 32, verticalAlign: "middle", textAlign: "center" }}>
							<button
								title={t("Previous week")}
								onClick={() => onScrollClick(-1)}
								style={{ border: "none", background: "transparent", cursor: "pointer" }}>
								↑
							</button>
						</td>
					</tr>

					{/* Row 2: weekday labels */}
					<tr>
						{/* second row: leftmost cell used to display short month name when enabled */}
						<td style={{ verticalAlign: "middle", textAlign: "center", fontSize: "0.9em", padding: "4px" }}>
							{(() => {
								// determine month label: if both displayed two-week rows share the same month,
								// show the localized short month name; otherwise show numeric range like "11--12".
								const monthLabel = (() => {
									const firstMonth = days[0].getMonth() + 1;
									const secondMonth = days[7] ? days[7].getMonth() + 1 : firstMonth;
									if (firstMonth === secondMonth) return localizeMonthString(days[0], false);
									return `${String(firstMonth).padStart(2, "0")}-${String(secondMonth).padStart(2, "0")}`;
								})();
								// build month page name like `yyyy/MM` or `yyyy-MM` depending on separator (use first displayed day)
								const monthPageName = format(days[0], `yyyy${separate()}MM`);
								if (monthPageName.length === 7) {
									return (
										<button
											className="daySide"
											onClick={handleMonthClick(monthPageName)}
											onMouseEnter={(e) => {
												if (monthPageName) {
													setHoverPage(monthPageName);
													const rect = (e.target as HTMLElement).getBoundingClientRect();
													setTooltipPos({ left: rect.right + 8, top: rect.top });
												}
											}}
											onMouseMove={(e) => setTooltipPos({ left: (e as React.MouseEvent).clientX + 12, top: (e as React.MouseEvent).clientY + 8 })}
											onMouseLeave={() => setHoverPage(undefined)}
											style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "0.95em" }}>
											{monthLabel}
										</button>
									);
								}
								return (
									<span
										className="daySide"
										title={monthLabel}>
										{monthLabel}
									</span>
								);
							})()}
						</td>
						{days.slice(0, 7).map((d) => {
							const dayIdx = d.getDay();
							const headerColor = getWeekendColor(shortDayNames[dayIdx]);
							return (
								<td
									key={d.toISOString()}
									style={{ textAlign: "center", fontSize: "0.75em", color: headerColor || "var(--ls-ui-fg-muted)", padding: "4px 2px" }}>
									{localizeDayOfWeekString(d, false)}
								</td>
							);
						})}
						<td style={{ width: 32, verticalAlign: "middle", textAlign: "center" }}>
							<button
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									if (!dateInputRef.current) return;
									try {
										(dateInputRef.current as any).showPicker?.();
									} catch (err) {
										// ignore
									}
									if (!(dateInputRef.current as any).showPicker) dateInputRef.current.click();
								}}
								style={{ border: "none", background: "transparent", cursor: "pointer" }}>
								{"📅"}
							</button>
							{/* hidden native date input for yyyy-mm-dd selection */}
							<input
								ref={dateInputRef}
								type="date"
								value={format(startDate, "yyyy-MM-dd")}
								onClick={(e) => e.stopPropagation()}
								onChange={(e) => {
									const v = (e.target as HTMLInputElement).value;
									if (!v) return;
									const chosen = new Date(v);
									if (onRequestScroll) {
										const weekStartsOn: 0 | 1 | 6 = getWeekStartOn();
										const useISO = weekStartsOn === 1 && (logseq.settings as any)?.weekNumberFormat === "ISO(EU) format";
										const desiredStart = useISO ? startOfISOWeek(chosen) : startOfWeek(chosen, { weekStartsOn });
										const s = new Date(startDate);
										s.setHours(0, 0, 0, 0);
										const sStart = useISO ? startOfISOWeek(s) : startOfWeek(s, { weekStartsOn });
										const diffMs = desiredStart.getTime() - sStart.getTime();
										const deltaWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
										onRequestScroll(deltaWeeks);
									} else {
										openPageFromPageName(format(chosen, preferredDateFormat), (e as any).shiftKey);
									}
								}}
								style={{ display: "none" }}
							/>
						</td>
					</tr>

					{/* Row 3 */}
					<tr>
						<td style={{ verticalAlign: "middle" }}>
							{(() => {
								const wkDate = days[7];
								const { year, weekString, quarter } = getWeeklyNumberFromDate(wkDate, (logseq.settings as any)?.weekNumberFormat === "US format" ? 0 : 1);
								const weekNumLabel = `W${weekString}`;
								const weekPageName = getWeeklyNumberString(year, weekString, quarter);
								const weekElementStyle: React.CSSProperties = { fontSize: "0.85em", padding: "4px 6px" };
								return (logseq.settings as any).booleanWeeklyJournal === true ? (
									<button
										className="daySide daySideWeekNumber"
										onClick={(e) => openPageFromPageName(weekPageName, (e as any).shiftKey)}
										onMouseEnter={(e) => {
											if (weekPageName) {
												setHoverPage(weekPageName);
												const rect = (e.target as HTMLElement).getBoundingClientRect();
												setTooltipPos({ left: rect.right + 8, top: rect.top });
											}
										}}
										onMouseMove={(e) => setTooltipPos({ left: (e as React.MouseEvent).clientX + 12, top: (e as React.MouseEvent).clientY + 8 })}
										onMouseLeave={() => setHoverPage(undefined)}
										style={{ ...weekElementStyle, cursor: "pointer", background: "none", border: "none" }}>
										{weekNumLabel}
									</button>
								) : (
									<span
										className="daySide daySideWeekNumber"
										style={{ ...weekElementStyle }}>
										{weekNumLabel}
									</span>
								);
							})()}
						</td>

						{days.slice(7, 14).map((d) => {
							const pageName = format(d, preferredDateFormat);
							const holiday = pageName ? holidayMap[pageName] || "" : "";
							const icsKeyForCell = format(d, "yyyy-LL-dd");
							const icsEventsForCell = icsMap[icsKeyForCell] || [];
							const u = getUserColorData(d);

							return (
								<DayCell
									key={d.toISOString()}
									date={d}
									pageName={pageName}
									holiday={holiday}
									icsEvents={icsEventsForCell}
									pageExists={pageName ? pageExistsMap[pageName] : false}
									onClick={onCellClickFactory(pageName)}
									onMouseEnter={createCellMouseEnter(u, holiday, icsEventsForCell, pageName)}
									onMouseMove={createCellMouseMove}
									onMouseLeave={createCellMouseLeave}
								/>
							);
						})}

						<td style={{ width: 32, verticalAlign: "middle", textAlign: "center" }}>
							<button
								title={t("Next week")}
								onClick={() => onScrollClick(1)}
								style={{ border: "none", background: "transparent", cursor: "pointer" }}>
								↓
							</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
};

export default TwoLineCalendar;
