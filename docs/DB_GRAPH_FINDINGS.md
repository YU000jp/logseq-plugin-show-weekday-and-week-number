# DBグラフ（Logseq 2.x）対応に関する知見

このドキュメントは、Logseq 2.xのDBグラフでプラグインを動作させる際に得た重要な知見を記録します。

## 背景

2026年11月7日、E2Eテスト中にDBグラフ（Logseq 2.x）でカレンダーの日付クリックが動作しない問題が発見されました。ファイルグラフ（Logseq 0.10.x）では正常に動作していました。

## 問題の概要

**症状**: カレンダーの日付をクリックすると、既に存在する日付エントリーが開かず、空白のページになってしまう。

**環境**:
- Logseq 2.x（DBグラフ）
- 日付フォーマット: `yyyy/MM/dd`（スラッシュ区切り）
- ファイルグラフ（0.10.x）では正常動作

## 調査過程

### 1. 初期仮説：スラッシュ区切りの問題

当初、DBグラフではスラッシュ（`/`）を含むページ名が作成できないという既知の問題があると考えられました。しかし、ユーザーは「yyyy/MM/ddは存在する」と指摘し、この仮説は否定されました。

### 2. `logseq.Editor.getPage()` の動作確認

DevToolsコンソールで確認したところ：

```javascript
[weekday-plugin] openPageFromPageName: {pageName: '2026/11/07', isDbGraph: true}
[weekday-plugin] getPage result: null
[weekday-plugin] page not found, prompting create
```

`logseq.Editor.getPage('2026/11/07')` が `null` を返すことが確認されました。ページが存在するのに、APIがページを見つけられない状態です。

### 3. Datascriptクエリの検証

`journalDay` 属性を使用したdatascriptクエリでは、ページが正しく見つかりました：

```clojure
[:find (pull ?b [:block/uuid :block/title :block/name :block/journal-day])
 :in $ ?jd
 :where
 [?b :block/journal-day ?jd]]
```

クエリ結果に日付エントリーがリストアップされていることが確認されました。

### 4. `pushState` APIのパラメータ形式

重要な発見：**DBグラフでは `pushState` のパラメータ形式が異なる**。

#### ファイルグラフ（0.10.x）
```typescript
logseq.App.pushState('page', { name: pageName })
// 例: logseq.App.pushState('page', { name: '2026/11/07' })
```

#### DBグラフ（2.x）
```typescript
// ❌ 動作しない
logseq.App.pushState('page', { uuid: pageUuid })

// ✅ 動作する
logseq.App.pushState('page', { name: pageUuid })
// 例: logseq.App.pushState('page', { name: 'a1b2c3d4-e5f6-...' })
```

**DBグラフでは `pushState('page', { name: uuid })` の形式でUUIDを渡す必要があります。**

これは `@logseq/libs` の公式ドキュメントには記載されていない、DBグラフ固有の動作です。

## 実装された修正

`src/lib/page_operations.ts` の `openPageFromPageName` 関数を以下のように修正しました：

### 修正前のコード
```typescript
const page = await findPageUuid(pageName) as PageEntity["uuid"] | false
if (page) {
  logseq.App.pushState('page', { name: pageName })
} else {
  await promptCreateIfMissing()
}
```

### 修正後のコード
```typescript
let pageUuid: PageEntity["uuid"] | false = false

const isDb = booleanDbGraph()

if (isDb) {
  // DBグラフではページ名が異なる形式で保存されている可能性がある
  // 複数の形式で試す
  const page = await logseq.Editor.getPage(pageName)

  if (page?.uuid) {
    pageUuid = page.uuid
  } else {
    // スラッシュをダッシュに変換して再試行
    const dashName = pageName.replace(/\//g, '-')
    if (dashName !== pageName) {
      const page2 = await logseq.Editor.getPage(dashName)
      if (page2?.uuid) pageUuid = page2.uuid
    }

    // journalDay属性で検索する最後の手段
    if (!pageUuid) {
      const journalDayMatch = pageName.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
      if (journalDayMatch) {
        const journalDay = journalDayMatch[1] +
          journalDayMatch[2].padStart(2, '0') +
          journalDayMatch[3].padStart(2, '0')
        const queryResult = await logseq.DB.datascriptQuery(`
          [:find (pull ?b [:block/uuid :block/title :block/name :block/journal-day])
           :in $ ?jd
           :where
           [?b :block/journal-day ?jd]]
        `, journalDay)
        if (queryResult && queryResult.length > 0) {
          pageUuid = queryResult[0][0].uuid
        }
      }
    }
  }
} else {
  pageUuid = await findPageUuid(pageName) as PageEntity["uuid"] | false
}

if (pageUuid) {
  if (isDb) {
    // DBグラフでは pushState('page', { name: uuid }) の形式が必要
    logseq.App.pushState('page', { name: pageUuid })
  } else {
    logseq.App.pushState('page', { name: pageName })
  }
} else {
  await promptCreateIfMissing()
}
```

