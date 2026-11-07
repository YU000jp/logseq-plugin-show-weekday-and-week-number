# Logseq プラグイン: *Show weekday and week-number* 📆

Logseqのジャーナルをもっとスマートにするプラグインです。日付に曜日や週番号を追加して、カレンダー機能まで提供します。

> [!NOTE]   
> - Logseq DBモデルでの利用においては、2行カレンダー、月間カレンダー、および週次ジャーナルナビゲーションが機能します。[#166](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/issues/166)
> - **DBグラフでの週次ジャーナル**: プラグインは週次ページが既に **Library** に存在することを前提としています。年ページの下に `W01` … `W52` という名前のページとして配置してください（例: **Library › 2026 › W42**）。プラグインは自動的にページを作成しません。ページが存在しない場合、週番号をクリックすると「見つかりません」メッセージが表示されます。
>   - Libraryで手動で作成するか、[Logseq CLI](https://github.com/logseq/logseq/blob/master/docs/cli/logseq-cli.md) を使って一括作成できます：
>     ```
>     logseq upsert block -g <graph> --target-id <年ページのID> --pos last-child --content "W42" --update-tags '["Page"]'
>     ```

<div align="right">

[English](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/)/[日本語](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/blob/main/readme.ja.md)  [![最新リリース](https://img.shields.io/github/v/release/YU000jp/logseq-plugin-show-weekday-and-week-number)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/releases)  [![ライセンス](https://img.shields.io/github/license/YU000jp/logseq-plugin-show-weekday-and-week-number?color=blue)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/LICENSE)  [![ダウンロード数](https://img.shields.io/github/downloads/YU000jp/logseq-plugin-show-weekday-and-week-number/total.svg)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/releases)  

</div>

---

## 🎯 主な機能と特徴
   - 多言語表記に対応
   - 祝日表記に対応
     > [date-holidays](https://github.com/commenthol/date-holidays)ライブラリを活用し、世界各国に対応しています。
   - 外部ICS(`*.ics`)連携 🆕
      > Googleカレンダーなどから、予定を取り込むことが可能。ただし現時点で、GoogleカレンダーのTODOリストはICSを提供していない。

### デイリージャーナルの強化
- 日付の横に曜日と週番号を表示します。  
  表示例:  
  ![デイリージャーナル例](https://github.com/user-attachments/assets/d448da22-7316-41ab-af35-675d5a839950)

### カレンダー機能
- 前後の日付のジャーナルに簡単に移動できます。
- **2行ミニカレンダー**: コンパクトなカレンダーで、簡単に週の移動やジャーナルへのアクセスが可能です。  
  表示例:  
  ![ミニカレンダー例](https://github.com/user-attachments/assets/fcf15e0b-c890-402a-91b4-af543640f047)
- **月間カレンダー (左サイドバー)**: 祝日やジャーナルがある日付をハイライト表示します。  
  表示例:  
  ![月間カレンダー例](https://github.com/user-attachments/assets/09366e6d-462d-4bee-ba89-0131bc389d6f)

### ジャーナル機能の拡張
- **週次ジャーナル**: 週ごとの振り返りを自動化します。  
  詳細は[週次ジャーナルドキュメント](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/%E9%80%B1%E6%AC%A1%E3%82%B8%E3%83%A3%E3%83%BC%E3%83%8A%E3%83%AB-(Weekly-Journal))をご覧ください。  
  表示例:  
  ![週次ジャーナル例](https://github.com/user-attachments/assets/681ca83e-8295-4062-9e17-ec90ecee52e9)
- **月次ジャーナル**: `[[2023/10]]`のようなページをテンプレート付きで生成します。  
- **四半期/年次ジャーナル**: 月次または週次ジャーナルから階層リンクでアクセス可能です。  

### カスタマイズオプション
- 曜日や週番号の表示形式を柔軟に設定可能です。
- スラッシュコマンドで週番号を簡単に挿入できます。  
  詳細は[スラッシュコマンドドキュメント](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/Slash-Command)をご覧ください。

---

## 🚀 使い方

### インストール方法
1. Logseqを開きます。
2. マーケットプレイスに移動します（右上の`...`をクリック）。
3. 「Show weekday」で検索し、インストールをクリックします。

### 初期設定
1. プラグイン設定を開きます。
2. **週番号のフォーマットを選択**:  
   - `USフォーマット`: 日曜始まりの週。  
   - `ISOフォーマット`: 月曜始まりの週。  
   詳細は[週番号フォーマットドキュメント](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/%E9%80%B1%E7%95%AA%E5%8F%B7%E3%83%95%E3%82%A9%E3%83%BC%E3%83%9E%E3%83%83%E3%83%88%E3%81%AE%E9%81%B8%E6%8A%9E%E8%82%A2-(Japanese))をご覧ください。  
3. 必要に応じて機能を有効化または無効化します。  

---

## 💡 追加リソース

- **ディスカッション**: [ディスカッションタブ](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/discussions)で質問やアイデアを共有できます。  
- **関連プラグイン**:  
  - [Flex Date Format プラグイン](https://github.com/YU000jp/logseq-plugin-flex-date-format)  
  - [Default Template プラグイン](https://github.com/YU000jp/logseq-plugin-default-template)  

---

## 🛠️ 貢献とクレジット

- **スクリプト提供者**:
  - [danilofaria](https://discuss.logseq.com/u/danilofaria/)  
  - [ottodevs](https://discuss.logseq.com/u/ottodevs/)
  > [曜日と週番号を表示 - discuss.logseq.com](https://discuss.logseq.com/t/show-week-day-and-week-number/12685/18)
- **使用ライブラリ**:  
  - [date-fns](https://date-fns.org/)  
  - [date-holidays](https://github.com/commenthol/date-holidays)  
  - [@6tail/lunar-typescript](https://github.com/6tail/lunar-typescript)  
  - @sethyuan/logseq-l10n
- **アイコン**: [IonutNeagu - svgrepo.com](https://www.svgrepo.com/svg/490868/monday)  
- **製作者**: [YU000jp](https://github.com/YU000jp)  

---
