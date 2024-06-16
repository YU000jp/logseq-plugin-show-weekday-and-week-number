[English](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number)

# Logseq プラグイン: *Show weekday and week-number* 📆

1. 日付タイトルの横に、曜日と週番号を表示します。
1. 日誌などに、2行カレンダーを表示します。
1. 「週次ジャーナル」機能を提供します。

[![最新リリースバージョン](https://img.shields.io/github/v/release/YU000jp/logseq-plugin-show-weekday-and-week-number)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/releases)
[![ライセンス](https://img.shields.io/github/license/YU000jp/logseq-plugin-show-weekday-and-week-number?color=blue)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/LICENSE)
[![ダウンロード数](https://img.shields.io/github/downloads/YU000jp/logseq-plugin-show-weekday-and-week-number/total.svg)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/releases)
公開日 2023/05/26

---

## 機能一覧

### 日付タイトルの横 (Behinde Journal Title)

- 次のように、曜日や週番号が生成されます。プラグイン設定で、表示する内容を選択できます。

1. ![画像](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/assets/111847207/f47b8948-5e7a-4e16-a5ae-6966672742b1)

### 2行カレンダー (Journal Boundaries Calendar)

- 日誌や日付ページ、あるいは週次ジャーナルなどを開いているときに表示します。
- 前後の日付にアクセスできます。↑ ↓ で前後の週に切り替わります。
  > Shiftキーを押しながらクリックすると、サイドバーで開きます。
- 祝日かどうかが分かるようになっています。日付のページが存在するかどうかのインジケーター (・)もあります。

![image](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/assets/111847207/bf085523-89e7-4c2a-a7ef-9a260975bde8)

- 左の`5月`をクリックすると、`[[2024/05]]`というページが開きます。 >> 月次ジャーナル
- 右の`W19`をクリックすると、`[[2024/Q2/W19]]`というページが開きます。 >> 週次ジャーナル

### 週次ジャーナル (Weekly Journal)

- 週番号のリンクをクリックして開くと、ページが生成されます。一週間のふりかえりを容易にするためのしくみを提供します。

> [ドキュメントはこちら](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/%E9%80%B1%E6%AC%A1%E3%82%B8%E3%83%A3%E3%83%BC%E3%83%8A%E3%83%AB-(Weekly-Journal))

サンプル:

  ![image](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/assets/111847207/eb35708d-89e9-401d-a0b9-9ff8e49bb290)

1. 上のナビゲーションリンクによって、前後の週にアクセスできます。

### 月次ジャーナル (Monthly Journal)

- ミニカレンダーの左側にあるリンクをクリックすると`[[2023/10]]`のようなページが生成され、テンプレートが適用されます。

### 四半期ジャーナル (Quarterly Journal)

> 注: 週次ジャーナルのページタイトルのフォーマットが`yyyy/qqq/Www`に設定されている場合のみ有効です。
- 月次もしくは週次の階層リンクからアクセスしてください。ページが生成され、テンプレートが適用されます。

### 週番号などのスラッシュコマンド

> [ドキュメントはこちら](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/Slash-Command)

---

## はじめに

Logseq マーケットプレイスからインストール
  - 右上のツールバーで[`---`]を押して [`プラグイン`] を開きます。`マーケットプレイス` を選択します。検索フィールドに `Show` と入力し、検索結果から選択してインストールします。

   ![image](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/assets/111847207/6bd1d650-f3ce-4962-aa22-4cd3839d0466)

### 使用方法

- プラグイン設定から個別にカスタマイズが可能です。一部の機能はデフォルトではオフになっています。
- 初期設定
  1. プラグイン設定にて、週番号の計算方式を選択してください。
     - `USフォーマット (アメリカ式)`または`ISOフォーマット`のどちらかになります。
       > [週番号についてのドキュメントはこちら](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/%E9%80%B1%E7%95%AA%E5%8F%B7%E3%83%95%E3%82%A9%E3%83%BC%E3%83%9E%E3%83%83%E3%83%88%E3%81%AE%E9%81%B8%E6%8A%9E%E8%82%A2-(Japanese))

---

# ショーケース / 質問 / アイデア / ヘルプ

> [ディスカッション](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/discussions) タブに移動して、この種の情報を質問したり見つけたりできます。

- 関連
  1. 日付リンクに含まれる曜日を、日本語表記にする > [Flex date format プラグイン](https://github.com/YU000jp/logseq-plugin-flex-date-format)を利用してください。

## 貢献 / クレジット

1. スクリプト > [曜日と週番号を表示 - discuss.logseq.com](https://discuss.logseq.com/t/show-week-day-and-week-number/12685/18) @[danilofaria](https://discuss.logseq.com/u/danilofaria/), @[ottodevs](https://discuss.logseq.com/u/ottodevs/)
1. ライブラリ > [date-fns](https://date-fns.org/)
1. ライブラリ > [date-holidays](https://github.com/commenthol/date-holidays) 祝日のハイライト
1. ライブラリ > [@sethyuan/ logseq-l10n](https://github.com/sethyuan/logseq-l10n) 翻訳機能
1. アイコン > [@IonutNeagu - svgrepo.com](https://www.svgrepo.com/svg/490868/monday)
1. 製作者 > [@YU000jp](https://github.com/YU000jp)

<a href="https://www.buymeacoffee.com/yu000japan"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a pizza&emoji=🍕&slug=yu000japan&button_colour=FFDD00&font_colour=000000&font_family=Poppins&outline_colour=000000&coffee_colour=ffffff" /></a>
