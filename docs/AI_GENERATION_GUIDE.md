# AI Generation Documentation Guide — Show weekday and week-number 🧭

## Overview ✅
This document outlines the specifications and templates for using AI (chatbots or code generation tools) to automatically generate or assist with documentation, translations, tests, refactoring suggestions, code summaries, and more for this plugin.

---

## Table of Contents
1. Purpose and Use Cases
2. Development and Build Information (Commands)
3. Architecture and Key Files
4. Settings (SettingKeys) and Configuration Templates
5. Translation (l10n) Support
6. Public APIs and Exported Functions (Overview)
7. Recommended AI Prompts (Templates)
8. Examples (README, CHANGELOG, Translations, Tests)
9. Notes and Best Practices

---

## 1) Purpose and Use Cases 💡
- Automatically generate or improve README and documentation
- Assist with multilingual translation (i18n) for untranslated keys
- Generate descriptions and type annotations for public APIs
- Sketch unit tests and integration tests
- Detect refactoring opportunities and suggest code fixes

---

## 2) Development and Build Information 🔧
- Entry Point (Logseq manifest): `logseq.main` in `package.json` → `./dist/index.html`
- Development Server:
  - `pnpm dev` (internally uses `vite`)
- Build:
  - `pnpm build` (development mode) / `pnpm prod` (production mode)
- Dependencies: `@logseq/libs`, `react`, `date-fns`, `date-holidays`, `logseq-l10n`, etc.

---

## 3) Architecture and Key Files 🗂️
- Root
  - `index.html`, `package.json`, `vite.config.ts`, `tsconfig.json`
- src/
  - `index.ts` — Plugin entry point. Executes `logseq.ready(main)` to initialize settings, load L10N, register event handlers, inject CSS, etc.
  - `dailyJournalDetails.ts` — Logic for displaying weekday, week number, relative time, etc., next to daily journal titles, along with a DOM observer.
  - `fetchJournalTitles.ts` — Utility for scanning and processing journal titles in page headers.
  - `lib/` — General utilities: week number calculations, date localization, DOM utilities, ICS synchronization, etc.
  - `calendar/` — Implementation of Journal Boundaries and Left Calendar (using React components).
  - `components/` — React components (`TwoLineCalendar`, `MonthlyCalendar`, `JournalPreview`, etc.).
  - `components/DayCell.tsx` — **New**: Common UI for day cells (click, hover, styles, accessibility).
  - `hooks/useCalendarData.ts` — **New**: Hook to fetch page existence, holidays, and user colors collectively (async).
  - `hooks/useIcsEvents.ts` — **New**: Hook to load ICS events within a range and return a date map.
  - `hooks/useWeeklyPages.ts` — **New**: Hook to check weekly page existence (week number → page name existence).
  - `journals/` — Weekly/Monthly/Quarterly/Yearly journal generation and navigation.
  - `settings/` — `SettingKeys`, configuration templates for each section (`settingsTemplate`).
  - `translations/` — Language JSON files, loaded via `l10nSetup.ts`.
  - `shortcutItems.ts` — Slash command registration (e.g., insert week number).

---

## 4) Settings (SettingKeys) and Configuration Templates ⚙️
- All setting keys are listed in `src/settings/SettingKeys.ts` (e.g., `booleanWeekNumber`, `weekNumberFormat`, `holidaysCountry`, ...).
- Each settings section is structured in `src/settings/*Settings.ts` (`commonSettings`, `dailyJournalSettings`, `leftCalendarSettings`, `weeklyJournalSettings`, ...), and combined using `settingsTemplate`.

**Note**: When generating explanations with AI, refer to the type (boolean/string/choice) of each key, along with default values and descriptions (from `translations/*.json`) to improve accuracy.

---

## 5) Translation (l10n) Support 🌐
- Supported languages (based on JSON files in `src/translations/`):
  - `ja`, `en` are defaults (English source text exists in README, etc.)
  - Others: `af`, `de`, `es`, `fr`, `id`, `it`, `ko`, `nb-NO`, `nl`, `pl`, `pt-BR`, `pt-PT`, `ru`, `sk`, `tr`, `uk`, `zh-CN`, `zh-Hant`
