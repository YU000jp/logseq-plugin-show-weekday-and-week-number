# Logseq プラグイン: *Show weekday and week-number* 📆

Logseqのジャーナルをもっとスマートにするプラグインです。日付に曜日や週番号を追加して、カレンダー機能まで提供します。

> [!NOTE] 
> - Logseq v0.10.x (ファイルシステム版) で動作します
> - Logseq dbバージョンでは現在非対応です

<div align="right">

[English](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/)/[日本語](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/blob/main/readme.ja.md) [![latest release version](https://img.shields.io/github/v/release/YU000jp/logseq-plugin-show-weekday-and-week-number)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/releases)[![License](https://img.shields.io/github/license/YU000jp/logseq-plugin-show-weekday-and-week-number?color=blue)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/LICENSE)
[![Downloads](https://img.shields.io/github/downloads/YU000jp/logseq-plugin-show-weekday-and-week-number/total.svg)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/releases) 公開日 20230526 <a href="https://www.buymeacoffee.com/yu000japan"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a pizza&emoji=🍕&slug=yu000japan&button_colour=FFDD00&font_colour=000000&font_family=Poppins&outline_colour=000000&coffee_colour=ffffff" /></a>
</div>

## 🎯 プラグインでできること

### 1️⃣ デイリージャーナルが見やすくなります
- 日付の横に曜日と週番号などが表示されます。表示内容はカスタマイズできます。

### 2️⃣ 使いやすいカレンダー機能
- **コンパクトな2行カレンダー**
   - ↑↓キーで週の切り替えができます
   - クリックで月や週のジャーナルにジャンプ
- **月間カレンダー** (左サイドバー) 🆕
   - 祝日がハイライト表示されます
   - ページがある日付が一目で分かります

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

## 🚀 使い方

### 1. インストール方法
1. マーケットプレイスを開く（右上の [...] から）
3. 「Show weekday」で検索
4. インストールをクリック

### 2. はじめの設定（重要）
1. プラグイン設定を開く
2. **週番号の表示方式を選択**:
   - `USフォーマット`: 日曜始まりの週
   - `ISOフォーマット`: 月曜始まりの週
   > 💡 日本では一般的にISOフォーマットが使われることが多いようです

3. お好みの機能をオン/オフ
   - 各機能は後からでも変更できます
   - 表示形式も自由にカスタマイズ可能

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
