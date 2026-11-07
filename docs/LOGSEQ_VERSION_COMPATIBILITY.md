# Logseq バージョン対応とAPI差異

このドキュメントは、Logseqの各バージョン（OG 1.x、0.10.x、2.x DBグラフ）でのAPI差異と、このプラグインの対応状況を記録します。

## 1. Logseqのバージョン体系

Logseqには複数のバージョン系列が存在し、それぞれ異なるAPIと動作特性を持っています。

### バージョン分類

| 系列 | バージョン | グラフタイプ | UI | 備考 |
|------|-----------|-------------|-----|------|
| **OG 1.x** | 1.0.0 - 1.x.x | ファイルグラフ（Markdown） | 旧UI | 初期バージョン、datascriptベース |
| **0.10.x** | 0.10.0 - 0.10.15 | ファイルグラフ（Markdown） | 旧UI | 安定版、プラグインエコシステムが成熟 |
| **0.11.x** | 0.11.0+ | ファイルグラフ/DBグラフ | 新UI | DBグラフ実験的サポート |
| **2.x** | 2.0.0+ | DBグラフ（デフォルト） | 新UI | DBベースのグラフ、ファイルグラフも対応 |

### アプリ世代判定

`src/logseqModelCheck.ts` で実装されている判定ロジック：

```typescript
// DB系世代（新UI）= major>=2 または 0.11.x
// OG 1.x はMD版系統（旧UI）側
const isDbEra = m ? (Number(m[1]) >= 2 || (Number(m[1]) === 0 && Number(m[2]) >= 11)) : false
```

### グラフ種別判定

```typescript
// logseq.App.checkCurrentIsDbGraph() を使用
// 0.10.xでは未実装 → null を返す
const isDbGraph = (await checkLogseqDbGraph()) ?? false
```

**重要**: `checkCurrentIsDbGraph()` は `@logseq/libs` 0.3.4 で公式APIとして追加されましたが、0.10.xのLogseqホストでは未実装です。`null` を返した場合、ファイルグラフとして扱います。

## 2. `@logseq/libs` のバージョン差異

### バージョン比較

| バージョン | リリース日 | 備考 |
|-----------|-----------|------|
| 0.0.17 | 2023-12-30 | アップグレード前のバージョン |
| 0.2.0 | 2024-08-14 | 0.2系の最初のリリース |
| 0.2.12 | 2026-01-19 | 0.2系の最新 |
| 0.3.4 | 2026-06-24 | 現在のプロジェクトで使用 |

### API 変更（0.0.17 → 0.3.4）

#### 削除されたAPI

| API | 変更内容 | 影響 |
|-----|---------|------|
| `insertBlock` の `isPageBlock` | オプションから削除 | `src/journals/monthlyJournal.ts`、`src/journals/utils.ts` を修正 |

#### 追加されたAPI

| API | 説明 |
|-----|------|
| `logseq.App.checkCurrentIsDbGraph()` | 現在のグラフがDBグラフか判定 |
| `logseq.App.getCurrentGraphConfigs()` | グラフ設定を取得 |
| `logseq.App.setCurrentGraphConfigs()` | グラフ設定を設定 |
| `logseq.Editor.getTodayPage()` | 今日のジャーナルページを取得 |

#### 変更されたAPI

| API | 0.0.17 | 0.3.4 |
|-----|--------|-------|
| `openInRightSidebar` | `BlockUUID \| EntityID` | `BlockUUID \| EntityID \| RendererKey` |
| `getCurrentGraphRecent` | `Array<string>` | `Array<string \| PageEntity>` |
| `getCurrentGraphFavorites` | `Array<string>` | `Array<string \| PageEntity>` |

#### 依存関係の変更

| パッケージ | 0.0.17 | 0.3.4 |
|-----------|--------|-------|
| `dompurify` | 2.3.8 | 3.3.3 |
| `csstype` | 3.1.0 | 3.2.x |
| `debug` | 4.3.4 | 4.4.x |
| `eventemitter3` | 4.0.7 | 5.0.4 |
| `lodash-es` | 4.17.21 | 4.17.23 |
| `snake-case` | 3.0.4 | 削除 |
| `change-case` | 不存在 | 追加 |

## 3. DBグラフ固有のAPI動作

DBグラフ（Logseq 2.x）では、以下のAPIがファイルグラフとは異なる動作をします。