## 主要な知見

### 1. DBグラフでのページ検索

DBグラフでは `logseq.Editor.getPage()` がページ名で検索できない場合があります。以下の3段階のフォールバックが必要です：

1. **直接検索**: `logseq.Editor.getPage(pageName)`
2. **フォーマット変換**: スラッシュ→ダッシュに変換して再試行
3. **journalDayクエリ**: `yyyyMMdd` 形式でdatascriptクエリ

### 2. `pushState` APIのDBグラフ対応

DBグラフでは `pushState('page', { name: uuid })` の形式でUUIDを渡す必要があります。これは公式ドキュメントに記載されていない動作です。

### 3. `@logseq/libs` のバージョン問題

**重要な発見**: npmに `@logseq/libs` の0.2系と0.3系が存在することが確認されました。

| バージョン | リリース日 | 備考 |
|-----------|-----------|------|
| 0.0.17 | 2023-12-30 | 現在のプロジェクトで使用 |
| 0.2.0 | 2024-08-14 | 0.2系の最初のリリース |
| 0.2.12 | 2026-01-19 | 0.2系の最新 |
| 0.3.4 | 2026-06-24 | 最新の安定版 |

- **npm公式**: `@logseq/libs@0.3.4`（2026年6月リリース）が最新
- **現在のプロジェクト**: `@logseq/libs@0.0.17`（2023年12月）を使用しており、約2.5年分古い
- **Logseq本体**: `libs/` ディレクトリに `0.2.1.0` が存在（内部バージョン）

0.2系はLogseq 2.x（DBグラフ）のAPIを公式にサポートしている可能性があります。アップグレードを検討すべきです。

#### アップグレードの考慮事項

1. **破壊的変更の可能性**: 0.0.17 → 0.3.4 はメジャーバージョンジャンプのため、APIの破壊的変更がある可能性
2. **型定義の変更**: TypeScriptの型定義が変更されている可能性
3. **テストが必要**: アップグレード後にE2Eテストを再実施する必要がある
4. **段階的なアップグレード**: 0.0.17 → 0.2.12 → 0.3.4 と段階的にアップグレードすることを推奨

### 4. DBグラフの既知の問題

- `:block/name` がカスタム日付フォーマッターで変更されると更新されなくなる
- スラッシュを含むページ名の扱いが不安定
- `logseq.Editor.getPage()` が期待通りに動作しない場合がある

## テスト結果

| グラフタイプ | Logseqバージョン | テスト結果 | 備考 |
|-------------|-----------------|-----------|------|
| ファイルグラフ | 0.10.x | ✅ 正常 | 基本機能、カレンダー、ナビゲーションすべて正常 |
| DBグラフ | 2.x | ✅ 正常（修正後） | `pushState` 形式修正により動作確認 |

## 今後の課題

1. **`@logseq/libs` のアップグレード**: 0.0.17 → 0.2.12 または 0.3.4 へのアップグレードを検討。DBグラフのAPIが公式にサポートされる可能性が高い
2. **公式APIドキュメントの更新**: DBグラフ固有のAPI動作が公式に文書化されることを期待
3. **E2Eテストの自動化**: Playwright/Cypressなどのフレームワークでの自動化を検討

## 関連ドキュメント

- [Logseq バージョン対応とAPI差異](./LOGSEQ_VERSION_COMPATIBILITY.md) — Logseqのバージョン体系、API差異、DBグラフ固有の動作、コードベースのAPI使用状況を包括的に記録

## 参考リンク

- [Logseq Plugin API Documentation](https://logseq.github.io/plugins/modules.html)
- [Logseq GitHub Repository](https://github.com/logseq/logseq)
- [Logseq libs AGENTS.md](https://github.com/logseq/logseq/blob/master/libs/guides/AGENTS.md)
