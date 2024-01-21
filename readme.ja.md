[English](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number)

# Logseq プラグイン: *Show weekday and week-number* 📆

1. 日付タイトルの横に、曜日と週番号を表示します。
1. 日誌にそのリンクを持つミニカレンダーを表示します。前後の日付にアクセスしたり、週刊レビューと月刊レビューのページへのリンクが提供されます。

[![最新リリースバージョン](https://img.shields.io/github/v/release/YU000jp/logseq-plugin-show-weekday-and-week-number)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/releases)
[![ライセンス](https://img.shields.io/github/license/YU000jp/logseq-plugin-show-weekday-and-week-number?color=blue)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/LICENSE)
[![ダウンロード数](https://img.shields.io/github/downloads/YU000jp/logseq-plugin-show-weekday-and-week-number/total.svg)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/releases)
公開日 2023/05/26

---

## オプション

### 日付タイトルの隣へ

- その週の週番号が生成されます。以下のように

1. ![画像](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/assets/111847207/f47b8948-5e7a-4e16-a5ae-6966672742b1)
1. ![画像](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/assets/111847207/ee97c455-714e-45d2-9f9f-905798e298b4)

### ミニカレンダー 🗓️

- 日誌や日付ページ、あるいは週間レビューのページに、2行のカレンダーを表示します。前後の日付にすぐにアクセスできます。Shiftキーを押しながらクリックすると、サイドバーで開きます。
  > 祝日のハイライト機能あり🆕

![README用](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/assets/111847207/114708ab-0389-4c46-b962-00cb25e2070a)

### 週刊レビューのページ

- 週番号のリンクをクリックすると、`[[2023-W25]]`というようなページが開きます。そのページにコンテンツがない場合、テンプレートが挿入されます。プラグイン設定でユーザーテンプレートを設定できます。
  > テンプレートに高度なクエリを挿入することで柔軟性が向上します。

#### "今週"セクション

- 日付リンクにブロックをつけると、各日付の参照にそのブロックが加わります。日誌にある"Linked References"のリストに載ります。

### 月刊レビューのページ 🌛

- ミニカレンダーの左側にあるリンクをクリックすると`[[2023/10]]`のようなページが開きます。
> 現在、週刊レビューのようなページ生成機能はありません。

### スラッシュコマンド

> 週番号のリンクなど。[ドキュメントはこちら](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/Slash-Command)

---

## はじめに

Logseq マーケットプレイスからインストール
  - 右上のツールバーで[`---`]を押して [`プラグイン`] を開きます。`マーケットプレイス` を選択します。検索フィールドに `Show` と入力し、検索結果から選択してインストールします。

   ![画像](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/assets/111847207/5c3a2b34-298b-4790-8e12-01d83e289794)

### 使用方法

- ミニカレンダーなどを試してから、プラグイン設定から、項目の変更をおこなってください。
   1. 週番号は、米国式またはISO形式のいずれかを選択します。
      > [ドキュメントはこちら](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/%E9%80%B1%E7%95%AA%E5%8F%B7%E3%83%95%E3%82%A9%E3%83%BC%E3%83%9E%E3%83%83%E3%83%88%E3%81%AE%E9%81%B8%E6%8A%9E%E8%82%A2-(Japanese))

### プラグイン設定

> [ドキュメントはこちら (英語)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/Plugin-Settings)

---

# ショーケース / 質問 / アイデア / ヘルプ

> [ディスカッション](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/discussions) タブに移動して、この種の情報を質問したり見つけたりできます。

- 関連
  1. 日付リンクに含まれる曜日を、日本語表記にする > [Flex date format プラグイン](https://github.com/YU000jp/logseq-plugin-flex-date-format)を利用してください。

## 貢献 / クレジット

1. スクリプト > [曜日と週番号を表示 - discuss.logseq.com](https://discuss.logseq.com/t/show-week-day-and-week-number/12685/18) @[danilofaria](https://discuss.logseq.com/u/danilofaria/), @[ottodevs](https://discuss.logseq.com/u/ottodevs/)
1. ライブラリ > [date-fns](https://date-fns.org/)
1. ライブラリ > [date-holidays](https://github.com/commenthol/date-holidays)
1. アイコン > [@IonutNeagu - svgrepo.com](https://www.svgrepo.com/svg/490868/monday)
1. 製作者 > [@YU000jp](https://github.com/YU000jp)

<a href="https://www.buymeacoffee.com/yu000japan"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a pizza&emoji=🍕&slug=yu000japan&button_colour=FFDD00&font_colour=000000&font_family=Poppins&outline_colour=000000&coffee_colour=ffffff" /></a>