- `src/translations/l10nSetup.ts` loads only the relevant file based on the user’s Logseq language setting.
- When generating translations with AI, ensure consistency in tone (formal/informal) by referencing existing translations.

---

## 6) Public APIs and Exported Functions (Excerpt) 📦
(Important for AI-generated documentation or comments)
- Basic Settings Retrieval:
  - `getConfigPreferredLanguage(): Promise<string>`
  - `getConfigPreferredDateFormat(): Promise<string>`
  - `getUserConfig(notFirst?: boolean)`
- DOM / UI Helpers:
  - `showConfirmDialog(title, text, opts?)`: Custom dialog
  - `createSettingButton()` / `createLinkMonthlyLink()`
  - `createElementWithClass(tag, ...classes)` / `addEventListenerOnce()`
- Date / Week Number Processing:
  - `getWeeklyNumberFromDate(date, weekStartsOn)`
  - `getWeeklyNumberString(year, weekString, quarter)`
  - `getWeekStartOn()`
  - `enableWeekNumber(journalDate, weekStartsOn)` (for daily display)
  - `enableRelativeTime(journalDate)`
- Calendar / Holidays:
  - `getHolidaysBundle(userLanguage)` (`src/lib/holidays.ts`)
  - `exportHolidaysBundle()`
- Journal Operations:
  - `openPageFromPageName(pageName, shiftKey)` — Prompts confirmation → creates page if it doesn’t exist (note DB graph constraints).
- Others: `removeBoundaries`, `weeklyEmbed` (provides styles), etc.

---

## 7) Recommended AI Prompts (Templates) 🤖
Use the following templates to efficiently generate documentation or code with AI.

### A. Update README
```
You are an expert technical writer. Based on the following file list and brief descriptions, generate an expanded README section for "Journal Boundaries" including usage steps, examples, and a short FAQ. Files: [list files]. Requirements: keep concise headings, include code snippets for settings, and Japanese translation suggestions.
```

### B. Generate Translation Files
```
Generate a Japanese translation for the following English keys, keeping tone consistent with existing `ja.json`. Provide only the JSON object of key-value pairs. Existing ja.json includes phrasing samples: [...].
```

### C. Suggest Test Cases
```
Write unit test stubs (jest) for function `getWeeklyNumberFromDate` covering ISO vs US formats, invalid date inputs, and edge cases around year boundaries. Include test names and mock data.
```

### D. Generate Code Documentation
```
Generate TypeDoc-style comments for `src/lib/lib.ts` focusing on `getWeeklyNumberFromDate`, `getWeeklyNumberString`, and `getWeekStartOn`. Keep comments short and include param/return descriptions.
```

### E. Generate Refactoring Documentation
```
You refactored calendar rendering by extracting common UI and data logic. Generate a short release note and a developer-facing summary (2-3 bullets) describing:
- New files added: `components/DayCell.tsx`, `hooks/useCalendarData.ts`, `hooks/useIcsEvents.ts`, `hooks/useWeeklyPages.ts`.
- What responsibilities moved into hooks (page existence, holidays, user color, ICS events, weekly page checks).
- Guidance for future contributors (where to add visual style changes, how to test DayCell and hooks).
Return only the Markdown content for insertion into `CHANGELOG.md` and `docs/AI_GENERATION_GUIDE.md`.
```

---

## 8) Examples (Short Templates) ✍️
- Example README sections (English/Japanese)
- Translation suggestions for untranslated keys in ja.json
- Jest test sketches
- CHANGELOG auto-generation templates (release notes)

---

## 9) Notes and Best Practices ⚠️
- Always include differences in behavior between Logseq’s DB graph and file-based graph (e.g., page names with slashes may or may not be creatable).
- `logseq.settings` only exists at runtime, so mock it during tests.
- When generating i18n content, ensure UI text is concise and descriptions are formal. Adjust prompts accordingly.

---
