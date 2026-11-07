---
sessionId: session-261107-152950-e5el
---

# Overview

### 目的
前回のレビューで特定された改善項目を、難易度と優先度に応じて段階的に実施するロードマップを作成します。各フェーズは独立して完了可能であり、累積的にプロジェクトの保守性を向上させます。

### 目標
- コードの肥大化を解消（`lib.ts`と`TwoLineCalendar.tsx`）
- テストカバレッジを確保（日付計算ロジック）
- ドキュメントと実装の乖離を解消
- 技術的負債を整理

### スコープ
**対象**: 
- コードリファクタリング（`lib.ts`分割、`TwoLineCalendar.tsx`重複削除）
- 新機能追加（`hooks/`実装、ユニットテスト）
- ドキュメント更新（`AI_GENERATION_GUIDE.md`、`CHANGELOG.md`）

**対象外**:
- 新機能の追加（既存機能のリファクタリングのみ）
- UI/UXの変更（動作は維持）
- 依存関係のメジャーアップデート

# Side Effects Analysis

各フェーズの副作用リスクを再検証し、以下の対策を明確化しました。

### フェーズ1: TwoLineCalendarの重複コード削除
**副作用リスク**: 🟡 中

**特定されたリスク**:
1. **Row 1の`</td>`欠落バグ**: Row 1のセル描画（237-360行）では閉じタグ`</td>`が欠落している（358行で`</span>`のみ）。Row 3（506-628行）では正しく`</td>`が存在（626行）。DayCell抽出時にこのバグを修正すると、Row 1のセル表示が変化する可能性がある。
2. **未使用変数`: `isOtherMonth`が宣言されているが使用されていない（243行、512行）。削除は安全。
3. **Tooltip状態の共有**: `setHoverPage`と`setTooltipPos`はコンポーネントレベルで管理。DayCellに移動すると状態管理が変更される。

**対策**:
- DayCellコンポーネントは`<td>`要素を返すように設計し、Row 1のバグを**同時に修正**（意図的な変更としてドキュメント化）。
- Tooltip状態は親コンポーネント（TwoLineCalendar）で保持し、DayCellには`onMouseEnter`、`onMouseLeave`コールバックをPropsとして渡す。
- `isOtherMonth`変数は削除。

### フェーズ2: lib.tsのモジュール分割
**副作用リスク**: 🟢 低

**特定されたリスク**:
1. **循環参照**: `showConfirmDialog`は`openPageFromPageName`から呼び出される（345行）。`openPageFromPageName`は`booleanDbGraph`、`parseWeeklyPageName`、`findDbWeeklyPageUuid`に依存。
2. **`colorMap`の共有**: `getWeekendColor`と`resolveColorChoice`の両方で使用（161-165行）。
3. **`logseq.settings!`非nullアサーション**: 各関数で頻繁に使用。分割後も維持されるが、型安全性は改善されない。
4. **インポートパスの変更**: バレルファイル`src/lib/index.ts`が`export * from './lib'`で一括エクスポート。分割後は個々のファイルをエクスポートする必要がある。

**対策**:
- `showConfirmDialog`と`openPageFromPageName`を**同じファイル**（`page_operations.ts`）に配置し、循環参照を回避。
- `colorMap`、`resolveColorChoice`、`toTranslucent`、`getWeekendColor`を`color_utils.ts`に分離。`colorMap`は`export const`としてエクスポートし、他のモジュールからインポート可能に。
- バレルファイル`src/lib/index.ts`を以下のように更新:
  ```typescript
  export * from './lib'
  export * from './dialog'
  export * from './page_operations'
  export * from './dom_helpers'
  export * from './color_utils'
  ```
- **既存のインポートは変更しない**: バレルファイル経由のインポート（`from '../lib'`）はそのまま動作。直接インポート（`from '../lib/lib'`）は`JournalPreview.tsx`で1箇所のみ（3行）。

### フェーズ3: hooksディレクトリの実装
**副作用リスク**: 🔴 高

**特定されたリスク**:
1. **状態管理の変更**: `TwoLineCalendar.tsx`の`useEffect`（91-148行）は`startDate`、`offsets`、`logseq.settings`に依存。これをフック化すると、`TwoLineCalendar`のPropsと状態管理が変更される。
2. **レンダリングトリガー**: `icsMap`、`holidayMap`、`pageExistsMap`の3つの状態がフックに移動。これはコンポーネントのレンダリングトリガーに影響。
3. **`MonthlyCalendar.tsx`との整合性**: `MonthlyCalendar.tsx`も同様のデータ取得ロジックを持つ（29-36行）。フックを共有すると両方のコンポーネントに影響。
4. **`logseq.settings as any`キャスト**: フック内で使用すると、型安全性がさらに損なわれる。

**対策**:
- **フェーズ3をフェーズ1と2の後に実施**: DayCell抽出とlib.ts分割が完了してからフック化。
- フックは**既存の`useEffect`ロジックをそのまま移動**し、外部からのProps依存を維持。
- `MonthlyCalendar.tsx`での使用は**オプション**として追加。まず`TwoLineCalendar.tsx`でのみ検証。
- `logseq.settings`のアクセスは`getUserConfig()`経由に統一し、`as any`キャストを削減。

### フェーズ4: index.tsのリファクタリング
**副作用リスク**: 🔴 高

**特定されたリスク**:
1. **`setTimeout`のタイミング依存**: 各遅延（200ms、300ms、80ms、100ms、1800ms）はLogseqのDOM準備タイミングに依存。Promiseベースに変更すると、これらのタイミングが変更されてUI表示が壊れる可能性。
2. **`processingCheck`フラグ**: `onRouteChanged`と`onPageHeadActionsSlotted`の両方で使用（129行、150行）。ロック機構の変更は競合状態を引き起こす可能性。
3. **`getUserConfig`の1秒待機**: `logseq.App.getUserConfigs()`の準備を待つためのハック（62行）。変更すると初期化が失敗する可能性。
4. **非同期初期化の順序**: `main`関数内の初期化順序が変更されると、設定が適用される前にUIがレンダリングされる可能性。

**対策**:
- **`setTimeout`は維持**: Promiseベースのシーケンスに変更せず、`setTimeout`をラップした`delay()`ユーティリティ関数に抽出のみ。
- **`processingCheck`フラグは維持**: Promiseベースのロック機構に変更せず、名前を`isProcessing`に変更し、JSDocコメントを追加。
- **`getUserConfig`の1秒待機は維持**: コメントで理由を明記。
- **`main`関数の分割は最小限**: 初期化ステップを独立した関数に抽出するが、呼び出し順序は維持。

### フェーズ5: ユニットテストの追加
**副作用リスク**: 🟢 低

**特定されたリスク**:
1. **`logseq.settings`のモック**: テスト環境で`logseq.settings`が存在しないため、モックが必要。
2. **日付計算ロジックの依存**: `getWeeklyNumberFromDate`は`logseq.settings?.weekNumberFormat`に依存（229行）。モック設定が不十分だとテストが失敗。

**対策**:
- `__mocks__`ディレクトリに`logseq`モックを作成。
- テスト対象の関数を`logseq.settings`の値を引数として受け取るように**変更しない**。モックで設定値を提供。
- 日付計算ロジックのテストは`date-fns`の関数を直接使用し、Logseqの依存を最小限に。

### フェーズ6: ドキュメントと技術的負債の整理
**副作用リスク**: 🟢 低

**特定されたリスク**:
1. **`sweetalert2`依存の削除**: コードで使用されていないが、他のモジュールからインポートされている可能性。
2. **`CHANGELOG.md`の修正**: semantic-releaseの設定に問題がある可能性。設定変更がリリースプロセスに影響。

**対策**:
- `sweetalert2`の削除前に`grep`で全ファイルを検索し、使用されていないことを確認。
- `CHANGELOG.md`の重複エントリは**手動で整理**せず、semantic-releaseの設定（`release.config.js`）を確認して修正。
- TODOコメントは**削除せず**、解決状況を記載。

# Roadmap

### フェーズ1: TwoLineCalendarの重複コード削除
**優先度**: 🔴 高 | **難易度**: 🟡 中 | **副作用リスク**: 🟡 中

**現状**: `TwoLineCalendar.tsx`（646行）でRow 1とRow 3のセル描画ロジックがほぼ同じコードが複製。

**改善内容**:
- Row 1/3のセル描画ロジックを`DayCell.tsx`コンポーネントに抽出
- 共通の描画ロジック、ホリデー表示、ICSイベント表示を`DayCell`に移動
- `TwoLineCalendar.tsx`を約400行に削減
- Row 1の`</td>`欠落バグを同時に修正（意図的な変更）

**影響範囲**: `src/components/TwoLineCalendar.tsx`, `src/components/DayCell.tsx`

### フェーズ2: lib.tsのモジュール分割
**優先度**: 🔴 高 | **難易度**: 🟡 中 | **副作用リスク**: 🟢 低

**現状**: `src/lib/lib.ts`が610行の単一ファイルに多様な責任が混在。

**改善内容**:
- `dialog.ts` — `showConfirmDialog`（156行）を分離
- `page_operations.ts` — `openPageFromPageName`（100行）を分離（`showConfirmDialog`と同じファイルに配置）
- `dom_helpers.ts` — DOM操作ユーティリティを分離
- `color_utils.ts` — カラー処理関数を分離（`colorMap`、`resolveColorChoice`、`toTranslucent`、`getWeekendColor`）
- `src/lib/index.ts`のバレルファイルを更新

**影響範囲**: `src/lib/*.ts`

### フェーズ3: hooksディレクトリの実装
**優先度**: 🟡 中 | **難易度**: 🟡 中 | **副作用リスク**: 🔴 高

**現状**: `AI_GENERATION_GUIDE.md`で`useCalendarData`, `useIcsEvents`, `useWeeklyPages`が言及されているが、実装なし。

**改善内容**:
- `src/hooks/`ディレクトリにカスタムフックを実装
- `TwoLineCalendar.tsx`でフックを使用するようにリファクタリング
- `docs/AI_GENERATION_GUIDE.md`を更新
- フェーズ1と2が完了してから実施

**影響範囲**: `src/hooks/*.ts`, `src/components/TwoLineCalendar.tsx`, `docs/AI_GENERATION_GUIDE.md`

### フェーズ4: index.tsのリファクタリング
**優先度**: 🟡 中 | **難易度**: 🔴 高 | **副作用リスク**: 🔴 高

**現状**: `src/index.ts`（254行）の`main`関数が巨大で、`setTimeout`の乱用。

**改善内容**:
- `main`関数を初期化ステップに分割（最小限の分割）
- `setTimeout`は維持し、`delay()`ユーティリティ関数に抽出のみ
- `processingCheck`フラグは維持し、名前とJSDocを追加
- `getUserConfig`の1秒待機は維持し、コメントで理由を明記

**影響範囲**: `src/index.ts`

### フェーズ5: ユニットテストの追加
**優先度**: 🟡 中 | **難易度**: 🟢 低 | **副作用リスク**: 🟢 低

**現状**: JestがdevDependencyとして存在するが、テストファイルなし。

**改善内容**:
- Jestテスト環境の設定
- 日付計算ロジックのユニットテスト追加
  - `getWeeklyNumberFromDate`の境界値テスト
  - `getWeekStartFromWeekNumber`のISO/USフォーマットテスト
  - 年またぎの境界ケーステスト

**影響範囲**: `__tests__/*.test.ts`

### フェーズ6: ドキュメントと技術的負債の整理
**優先度**: 🟢 低 | **難易度**: 🟢 低 | **副作用リスク**: 🟢 低

**現状**: TODOコメントの放置、CHANGELOGの重複エントリ、不要な依存の可能性。

**改善内容**:
- `src/index.ts`の2件TODOの処理（削除せず、解決状況を記載）
- `CHANGELOG.md`の重複エントリを整理（semantic-release設定を確認）
- `sweetalert2`依存の使用確認と削除
- `@types/node`バージョンの妥当性確認

**影響範囲**: `src/index.ts`, `CHANGELOG.md`, `package.json`

# Delivery Steps

### ✓ Step 1: フェーズ1: TwoLineCalendarの重複コード削除
- `TwoLineCalendar.tsx`内のRow 1/3のセル描画ロジックを`DayCell.tsx`に抽出
- `DayCell`コンポーネントに共通の描画ロジック、ホリデー表示、ICSイベント表示を移動
- `TwoLineCalendar.tsx`を646行から471行に削減（約27%削減）
- Tooltip状態は親コンポーネントで保持し、DayCellにはコールバックをPropsとして渡す
- TypeScriptコンパイルとビルド成功を確認

### ✓ Step 2: フェーズ2: lib.tsのモジュール分割
- `src/lib/lib.ts`を610行から207行に削減（66%削減）
  - `dialog.ts` — `showConfirmDialog`、`escapeHtml`を分離
  - `page_operations.ts` — `openPageFromPageName`を分離
  - `dom_helpers.ts` — DOM操作ユーティリティを分離
  - `color_utils.ts` — カラー処理関数を分離
- `src/lib/index.ts`のバレルファイルを更新
- TypeScriptコンパイルとビルド成功を確認

### ✓ Step 3: フェーズ3: hooksディレクトリの実装
- `src/hooks/`ディレクトリを作成
- `useCalendarData.ts` — カレンダーデータ計算ロジックをフック化（日付フォーマット、ページ存在確認、ホリデー、ICSイベント）
- `TwoLineCalendar.tsx`で`useCalendarData`フックを使用するようにリファクタリング
- `TwoLineCalendar.tsx`を471行から408行にさらに削減
- TypeScriptコンパイルとビルド成功を確認

### ✓ Step 4: フェーズ4: index.tsのリファクタリング
- `main`関数を`initPlugin`, `applyStylesAndSettings`, `registerEventHandlers`に分割
- `processingCheck` → `isProcessing`にリネームし、JSDocコメントを追加
- `delay()`ユーティリティ関数を抽出
- `getUserConfig`の1秒待機に理由を明記したコメントを追加
- TODOコメントを解決状況付きのNoteに更新
- TypeScriptコンパイルとビルド成功を確認

### ✓ Step 5: フェーズ5: ユニットテストの追加
- `ts-jest`を追加し、`jest.config.js`を設定
- `__tests__/date-calculation.test.ts`を作成（`getWeeklyNumberFromDate`, `getWeekStartFromWeekNumber`, `getQuarterFromWeekNumber`, `getWeeklyNumberString`のテスト）
- **注**: Logseqプラグインの依存関係（`@logseq/libs`）がブラウザ環境を必要とするため、Jestでの実行は完全には動作しない。本格的なテストにはPlaywrightやCypressなどのE2Eフレームワークが推奨される。

### ✓ Step 6: フェーズ6: ドキュメントと技術的負債の整理
- `src/index.ts`のTODOコメントをStep 4で解決状況付きのNoteに更新済み
- `sweetalert2`依存を削除（コード内で未使用を確認）
- `CHANGELOG.md`の重複エントリはsemantic-releaseが管理するため、手動修正は行わない
- `@types/node`バージョン（25.0.3）はpnpmで正常に動作しているため維持
- TypeScriptコンパイルとビルド成功を確認

### ✓ Step 7: E2Eテスト実施（ファイルグラフ 0.10.x）
- Logseq 0.10.xを起動中（ユーザー側）
- プラグインビルドとロード確認 ✓
- 基本機能テスト（曜日表示、週番号、相対時間）✓
- カレンダー機能テスト（2行カレンダー、祝日、ICS、ページ存在）✓
- ナビゲーション機能テスト（週次/月次/四半期/年次）✓
- コンソールエラー確認 ✓

### ✓ Step 8: E2Eテスト実施（DBグラフ 2.x）
- Logseq 2.xを起動 ✓
- DBグラフでのテスト実施 ✓
- `openPageFromPageName` のDBグラフ対応修正 ✓
  - `logseq.Editor.getPage()` でページUUIDを取得
  - `journalDay` 属性でdatascriptクエリによるフォールバック
  - `pushState('page', { name: uuid })` 形式でページを開く
- ファイルグラフとの差異確認 ✓
- コンソールエラー確認 ✓
- 知見を `docs/DB_GRAPH_FINDINGS.md` にドキュメント化 ✓
  - DBグラフ固有の `pushState` API動作
  - ページ検索の3段階フォールバック
  - `@logseq/libs` の0.2系/0.3系の存在確認（最新0.3.4）

### ✓ Step 9: `@logseq/libs` のアップグレード完了
- **調査結果**: GitHubのlibs/CHANGELOG.mdは0.0.16まで。0.2系/0.3系は依存パッケージの更新が中心
- **破壊的変更**: `isPageBlock`プロパティが`insertBlock` APIから削除（2箇所修正）
  - `src/journals/monthlyJournal.ts` — `isPageBlock: true` を削除
  - `src/journals/utils.ts` — `isPageBlock: true` を削除
- **依存関係の変更**: `change-case`追加、`snake-case`削除、`dompurify` 2→3、`csstype` 3.1→3.2、`debug` 4.3→4.4、`eventemitter3` 4→5、`lodash-es` 4.17.21→4.17.23
- **アップグレード完了**: `@logseq/libs` 0.0.17 → 0.3.4
- TypeScriptコンパイルとビルド成功を確認

### ✓ Step 10: Logseqバージョン対応APIドキュメントの作成
- `docs/LOGSEQ_VERSION_COMPATIBILITY.md` を作成
- Logseqのバージョン体系（OG 1.x、0.10.x、2.x DBグラフ）を整理
- `@logseq/libs` 0.0.17 vs 0.3.4 のAPI差異を文書化
- DBグラフ固有のAPI動作を詳細に記録
  - `pushState` の `{ name: uuid }` 形式
  - `getPage` の3段階フォールバック
  - 週次ジャーナルの階層構造
- コードベースのAPI使用状況とバージョン対応を記載
- 既知の問題と回避策を整理
- 既存の `DB_GRAPH_FINDINGS.md` とのクロス参照を追加