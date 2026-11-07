import { addDays, format } from "date-fns";
import { useEffect, useState } from "react";
import { getConfigPreferredDateFormat, getConfigPreferredLanguage } from "..";
import { getHolidaysBundle, IcsEvent, loadIcsOnce, getIcsEventsForDate } from "../lib";
import { getHolidays } from "../lib/holidays";
import { findPageUuid } from "../lib/query/advancedQuery";

export interface CalendarDataResult {
	preferredDateFormat: string;
	pageExistsMap: Record<string, boolean>;
	holidayMap: Record<string, string>;
	icsMap: Record<string, IcsEvent[]>;
}

export function useCalendarData(startDate: Date, offsets: number[]): CalendarDataResult {
	const [preferredDateFormat, setPreferredDateFormat] = useState<string>("yyyy/MM/dd");
	const [pageExistsMap, setPageExistsMap] = useState<Record<string, boolean>>({});
	const [holidayMap, setHolidayMap] = useState<Record<string, string>>({});
	const [icsMap, setIcsMap] = useState<Record<string, IcsEvent[]>>({});

	useEffect(() => {
		const run = async () => {
			const fmt = await getConfigPreferredDateFormat();
			// Ensure holiday bundle exists before computing holidays
			try {
				const lang = await getConfigPreferredLanguage();
				await getHolidaysBundle(lang, { already: true });
			} catch {
				// ignore
			}
			setPreferredDateFormat(fmt);
			const pMap: Record<string, boolean> = {};
			const hMap: Record<string, string> = {};
			const iMap: Record<string, IcsEvent[]> = {};

			// Load ICS once (cached) and map events for displayed dates
			try {
				const raw = ((logseq.settings as any)?.lcIcsUrls as string) || "";
				const urls = String(raw || "")
					.split(/\r?\n/)
					.map((s) => s.trim())
					.filter(Boolean);
				if (urls.length > 0) {
					await loadIcsOnce(urls);
				}
			} catch {
				// ignore
			}

			for (const offset of offsets) {
				const d = offset === 0 ? startDate : addDays(startDate, offset);
				const pageName = format(d, fmt);
				if (pageName) {
					try {
						pMap[pageName] = Boolean(await findPageUuid(pageName));
					} catch {
						pMap[pageName] = false;
					}
					try {
						hMap[pageName] = await getHolidays(d);
					} catch {
						hMap[pageName] = "";
					}
				}
				try {
					const key = format(d, "yyyy-LL-dd");
					iMap[key] = getIcsEventsForDate(d);
				} catch {
					// ignore
				}
			}
			setPageExistsMap(pMap);
			setHolidayMap(hMap);
			setIcsMap(iMap);
		};
		run();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [startDate, JSON.stringify(offsets)]);

	return { preferredDateFormat, pageExistsMap, holidayMap, icsMap };
}