### 3.1 `logseq.App.pushState()`

**ファイルグラフ**:
```typescript
logseq.App.pushState('page', { name: pageName })
// 例: logseq.App.pushState('page', { name: '2026/11/07' })
```

**DBグラフ**:
```typescript
// DBグラフでは UUID を name キーで渡す必要がある
logseq.App.pushState('page', { name: pageUuid })
// 例: logseq.App.pushState('page', { name: 'a1b2c3d4-e5f6-...' })
```

**注意**: `{ uuid: pageUuid }` 形式は動作しません。`{ name: pageUuid }` 形式が必要です。これは公式ドキュメントに記載されていないDBグラフ固有の動作です。

### 3.2 `logseq.Editor.getPage()`

DBグラフでは、ページ名で検索できない場合があります。特に：

- スラッシュ（`/`）を含むページ名（例: `2026/11/07`）
- カスタム日付フォーマッターで変更されたページ名

**回避策**: 3段階のフォールバック検索（`src/lib/page_operations.ts` 実装）

1. **直接検索**: `logseq.Editor.getPage(pageName)`
2. **フォーマット変換**: スラッシュ→ダッシュに変換して再試行
3. **journalDayクエリ**: `yyyyMMdd` 形式でdatascriptクエリ

### 3.3 `logseq.DB.datascriptQuery()`

DBグラフでは、datascriptクエリがファイルグラフとは異なる結果を返す場合があります。

**`:block/name` の問題**:
- DBグラフでは `:block/name` がカスタム日付フォーマッターで変更されると更新されなくなる
- `:block/title` と `:block/original-name` の両方を検索対象に含める必要がある

**`:block/file` の問題**:
- DBグラフでは `:block/file` 属性が存在しない
- ファイル存在確認（`doesPageFileExist`）はファイルグラフでのみ有効

### 3.4 週次ジャーナルの階層構造

DBグラフでは、週次ジャーナルが年ページの子ページとして保存されます：

```
Library
└── 2026
    ├── W01
    ├── W02
    └── ...
```

`findDbWeeklyPageUuid` 関数で親ページによる階層検索を行います（`src/lib/query/advancedQuery.ts`）。

### 3.5 ページ作成の制限

DBグラフではスラッシュ（`/`）を含むページ名が作成できません。

- **日次ジャーナル**: `yyyy/MM/dd` → `yyyy-MM-dd` に変更が必要
- **週次ジャーナル**: `2024/W01` → `2024-W01` に変更が必要
- **月次ジャーナル**: `yyyy/MM` は作成可能

## 4. コードベースのAPI使用状況

このプラグインで使用しているLogseq APIのバージョン対応状況：

### 4.1 `logseq.App`

| API | ファイルグラフ | DBグラフ | 備考 |
|-----|:---:|:---:|------|
| `getInfo()` | ✅ | ✅ | バージョン取得 |
| `getUserConfigs()` | ✅ | ✅ | ユーザー設定取得 |
| `checkCurrentIsDbGraph()` | ❌ | ✅ | 0.10.xでは未実装 |
| `pushState()` | ✅ | ✅ | DBグラフで形式が異なる |
| `onRouteChanged()` | ✅ | ✅ | ルート変更イベント |
| `onPageHeadActionsSlotted()` | ✅ | ✅ | ページヘッダーイベント |
| `onTodayJournalCreated()` | ✅ | ✅ | 今日ジャーナル作成イベント |
| `onCurrentGraphChanged()` | ✅ | ✅ | グラフ変更イベント |
| `invokeExternalCommand()` | ✅ | ✅ | 型定義不存在、`(as any)` 経由 |

### 4.2 `logseq.Editor`

| API | ファイルグラフ | DBグラフ | 備考 |
|-----|:---:|:---:|------|
| `getPage()` | ✅ | ⚠️ | DBグラフで検索できない場合がある |
| `getCurrentPage()` | ✅ | ✅ | 現在ページ取得 |
| `createPage()` | ✅ | ✅ | ページ作成 |
| `insertBlock()` | ✅ | ✅ | `isPageBlock` は0.3.4で削除 |
| `openInRightSidebar()` | ✅ | ✅ | 右サイドバーで開く |
| `getPageBlocksTree()` | ✅ | ✅ | ページのブロックツリー取得 |

### 4.3 `logseq.DB`

