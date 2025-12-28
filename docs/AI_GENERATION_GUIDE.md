# AI生成向けドキュメントガイド — Show weekday and week-number 🧭

## 概要 ✅
このドキュメントは、AI（チャットボットやコード生成ツール）を用いて本プラグインのドキュメント、翻訳、テスト、リファクタ提案、コードサマリなどを自動生成・補助するための仕様とテンプレートをまとめたものです。

---

## 目次
1. 目的と想定ユースケース
2. 開発・ビルド情報（コマンド）
3. アーキテクチャと主要ファイル一覧
4. 設定（SettingKeys）と設定テンプレートの構成
5. 翻訳（l10n）サポート一覧
6. 公開API・エクスポート関数一覧（概要）
7. 推奨AIプロンプト（生成テンプレート）
8. 生成例（README・CHANGELOG・翻訳・テスト）
9. 注意点・ベストプラクティス

---

## 1) 目的と想定ユースケース 💡
- README やドキュメントの自動生成・改善
- 多言語翻訳の補完（i18n の未翻訳キーを自動案出）
- 公開APIの説明文や型注釈の生成
- ユニットテスト・統合テストのスケッチ生成
- リファクタリング候補の検出とコード修正提案

---

## 2) 開発・ビルド情報 🔧
- エントリ（Logseq manifest）: `package.json` の `logseq.main` → `./dist/index.html`
- 開発サーバ:
  - `pnpm dev` (内部: `vite`)
- ビルド:
  - `pnpm build` (開発モード) / `pnpm prod` (プロダクション)
- 依存: `@logseq/libs`, `react`, `date-fns`, `date-holidays`, `logseq-l10n` など

---

## 3) アーキテクチャと主要ファイル一覧 🗂️
- ルート
  - `index.html`, `package.json`, `vite.config.ts`, `tsconfig.json`
- src/
  - `index.ts` — プラグインのエントリ。`logseq.ready(main)` を実行し、設定の初期化、L10N読み込み、イベントハンドラ登録、CSS注入等を行う。
  - `dailyJournalDetails.ts` — 日次ジャーナルタイトル横の表示ロジック（曜日・週番号・相対時間等）と DOM オブザーバ。
  - `fetchJournalTitles.ts` — ページヘッダー上のジャーナルタイトルを走査して処理するユーティリティ。
  - `lib/` — 汎用ユーティリティ。週番号計算、日付ローカライズ、DOMユーティリティ、ICS同期等。
  - `calendar/` — Journal Boundaries と Left Calendar の実装（React コンポーネントを利用）。
  - `components/` — React コンポーネント（`TwoLineCalendar`, `MonthlyCalendar`, `JournalPreview` 等）。
  - `components/DayCell.tsx` — **新規**: 日セルの共通 UI（クリック、hover、スタイル、アクセシビリティ）。
  - `hooks/useCalendarData.ts` — **新規**: ページ存在・祝日・ユーザ色をまとめて取得するフック（非同期）。
  - `hooks/useIcsEvents.ts` — **新規**: ICS イベントを範囲内で読込・日付マップを返すフック。
  - `hooks/useWeeklyPages.ts` — **新規**: 週ページ存在チェックを提供するフック（週番号 → ページ名の存在確認）。
  - `journals/` — Weekly/Monthly/Quarterly/Yearly ジャーナルの生成・ナビゲーション。
  - `settings/` — `SettingKeys`, 各セクションの設定テンプレート `settingsTemplate`。
  - `translations/` — 言語 JSON、`l10nSetup.ts` による読み込み。
  - `shortcutItems.ts` — Slash コマンド登録（週番号挿入など）。

---

## 4) 設定（SettingKeys）と設定テンプレート ⚙️
- 全設定キーは `src/settings/SettingKeys.ts` に列挙されています（例: `booleanWeekNumber`, `weekNumberFormat`, `holidaysCountry`, ...）。
- 各設定セクションは `src/settings/*Settings.ts`（`commonSettings`, `dailyJournalSettings`, `leftCalendarSettings`, `weeklyJournalSettings`, ...）で構成され、`settingsTemplate` で合成されます。

**注意**: AI による説明生成では、各キーの型（boolean/string/選択肢）と既定値や説明文（`translations/*.json`）を参照してまとめると精度が上がります。

---

