# Logseq Plugin: *Show weekday and week-number* 📆

Make your Logseq journals smarter with weekdays, week numbers, and powerful calendar features!

> [!NOTE]
> - When using the Logseq DB model, only the two-line calendar and monthly calendar are functional. [#166](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/issues/166)

<div align="right">

[English](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/)/[日本語](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/blob/main/readme.ja.md)  [![Latest Release](https://img.shields.io/github/v/release/YU000jp/logseq-plugin-show-weekday-and-week-number)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/releases)  [![License](https://img.shields.io/github/license/YU000jp/logseq-plugin-show-weekday-and-week-number?color=blue)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/LICENSE)  [![Downloads](https://img.shields.io/github/downloads/YU000jp/logseq-plugin-show-weekday-and-week-number/total.svg)](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/releases)  

</div>

---

## 🎯 Features
- Multi-language support.
- Holiday highlighting.  
  > Powered by the [date-holidays](https://github.com/commenthol/date-holidays) library, supporting various countries worldwide.
- External ICS (`*.ics`) integration. 🆕
  > Import schedules from Google Calendar and others. Note: Google Calendar's TODO list does not provide ICS files.

### Daily Journal Enhancements
- Display weekday and week numbers next to journal dates.  
  Example:  
  ![Daily Journal Example](https://github.com/user-attachments/assets/d448da22-7316-41ab-af35-675d5a839950)

### Calendar Features
- Navigate between previous and next journal entries.
- **Two-line Mini Calendar**: Compact calendar with quick navigation and one-click journal access.  
  Example:  
  ![Mini Calendar Example](https://github.com/user-attachments/assets/fcf15e0b-c890-402a-91b4-af543640f047)
- **Monthly Calendar** in left sidebar: Highlights holidays and journal entries.  
  Example:  
  ![Monthly Calendar Example](https://github.com/user-attachments/assets/09366e6d-462d-4bee-ba89-0131bc389d6f)

### Extended Journal Features
- **Weekly Journal**: 
  See [Weekly Journal Documentation](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/Weekly-Journal).  
  Example:  
  ![Weekly Journal Example](https://github.com/user-attachments/assets/681ca83e-8295-4062-9e17-ec90ecee52e9)
- **Monthly Journal**: Generate pages like `[[2023/10]]` with the template.  
- **Quarterly/Yearly Journals**: Hierarchical links from Monthly or Weekly Journals.  

### Customization Options
- Flexible settings for weekday and week number displays.
- Slash commands for quick week number insertion.  
  See [Slash Command Documentation](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/Slash-Command).

---

## 🚀 Getting Started

### Installation
1. Open Logseq.
2. Go to Marketplace (click `...` in the top-right corner).
3. Search for "Show weekday" and click Install.

### Initial Setup
1. Open plugin settings.
2. Choose your week number format:  
   - `US format`: Weeks start on Sunday.  
   - `ISO format`: Weeks start on Monday.  
   See [Week Number Format Documentation](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/wiki/Week-number-format).  
3. Enable or disable features as needed.  

---

## 💡 Additional Resources

- **Discussions**: Share ideas or ask questions in the [Discussions Tab](https://github.com/YU000jp/logseq-plugin-show-weekday-and-week-number/discussions).  
- **Related Plugins**:  
  - [Flexible Date Format Plugin](https://github.com/YU000jp/logseq-plugin-flex-date-format)  
  - [Default Template Plugin](https://github.com/YU000jp/logseq-plugin-default-template)  

---

## 🛠️ Contribution & Credits

- **Script Contributors**:  
  - [danilofaria](https://discuss.logseq.com/u/danilofaria/)  
  - [ottodevs](https://discuss.logseq.com/u/ottodevs/) 
  > [Show week day and week number - discuss.logseq.com](https://discuss.logseq.com/t/show-week-day-and-week-number/12685/18) 
- **Libraries Used**:  
  - [date-fns](https://date-fns.org/)  
  - [date-holidays](https://github.com/commenthol/date-holidays)  
  - [@6tail/lunar-typescript](https://github.com/6tail/lunar-typescript)  
  - @sethyuan/logseq-l10n 
- **Icons**: [IonutNeagu - svgrepo.com](https://www.svgrepo.com/svg/490868/monday)  
- **Author**: [YU000jp](https://github.com/YU000jp)  

---