| API | ファイルグラフ | DBグラフ | 備考 |
|-----|:---:|:---:|------|
| `datascriptQuery()` | ✅ | ✅ | クエリ実行 |

**クエリ注意事項**:
- `:block/file` 属性はファイルグラフでのみ有効
- `:block/journal-day` は両方で有効
- `:block/name` vs `:block/title` の動作が異なる場合がある

### 4.4 `logseq.UI`

| API | ファイルグラフ | DBグラフ | 備考 |
|-----|:---:|:---:|------|
| `showMsg()` | ✅ | ✅ | メッセージ表示 |

## 5. 非公式API

型定義に存在せず、`(logseq.App as any)` 経由で使用しているAPI：

| API | 使用箇所 | 備考 |
|-----|---------|------|
| `invokeExternalCommand()` | `src/lib/page_operations.ts` | 設定画面を開くために使用 |

これらのAPIは将来のバージョンで変更される可能性があるため、注意が必要です。

## 6. 既知の問題と回避策

### 6.1 DBグラフでのページ検索失敗

**問題**: `logseq.Editor.getPage()` がページ名で検索できない

**回避策**: 3段階フォールバック検索（`src/lib/page_operations.ts`）

### 6.2 DBグラフでのpushState形式

**問題**: `{ uuid: pageUuid }` 形式が動作しない

**回避策**: `{ name: pageUuid }` 形式を使用（`src/lib/page_operations.ts`）

### 6.3 ファイルグラフでのファイル存在確認

**問題**: `:block/file` 属性はDBグラフで存在しない

**回避策**: `doesPageFileExist()` はファイルグラフでのみ使用（`src/lib/query/advancedQuery.ts`）

### 6.4 週次ジャーナルの階層構造

**問題**: DBグラフでは週次ジャーナルが年ページの子として保存

**回避策**: `findDbWeeklyPageUuid()` で階層検索（`src/lib/query/advancedQuery.ts`）

## 7. テスト結果

| グラフタイプ | Logseqバージョン | テスト結果 | 備考 |
|-------------|-----------------|-----------|------|
| ファイルグラフ | 0.10.x | ✅ 正常 | 基本機能、カレンダー、ナビゲーションすべて正常 |
| DBグラフ | 2.x | ✅ 正常（修正後） | `pushState` 形式修正により動作確認 |

## 8. Logseq CLI とプラグインからのコマンド呼び出し

Logseqにはコマンドラインインターフェース（CLI）と、プラグインからコマンドを呼び出すAPIが存在します。

### 8.1 `invokeExternalCommand` API

`@logseq/libs` 0.3.4 で公式APIとして利用可能な `logseq.App.invokeExternalCommand()` は、Logseqに登録されたコマンドパレットのコマンドをプログラムから呼び出します。

**シグネチャ**:
```typescript
logseq.App.invokeExternalCommand(
  type: ExternalCommandType,
  ...args: any[]
): Promise<void>
```

**使用例**:
```typescript
// 設定画面を開く
await (logseq.App as any).invokeExternalCommand('settings')

// コマンドパレットを開く
await (logseq.App as any).invokeExternalCommand('command-palette')
```

**このプラグインでの使用**:
- `src/lib/page_operations.ts` で設定画面を開くために使用
- 型定義に存在しないため `(logseq.App as any)` 経由で呼び出し

**注意**: `invokeExternalCommand` は登録されたコマンドタイプを指定して呼び出すもので、外部プロセスの実行ではありません。

### 8.2 `invokeExternalPlugin` API

`logseq.App.invokeExternalPlugin()` は、他のプラグインが公開したコマンドを呼び出します。

**シグネチャ**:
```typescript
logseq.App.invokeExternalPlugin(
  type: string,
  ...args: any[]
): Promise<unknown>
```

**使用例**:
```typescript
// 他のプラグインが公開したコマンドを呼び出す
const result = await logseq.App.invokeExternalPlugin('some-plugin-command', arg1, arg2)
```

### 8.3 Logseq公式 CLI（Node.js）

Logseq本体には `cli/` ディレクトリにNode.jsベースの公式CLIが含まれています。このCLIはグラフの操作、クエリ実行、インポート/エクスポートなどをコマンドラインから行うことができます。

**主な機能**:
- ページ/ブロックの CRUD 操作
- Datascript クエリの実行
- グラフのインポート/エクスポート
- サーバー管理（db-workerの起動/停止）
- 診断ツール（doctor）

