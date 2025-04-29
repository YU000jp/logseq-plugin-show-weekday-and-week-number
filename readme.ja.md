# Logseq プラグイン: *Show weekday and week-number* 📆

- Logseqのジャーナル機能を強化

> [!NOTE] 
> - このプラグインは現在、Logseq dbバージョンでは動作しません
> - 動作環境: Logseq v0.9.x (ファイルシステム版)

<div align="right">

[English](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/)/[日本語](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/blob/main/readme.ja.md) [![latest release version](https://img.shields.io/github/v/release/YU000jp/logseq-plugin-show-weekday-and-week-number)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/releases)[![License](https://img.shields.io/github/license/YU000jp/logseq-plugin-show-weekday-and-week-number?color=blue)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/LICENSE)
[![Downloads](https://img.shields.io/github/downloads/YU000jp/logseq-plugin-show-weekday-and-week-number/total.svg)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/releases) 公開日 20230526 <a href="https://www.buymeacoffee.com/yu000japan"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a pizza&emoji=🍕&slug=yu000japan&button_colour=FFDD00&font_colour=000000&font_family=Poppins&outline_colour=000000&coffee_colour=ffffff" /></a>
</div>

## 🎯 主な機能

### 🗓️ デイリージャーナルを強化
- 日付タイトルの横に曜日と週番号を表示
- 表示内容はプラグイン設定でカスタマイズ可能

### 📅 スマートカレンダー
- **2行ミニカレンダー**: コンパクトで使いやすいデザイン
   - 前後の週に簡単切り替え (`↑`/`↓`キー)
   - 月次ジャーナル (`[[2024/05]]`) や週次ジャーナル (`[[2024/Q2/W19]]`) へのリンク付き
- **月間カレンダー (左サイドバー)** 🆕
   - 祝日表示対応
   - ページ存在インジケーター搭載

### 📖 ジャーナル機能の拡張
- **週次/月次/四半期/年次ジャーナル**の自動生成とテンプレート適用
- **ナビゲーションリンク**で他のジャーナルページに簡単アクセス 🆕

### 🛠️ カスタマイズ可能な表示オプション
- 曜日や週番号の表示内容を自由に設定可能
- スラッシュコマンドで週番号などを簡単に挿入
   > 詳細は[こちら](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/Slash-Command)

---

### 📌 詳細な機能説明

#### デイリージャーナルの詳細表示
- 日付タイトルの横に曜日や週番号を表示
- 表示例:
   ![画像](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/assets/111847207/f47b8948-5e7a-4e16-a5ae-6966672742b1)

#### ジャーナル用カレンダー
- 日誌や日付ページを開いているときに表示
- 前後の日付に簡単アクセス (Shift+クリックでサイドバー表示)
- 祝日対応のカレンダーとページ存在インジケーター付き
   - **2行ミニカレンダー**:

      ![image](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/assets/111847207/bf085523-89e7-4c2a-a7ef-9a260975bde8)
   - **月間カレンダー (左サイドバー)**:

      ![image](https://github.com/user-attachments/assets/3f1c717b-82b0-4869-b9c2-6369d5a82b38)

#### 週次ジャーナル (Weekly Journal)
- 週番号リンクをクリックするとページが生成され、テンプレートが適用
- 前後の週に簡単アクセス可能
   > 詳細は[こちら](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/%E9%80%B1%E6%AC%A1%E3%82%B8%E3%83%A3%E3%83%BC%E3%83%8A%E3%83%AB-(Weekly-Journal))
   - サンプル:
   
      ![image](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/assets/111847207/eb35708d-89e9-401d-a0b9-9ff8e49bb290)

#### 月次ジャーナル (Monthly Journal)
- ミニカレンダーのリンクをクリックすると`[[2023/10]]`のようなページが生成され、テンプレートが適用

#### 四半期ジャーナル (Quarterly Journal) / 年次ジャーナル (Yearly Journal) 🆕
- 月次または週次の階層リンクからアクセス可能
- ページが生成され、テンプレートが適用
   > 注: 四半期ジャーナルは、週次ジャーナルのページタイトルフォーマットが`yyyy/qqq/Www`もしくは`yyy-qqq-Www`の場合のみ有効

---

## 🚀 はじめ方

### 1. インストール
- Logseqマーケットプレイスから

### 2. 初期設定とその他の設定（重要）
1. プラグイン設定にて、週番号の計算方式を選択
   - `USフォーマット (アメリカ式)` または `ISOフォーマット` から選択
   > [週番号についてのドキュメントはこちら](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/%E9%80%B1%E7%95%AA%E5%8F%B7%E3%83%95%E3%82%A9%E3%83%BC%E3%83%9E%E3%83%83%E3%83%88%E3%81%AE%E9%81%B8%E6%8A%9E%E8%82%A2-(Japanese))

2. その他の設定
   - 必要な機能をオン/オフ
   - プラグイン設定で表示内容をカスタマイズ

# ショーケース / 質問 / アイデア / ヘルプ

> [ディスカッション](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/discussions) タブに移動して、この種の情報を質問したり見つけたりできます。

- 関連
  1. 日付リンクに含まれる曜日を、日本語表記にする
     > [Flex date format プラグイン](https://github.com/YU000jp/logseq-plugin-flex-date-format)を利用してください。
  1. 古い日付シングルページを開いたときに、ジャーナルテンプレートが適用されない
     > [Default Template プラグイン](https://github.com/YU000jp/logseq-plugin-default-template)のジャーナルテンプレート補完機能を利用してください。

## 貢献 / クレジット

- スクリプト > [曜日と週番号を表示 - discuss.logseq.com](https://discuss.logseq.com/t/show-week-day-and-week-number/12685/18) @[danilofaria](https://discuss.logseq.com/u/danilofaria/), @[ottodevs](https://discuss.logseq.com/u/ottodevs/)
- ライブラリ > [date-fns](https://date-fns.org/)
- ライブラリ > [date-holidays](https://github.com/commenthol/date-holidays) 祝日のハイライト
- ライブラリ > [@sethyuan/ logseq-l10n](https://github.com/sethyuan/logseq-l10n) 翻訳機能
- アイコン > [@IonutNeagu - svgrepo.com](https://www.svgrepo.com/svg/490868/monday)
- 製作者 > [@YU000jp](https://github.com/YU000jp)