## 5) 翻訳（l10n）サポート 🌐
- サポート言語（`src/translations/` にある JSON をベース）:
  - `ja`, `en` 相当はデフォルト（英語原文は README 等に存在）
  - 他: `af`, `de`, `es`, `fr`, `id`, `it`, `ko`, `nb-NO`, `nl`, `pl`, `pt-BR`, `pt-PT`, `ru`, `sk`, `tr`, `uk`, `zh-CN`, `zh-Hant`
- `src/translations/l10nSetup.ts` は Logseq のユーザー設定言語に基づいて該当ファイルのみを読み込みます。
- AI による翻訳生成を行う際は、同一キーの既存訳を参照しつつ文体の一貫性（敬体/常体）を保つよう指示してください。

---

## 6) 公開API・エクスポート関数（抜粋）📦
（AI がドキュメントや説明コメントを生成する時に重要）
- 基本設定取得:
  - `getConfigPreferredLanguage(): Promise<string>`
  - `getConfigPreferredDateFormat(): Promise<string>`
  - `getUserConfig(notFirst?: boolean)`
- DOM / UI ヘルパ:
  - `showConfirmDialog(title, text, opts?)`: カスタムダイアログ
  - `createSettingButton()` / `createLinkMonthlyLink()`
  - `createElementWithClass(tag, ...classes)` / `addEventListenerOnce()`
- 日付 / 週番号処理:
  - `getWeeklyNumberFromDate(date, weekStartsOn)`
  - `getWeeklyNumberString(year, weekString, quarter)`
  - `getWeekStartOn()`
  - `enableWeekNumber(journalDate, weekStartsOn)` (日次表示用)
  - `enableRelativeTime(journalDate)`
- カレンダー／ホリデー:
  - `getHolidaysBundle(userLanguage)` (`src/lib/holidays.ts`)
  - `exportHolidaysBundle()`
- ジャーナル操作:
  - `openPageFromPageName(pageName, shiftKey)` — 存在しない場合は確認ダイアログ→作成（DBグラフでの制約に注意）
- その他: `removeBoundaries`, `weeklyEmbed` (style 提供) 等

---

## 7) 推奨AIプロンプト（テンプレート）🤖
以下のテンプレートを使ってAIにタスクを投げると効率的にドキュメントやコードを生成できます。

### A. README を更新する
```
You are an expert technical writer. Based on the following file list and brief descriptions, generate an expanded README section for "Journal Boundaries" including usage steps, examples, and a short FAQ. Files: [list files]. Requirements: keep concise headings, include code snippets for settings, and Japanese translation suggestions.
```

### B. 翻訳ファイルを生成
```
Generate a Japanese translation for the following English keys, keeping tone consistent with existing `ja.json`. Provide only the JSON object of key-value pairs. Existing ja.json includes phrasing samples: [...].
```

### C. テストケースを提案
```
Write unit test stubs (jest) for function `getWeeklyNumberFromDate` covering ISO vs US formats, invalid date inputs, and edge cases around year boundaries. Include test names and mock data.
```

### D. コードドキュメント生成
```
Generate TypeDoc-style comments for `src/lib/lib.ts` focusing on `getWeeklyNumberFromDate`, `getWeeklyNumberString`, and `getWeekStartOn`. Keep comments short and include param/return descriptions.
```

### E. リファクタのドキュメント生成
```
You refactored calendar rendering by extracting common UI and data logic. Generate a short release note and a developer-facing summary (2-3 bullets) describing:
- New files added: `components/DayCell.tsx`, `hooks/useCalendarData.ts`, `hooks/useIcsEvents.ts`, `hooks/useWeeklyPages.ts`.
- What responsibilities moved into hooks (page existence, holidays, user color, ICS events, weekly page checks).
- Guidance for future contributors (where to add visual style changes, how to test DayCell and hooks).
Return only the Markdown content for insertion into `CHANGELOG.md` and `docs/AI_GENERATION_GUIDE.md`.
```

---

## 8) 生成例（短いテンプレ）✍️
- README の節の例（英語/日本語）
- ja.json の未翻訳キーに対する訳語候補
- `jest` のテストスケッチ
- `CHANGELOG` の自動生成用テンプレート（リリースノート）

---

## 9) 注意点・ベストプラクティス ⚠️
- Logseq の DB グラフとファイルベースグラフで挙動が異なる点（スラッシュを含むページ名の作成可否など）を必ずAI生成物に含める。
- `logseq.settings` はランタイムでのみ存在するため、テストではモックすること。
- i18n の文脈（UI 文言は短く、説明文は丁寧に）を保つようにプロンプトを工夫する。

---
