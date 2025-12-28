# Logseq Plugin: *Show weekday and week-number* 📆

Make your Logseq journals smarter with weekdays, week numbers, and powerful calendar features!

> [!NOTE]
> - Works with Logseq v0.10.x (File system model)
> - Only two-line and monthly calendars are supported in the Logseq db model. The others are not supported. Please note that due to the constraints of the Logseq API, date formats such as “yyyy/MM/dd” cannot be used as they are automatically converted into a library format. [#166](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/issues/166)

<div align="right">

[English](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/)/[日本語](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/blob/main/readme.ja.md) [![latest release version](https://img.shields.io/github/v/release/YU000jp/logseq-plugin-show-weekday-and-week-number)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/releases)[![License](https://img.shields.io/github/license/YU000jp/logseq-plugin-show-weekday-and-week-number?color=blue)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/LICENSE)
[![Downloads](https://img.shields.io/github/downloads/YU000jp/logseq-plugin-show-weekday-and-week-number/total.svg)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/releases) Published 20230526
</div>

## 🎯 What This Plugin Does

### 1️⃣ Enhanced Daily Journals
- The weekday and week number are displayed next to the date. The display content is fully customizable to suit your preferences.

### 2️⃣ Smart Calendar Features
- **Compact 2-line Calendar**
   - Quick week navigation using ↑/↓ buttons
   - One-click access to monthly/weekly journals
- **Monthly Calendar** (left sidebar) 🆕
   - Highlights holidays
   - Shows which dates have journal entries

### 📖 Extended Journal Features
- **Weekly/Monthly/Quarterly/Yearly Journals** with automatic template application
- **Navigation Breadcrumb** for easy journal access 🆕

### 🛠️ Customizable Display Options
- Flexible configuration for weekday and week number displays
- Slash commands for quick week number insertion
   > [Details here](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/Slash-Command)

---

### 📌 Detailed Feature Descriptions

#### Daily Journal Details
- Display weekday and week numbers beside date titles
- Example:

  > <img width="519" height="127" alt="image" src="https://github.com/user-attachments/assets/d448da22-7316-41ab-af35-675d5a839950" />


### Journal Boundaries Calendar 🗓️

- Smooth access to previous and subsequent dates on a single date page or journals, Weekly Journal.
  1. Show indicator (line) of journal entries
  1. Highlight holidays for the country
     > Show Lunar-calendar date for Chinese

1. **Two lines mini-Calendar**

   > <img width="426" height="113" alt="image" src="https://github.com/user-attachments/assets/fcf15e0b-c890-402a-91b4-af543640f047" />


 1. **Monthly Calendar** in left sidebar

    > <img width="220" height="524" alt="image" src="https://github.com/user-attachments/assets/09366e6d-462d-4bee-ba89-0131bc389d6f" />

### Breadcrumb of Journal Links

- Use the navigation links at the top of the page to access other journals.
1. Weekly Journal:

   > ![image](https://github.com/user-attachments/assets/681ca83e-8295-4062-9e17-ec90ecee52e9)

### Weekly Journal

- Click the week number link to open it and generate a page. Provide automation to facilitate retrospectives. Using a weekly journal can help you reflect on your week.
> [Document here](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/Weekly-Journal)

Sample:

  ![image](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/assets/111847207/7c6be831-683d-454f-9950-153e5828fa48)

### Monthly Journal

- Click the link on the left side of the mini calendar to generate a page like `[[2023/10]]` and apply the template.

### Quarterly Journal / Yearly Journal

> Note: Quartely Journal is only valid if the page title format for Weekly Journal is set to `yyyy/qqq/Www` or `yyyy-qqq-Www`.
- Access from the hierarchical link of the Monthly or Weekly journal. The page will be generated and the template will be applied.

### Slash Command for week-number

> [Document here](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/Slash-Command)

---

## 🚀 How to Get Started

### 1. Installation
1. Open Logseq
2. Open Marketplace (click [...] in top-right)
3. Search for "Show weekday"
4. Click Install

### 2. Initial Setup (Important)
1. Open plugin settings
2. **Choose your week number format**:
   - `US format`: Weeks start on Sunday
   - `ISO format`: Weeks start on Monday
   > [Document here](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/Week-number-format)

3. Enable/disable features as needed
   - All settings can be changed later
   - Display format is fully customizable

---

## Showcase / Questions / Ideas / Help

> Go to the [Discussions](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/discussions) tab to ask and find this kind of things.

- Relation
  1. Localize day of the week in journal links > For languages other than English. Split to [Flexible date format plugin](https://github.com/YU000jp/logseq-plugin-flex-date-format)
  1. The journal template is not applied when opening an old date single page
     > Use the 'Completion of journal template' feature in [Default Template plugin](https://github.com/YU000jp/logseq-plugin-default-template).

## Contribution / Prior art / Credit

- Script > [Show week day and week number - discuss.logseq.com](https://discuss.logseq.com/t/show-week-day-and-week-number/12685/18) @[danilofaria](https://discuss.logseq.com/u/danilofaria/), @[ottodevs](https://discuss.logseq.com/u/ottodevs/)
- Library > [date-fns](https://date-fns.org/)
- LIbrary > [date-holidays](https://github.com/commenthol/date-holidays)
   > Highlighting holidays is now possible thanks to this library.
- Library > [@6tail/ lunar-typescript](https://github.com/6tail/lunar-typescript) for Chinese Lunar
- Library > [@sethyuan/ logseq-l10n](https://github.com/sethyuan/logseq-l10n) for translation
- Icon > [IonutNeagu - svgrepo.com](https://www.svgrepo.com/svg/490868/monday)
- Author > @[YU000jp](https://github.com/YU000jp)
