# Architecture Overview

このリポジトリは Logseq プラグイン「show-weekday-and-week-number」です。保守性と再利用性を高めるための簡潔なアーキテクチャ案内を示します。

主要なディレクトリ
- `src/` - メインのソースコード。
  - `lib/` - 汎用ユーティリティ（UI helper、日付計算、localize 等）。
  - `journals/`, `calendar/`, `settings/`, `translations/` など、関心ごとに分離された機能モジュール。

設計方針（短く）
- ユーティリティは `src/lib` に集約する。共通の関数や型はここからエクスポートする。
- 外部ファイルからは直接ファイルパスで import するのではなく、`src/lib/index.ts` のバレル経由でインポートする（例: `import { createElementWithClass } from '@/lib'`）。
- 小さな関数を作りすぎない。複数箇所で使う処理のみ `lib` に上げる。
- 破壊的変更は避け、公開 API（関数名と型）は安定させる。

将来の改善案
- `src/types.ts` を作成して共有型を一元化する。
- テスト（ユニット）を追加して日付ロジックなどの正当性を保障する。