**ドキュメント**: `docs/cli/logseq-cli.md`（Logseqリポジトリ内）

**プラグインとの関係**:
- プラグインから直接公式CLIを呼び出すことはできません
- `invokeExternalCommand` はLogseq内部のコマンドを呼び出すもので、CLIとは異なります
- CLIは主に開発者向けで、CI/CDやバッチ処理で使用されます

### 8.4 第三者のLogseq CLIツール

コミュニティによって開発されたコマンドラインツールがいくつか存在します。これらはLogseqグラフをコマンドラインから操作するためのツールです。

| ツール | 作者 | 言語 | 特徴 |
|--------|------|------|------|
| [wolf-jonathan/logseq-cli](https://github.com/wolf-jonathan/logseq-cli) | wolf-jonathan | Python | NDJSON出力、パイプ対応、jqとの組み合わせ可能 |
| [muellerei/logseq-cli](https://github.com/muellerei/logseq-cli) | muellerei | Python | dry-runモード、AIエージェント向け、安全な書き込み |
| [cldwalker/logseq-query](https://github.com/cldwalker/logseq-query) | cldwalker | Node.js | Datalogクエリ専用、EDNベースのルール定義 |

**これらのツールの特徴**:
- Logseqグラフを直接操作（ファイルベース）
- プラグインAPIとは独立した仕組み
- バッチ処理やCI/CDでの使用を想定
- `logseq-query`（`lq`）はnpmでインストール可能: `npm install logseq-query -g`

### 8.5 プラグインから外部コマンドを実行する手法

プラグインから外部プロセスを実行する方法はいくつかあります：

#### 手法1: `invokeExternalCommand`（推奨）
```typescript
// Logseq内部コマンドの呼び出し
await (logseq.App as any).invokeExternalCommand('settings')
```
- Logseq内部のコマンドのみ呼び出せる
- 安全で公式API

#### 手法2: `provideModel` による外部連携
```typescript
logseq.provideModel({
  async handleExternalCall({ command, args }) {
    // 外部コマンドの実行ロジック
  }
})
```
- プラグインがモデルを公開し、他のプラグインや外部スクリプトから呼び出し可能
- HTTPブリッジを介した外部アクセスも可能

#### 手法3: 外部スクリプトとの連携
```typescript
// Node.jsスクリプトとの連携例
// プラグイン側はデータ準備のみを行い、外部スクリプトで処理
const data = await prepareData()
// データをクリップボードや一時ファイルに出力
// 外部ツールで処理後、結果をプラグインに戻す
```
- Logseqプラグインはブラウザ環境で動作するため、直接OSコマンドを実行できない
- 中間層（HTTPサーバーやファイルI/O）を介して外部ツールと連携する必要がある

### 8.6 PythonからのLogseq APIアクセス

PythonからLogseqのAPIにアクセスする方法も存在します。Gistなどで共有されている例では、Logseqの内部HTTPエンドポイントに直接アクセスしています。

```python
# 例: PythonからLogseq APIを呼び出す
import requests

def raw_api_call(host, port, token, method, args):
    resp = requests.post(
        f'http://{host}:{port}/api',
        json={'method': method, 'args': args},
        headers={'Authorization': 'Bearer ' + token}
    )
    return resp.json()

# logseq.App.pushState を呼び出す例
raw_api_call('127.0.0.1', port, token, 'logseq.App.pushState', ['page', {'name': 'My Page'}])
```

**注意**: この方法は非公式で、Logseqの内部実装に依存しています。将来のバージョンで動作しなくなる可能性があります。

## 9. 参考リンク

- [Logseq Plugin API Documentation](https://logseq.github.io/plugins/modules.html)
- [Logseq GitHub Repository](https://github.com/logseq/logseq)
- [Logseq libs CHANGELOG](https://github.com/logseq/logseq/blob/master/libs/CHANGELOG.md)
- [DBグラフ固有の知見](./DB_GRAPH_FINDINGS.md)
- [Logseq CLI ドキュメント](https://github.com/logseq/logseq/blob/master/docs/cli/logseq-cli.md)
- [wolf-jonathan/logseq-cli](https://github.com/wolf-jonathan/logseq-cli) — Python製CLIツール
- [cldwalker/logseq-query](https://github.com/cldwalker/logseq-query) — Node.js製クエリツール
