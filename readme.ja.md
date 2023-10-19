[English](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number)

# Logseq プラグイン: *Show Weekday and Week-number* 曜日と週番号を表示する 📆

1. ジャーナルタイトルの横に曜日と週番号を表示します。
1. 日誌にそのリンクを持つミニカレンダーを表示します。前後の個別のジャーナルにアクセスしたり、週刊レビューと月刊レビューのページへのリンクが提供されます。

[![最新リリースバージョン](https://img.shields.io/github/v/release/YU000jp/logseq-plugin-show-weekday-and-week-number)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/releases)
[![ライセンス](https://img.shields.io/github/license/YU000jp/logseq-plugin-show-weekday-and-week-number?color=blue)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/LICENSE)
[![ダウンロード数](https://img.shields.io/github/downloads/YU000jp/logseq-plugin-show-weekday-and-week-number/total.svg)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/releases)
公開日 2023/05/26

---

## オプション

### ジャーナルタイトルの横へ ➡️

- その週の週番号が生成されます。以下のように

1. ![画像](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/assets/111847207/f47b8948-5e7a-4e16-a5ae-6966672742b1)
1. ![画像](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/assets/111847207/ee97c455-714e-45d2-9f9f-905798e298b4)

### ミニカレンダー 🗓️ (ジャーナルBoundaries)

- ジャーナルに2行のカレンダーを表示します。個別の日付ページや、ジャーナルで前後の日付にアクセスできます。

![ミニカレンダー](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/assets/111847207/3ffc5771-089f-43f5-83a5-01a01117670b)

### 週刊レビューのページ

- 週番号のリンクをクリックしてページを開きます。週番号が`[[2023-W25]]`のようなページにコンテンツがない場合、テンプレートが挿入されます。プラグインの設定でユーザーテンプレートを設定できます。
  > テンプレートに高度なクエリを挿入することで柔軟性が向上します。

#### "今週"セクション

- 日付リンクにブロックをつけると、各日付の参照にそのブロックが加わります。日誌にある"Linked References"のリストに載ります。

### 月刊レビューのページ🌛

- ミニカレンダーの左側のリンクをクリックすると`[[2023/10]]`のようなページが開きます。
> 現在、週刊ジャーナルのようなページ生成機能はありません。

### スラッシュコマンド 🆕

> 週番号などについての[ドキュメントはこちら](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/Slash-Command)

### ジャーナルリンク内の曜日のローカライズ

> 英語以外の言語向け。[柔軟な日付フォーマットプラグイン](https://github.com/YU000jp/logseq-plugin-flex-date-format)に分割 🆙

---

## はじめに

### Logseq マーケットプレイスからインストール

- 右上のツールバーで[`---`]を押して [`プラグイン`] を開きます。`マーケットプレイス` を選択します。検索フィールドに `Show` と入力し、検索結果から選択してインストールします。

   ![画像](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/assets/111847207/5c3a2b34-298b-4790-8e12-01d83e289794)

### 使用方法

- このプラグインをインストールすると、ジャーナルまたは個別のジャーナルページ、右側のサイドバーにスタイルが適用されます。まず、プラグインの設定を構成してください。
   1. 米国式またはISO形式のいずれかを選択します。
      > [ドキュメントはこちら](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/Week-number-format)

### プラグイン設定

> [ドキュメントはこちら](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/Plugin-Settings)

---

## 貢献

- [曜日と週番号を表示 - discuss.logseq.com](https://discuss.logseq.com/t/show-week-day-and-week-number/12685/18)
  - [danilofaria](https://discuss.logseq.com/u/danilofaria/)
  - [ottodevs](https://discuss.logseq.com/u/ottodevs/)

## 関連

- [柔軟な日付フォーマットプラグイン](https://github.com/YU000jp/logseq-plugin-flex-date-format)

# ショーケース / 質問 / アイデア / ヘルプ

> [ディスカッション](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/discussions) タブに移動して、この種の情報を質問したり見つけたりできます。

## 作者

- GitHub: [YU000jp](https://github.com/YU000jp)

## 関連情報とクレジット

### ライブラリ

- [@logseq/libs](https://logseq.github.io/plugins/)
- [logseq-L10N](https://github.com/sethyuan/logseq-l10n)
- [date-fns](https://date-fns.org/)

### アイコン

- [IonutNeagu - svgrepo.com](https://www.svgrepo.com/svg/490868/monday)

---

<a href="https://www.buymeacoffee.com/yu000japan" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png" alt="🍌コーヒーをご馳走してください!" style="height: 42px;width: 152px"></a>
