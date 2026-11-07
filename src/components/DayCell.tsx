import { isToday } from "date-fns";
import React from "react";
import { IcsEvent } from "../lib";
import { computeCellBackground, UserColorInfo } from "../lib/calendarUtils";
import { getUserColorData, getWeekendColor, shortDayNames } from "../lib";

type DayCellProps = {
	date: Date;
	pageName: string;
	holiday: string;
	icsEvents: IcsEvent[];
	pageExists: boolean;
	onClick: (e: React.MouseEvent) => void;
	onMouseEnter: (e: React.MouseEvent) => void;
	onMouseMove: (e: React.MouseEvent) => void;
	onMouseLeave: () => void;
};

const DayCell: React.FC<DayCellProps> = ({
	date,
	pageName,
	holiday,
	icsEvents,
	pageExists,
	onClick,
	onMouseEnter,
	onMouseMove,
	onMouseLeave,
}) => {
	const d = date;
	const checkIsToday = isToday(d);
	const cellStyle: React.CSSProperties = {
		border: "1px solid rgba(0,0,0,0.06)",
		padding: "6px 4px",
		whiteSpace: "nowrap",
		cursor: pageName ? "pointer" : "default",
		textAlign: "center",
	};
	if (checkIsToday) {
		cellStyle.border = `2px solid ${(logseq.settings as any).boundariesHighlightColorToday}`;
		cellStyle.borderRadius = "50%";
	}

	const u = getUserColorData(d);
	const bgInfo = computeCellBackground(
		u as UserColorInfo | undefined,
		holiday,
		(logseq.settings as any).booleanBoundariesHolidays === true,
		(logseq.settings as any).choiceHolidaysColor as string | undefined,
		(logseq.settings as any).choiceUserColor as string | undefined,
		icsEvents.length > 0
	);
	if (bgInfo.backgroundColor) cellStyle.backgroundColor = bgInfo.backgroundColor;
	if (bgInfo.fontWeight) cellStyle.fontWeight = bgInfo.fontWeight as any;

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
	if (icsEvents.length > 0)
		titleParts.push(
			...icsEvents
				.map((ev) => (ev.isTodo ? `TODO: ${ev.summary}` : ev.summary))
				.map((s) => String(s || "").trim())
				.filter(Boolean)
		);
	if (pageName) titleParts.push(pageName);

	const dayNumberInlineStyle: React.CSSProperties = {};
	if (pageName && pageExists) {
		dayNumberInlineStyle.textDecoration = "underline";
	}
	if (u && u.color) {
		dayNumberInlineStyle.color = u.color;
		dayNumberInlineStyle.fontWeight = (u.fontWeight as any) || dayNumberInlineStyle.fontWeight;
	} else if ((logseq.settings as any)?.booleanWeekendsColor === true) {
		const wk = getWeekendColor(shortDayNames[d.getDay()]);
		if (wk) dayNumberInlineStyle.color = wk;
	}

	return (
		<td
			key={d.toISOString()}
			onClick={onClick}
			className={`${pageName ? "cursor" : ""} lc-day-cell`}
			aria-label={titleParts.length > 0 ? titleParts.join("\n") : pageName}
			onMouseEnter={onMouseEnter}
			onMouseMove={onMouseMove}
			onMouseLeave={onMouseLeave}
			style={cellStyle}>
			<span
				className="lc-day-number"
				style={dayNumberInlineStyle}>
				{d.getDate()}
			</span>
		</td>
	);
};

export default DayCell;
