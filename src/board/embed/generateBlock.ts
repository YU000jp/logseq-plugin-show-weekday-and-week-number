import { BlockEntity, IBatchBlock, PageEntity } from "@logseq/libs/dist/LSPlugin"
import { addDays, differenceInDays, format, formatDate, isSameMonth, isSaturday, isSunday, isToday, subDays } from "date-fns"
import { t } from "logseq-l10n"
import { getConfigPreferredDateFormat } from "../.."
import { getHolidays } from "../../lib/holidays"
import { clearBlocks, getRelativeDateString, getWeeklyNumberFromDate, getWeeklyNumberString, getWeekStartFromWeekNumber, getWeekStartOn, hideElementBySelector, localizeDate } from '../../lib/lib'
import { getPageBlocks, isPageFileExist } from "../../lib/query/advancedQuery"
import { SettingKeys } from "../../settings/SettingKeys"
import { mainPageTitle, mainPageTitleLower } from "../constant"
import { dayTemplates, pageTemplate } from "./dayTemplates"



// ブロックの生成処理中かどうか
let processingGenerateEmbed = false

let processingGeneratePageContent = false

// ブロックを生成 (メインページのコンテンツを生成)
export const generateEmbed = async (
  type: string,
  pageName: string,
) => {
  if (processingGenerateEmbed) return
  processingGenerateEmbed = true
  setTimeout(() => processingGenerateEmbed = false, 900)

  // ページのリフレッシュとブロックの生成
  refreshPageBlocks(pageName, type)

  processingGenerateEmbed = false
}


// ページのブロックをリフレッシュ
const refreshPageBlocks = async (
  pageName: string,
  type: string,
) => {

  // 一時的にDOMエレメントを非表示にする
  hideElementBySelector(`#main-content-container div[id="${mainPageTitleLower}"]`)

  // 全てのブロックを削除
  const blocksUuid = await getPageBlocks(pageName) as { uuid: PageEntity["uuid"] }[] | null
  if (blocksUuid && blocksUuid.length > 0)
    await clearBlocks(blocksUuid)

  // batchが存在する場合のみ
  await new Promise((resolve) => setTimeout(resolve, 10))// 60ms待機
  // メインページの最初のブロックを作成
  const newBlock = await logseq.Editor.appendBlockInPage(pageName, "") as { uuid: BlockEntity["uuid"] } | null
  if (newBlock)
    await generateContentForMainPageContent(newBlock.uuid, type)
}


const getWeeklyPageName = (date: Date, weekStartsOn: 0 | 1) => {
  const { year, weekString, quarter } = getWeeklyNumberFromDate(date, weekStartsOn)
  return getWeeklyNumberString(year, weekString, quarter)
}


// メインページのコンテンツを生成
const generateContentForMainPageContent = async (
  newBlockUuid: BlockEntity["uuid"],
  type: string,
  today: Date = new Date()
) => {

  if (processingGeneratePageContent) return
  processingGeneratePageContent = true
  setTimeout(() => processingGeneratePageContent = false, 1500)

  // キャッシュを使う
  if (logseq.settings![`cashBatch-${type}-reloadFlag`] === false // リロードボタンや設定変更時はフラグをオンにする
    && logseq.settings![`cashBatch-${type}-date`] === format(today, "yyyy-MM-dd") // 日付の一致
    && logseq.settings![`cashBatch-${type}`] !== null
    && (logseq.settings![`cashBatch-${type}`] as IBatchBlock[]).length > 0) { // キャッシュが存在するかどうか
    await logseq.Editor.insertBatchBlock(newBlockUuid, logseq.settings![`cashBatch-${type}`] as IBatchBlock[], { before: true, sibling: true })
  } else {


    const preferredDateFormat = await getConfigPreferredDateFormat()

    let weekStartsOn = getWeekStartOn()
    if (weekStartsOn === 6)
      weekStartsOn = 0 //日曜始まりに変更
    const isIso = logseq.settings![SettingKeys.weekNumberFormat] !== "US format"

    // switch (type.toLowerCase()) {
    //   case "journal": //前後2日間の日記を表示するモード

    // console.log("type", type)

    const { year, weekString, quarter } = getWeeklyNumberFromDate(today, weekStartsOn)
    const month = format(today, "MM")
    const startOfWeek = getWeekStartFromWeekNumber(year, Number(weekString), weekStartsOn, isIso)


    const weeklyPageName = getWeeklyNumberString(year, weekString, quarter)
    const monthlyPageName = `${logseq.settings![SettingKeys.weekNumberOptions] === "YYYY-Www" ? `${year}-${month}`
      : `${year}/${month}`}`
    const quarterlyPageName = `${logseq.settings![SettingKeys.weekNumberOptions] === "YYYY-qqq-Www" ? `${year}-Q${quarter}`
      : `${year}/Q${quarter}`}`
    const yearlyPageName = `${year}`

    // 月曜日を基準にした3週間分の日付配列を生成
    const dateArray = Array.from({ length: 21 }, (_, i) => i - 7) // -7から13までの配列（3週間分）
    const dayOfWeekFirstDate = addDays(startOfWeek, dateArray[0])
    const dayOfWeekLastDate = addDays(startOfWeek, dateArray[dateArray.length - 1])

    const batch: IBatchBlock[] = []
    // batchの先頭に追加
    batch.unshift(
      ...(logseq.settings![SettingKeys.showMemo] !== "false" ? [{
        content: logseq.settings![SettingKeys.showMemoPageName] === "new page" ? `{{embed [[${mainPageTitle}/Memo]]}}` : "{{embed [[Contents]]}}",
        ...(logseq.settings![SettingKeys.showMemo] === "collapsed" ? { properties: { collapsed: true } } : {}),
      }] : []),
      {
        content: `{{embed [[${format(today, preferredDateFormat)}]]}}`, //今日のジャーナルページ
      },
      {
        content: `{{embed [[${weeklyPageName}]]}}` //週番号のページ
      },
    )

    setTimeout(async () => {
      // 週番号ページのファイルが存在するかどうかチェックし、ページが存在しなかったらテンプレートを挿入する
      await checkAndPageTemplate(weeklyPageName, logseq.settings![SettingKeys.weeklyJournalTemplateName] as string | undefined)
    }, 50)

    if (logseq.settings![SettingKeys.show7days] as string !== "false") {
      // const weekFirstDate = getWeekStartFromWeekNumber(year, Number(weekString), weekStartsOn, isIso ? true : false) as Date
      let children: IBatchBlock[] = []
      // weekFirstDateを0として、dateArrayの数値に基づいて日付のembedを生成
      //dateArrayを逆順にする
      const weekMap: { [key: string]: IBatchBlock[] } = {}
      const weekDateRanges: { [key: string]: string } = {} // 週ごとの日付範囲を格納する変数

      const contentCheckTarget: { [key: string]: string[] } = {} // ページコンテンツの存在チェックをおこなうリスト用

      // 今週の週番号を事前に計算
      const currentWeek = `${year}-W${weekString}`

      // 各週の日付範囲を事前に計算
      for (let i = dateArray.length - 1; i >= 0; i--) {
        const num = dateArray[i]
        const date = addDays(startOfWeek, num)
        const { year: weekYear, weekString: weekStr } = getWeeklyNumberFromDate(date, weekStartsOn)
        const weekKey = `${weekYear}-W${weekStr}`

        if (!weekDateRanges[weekKey]) {
          const weekStart = getWeekStartFromWeekNumber(weekYear, Number(weekStr), weekStartsOn, isIso)
          const weekEnd = addDays(weekStart, 6)
          weekDateRanges[weekKey] = `${localizeDate(weekStart, { month: "long", day: "numeric" })} – ${localizeDate(weekEnd, { day: "numeric", ...(isSameMonth(weekStart, weekEnd) ? {} : { month: "long" }) })}`
        }
      }

      for (let i = dateArray.length - 1; i >= 0; i--) {
        const num = dateArray[i]
        const date = addDays(startOfWeek, num)
        const { year, weekString } = getWeeklyNumberFromDate(date, weekStartsOn)
        const weekKey = `${year}-W${weekString}`

        if (!weekMap[weekKey])
          weekMap[weekKey] = []

        const dateFormatString: string = formatDate(date, preferredDateFormat) //日付をフォーマットする
        const dayOfWeekKey = date.getDay().toString()
        if (!contentCheckTarget[dayOfWeekKey])
          contentCheckTarget[dayOfWeekKey] = []
        contentCheckTarget[dayOfWeekKey].push(dateFormatString) //曜日をキーとして日付を追加
        const dayOfWeek = localizeDate(date, { weekday: "long" }) //曜日を取得
        const relativeDate = getRelativeDateString(date, today) //相対日付を取得
        const holiday = await getHolidays(date) //祝日を取得

        const isCurrentDay = isToday(date) // 今日かどうか

        const block: IBatchBlock = {
          content: `#### ${dayOfWeek}${holiday ? ` : **${holiday}**` : ""}${isCurrentDay ? "" : ` (${relativeDate})`}`,
        }

        // 土曜日か日曜日の場合は背景色を変更
        if (isSaturday(date) || isSunday(date))
          block.properties = { "background-color": isSaturday(date) ? "blue" : "red" }

        // 今日の場合は背景色を変更
        if (isCurrentDay)
          block.children = [{
            content: `### ${relativeDate}`,
            properties: { "background-color": "green" }
          }]
        else {
          if (logseq.settings![SettingKeys.show7daysNotExist] as string === "Nothing (embed)")
            block.children = [{ content: `{{embed [[${dateFormatString}]]}}` }]
          else
            if (logseq.settings![SettingKeys.show7daysNotExist] as string === "Put those links") {
              if (await isPageFileExist(dateFormatString))
                block.children = [{ content: `{{embed [[${dateFormatString}]]}}` }]
              else
                block.children = [{ content: `[[${dateFormatString}]]` }]
            }
        }
        weekMap[weekKey].push(block)
      }

      // 週のブロックを追加
      Object.keys(weekMap).forEach((weekKey) => {
        // 「yyyy-Www」ではなく ${t("Week")} ww の形式で表示したい。つまり、先頭6文字を削除する。ただし、W53の場合は yyyy-W53と表示したい
        const weekNumber = `${weekKey.slice(0, 6) === "W53" ? `${t("Week")} ${weekKey.slice(6)} (${weekKey.slice(0, 4)})` : `${t("Week")} ${weekKey.slice(6)}`}`
        children.push({
          content: `### ${weekNumber}\n${weekDateRanges[weekKey]}`,
          children: weekMap[weekKey],
          ...((weekKey !== currentWeek) ? { properties: { collapsed: true } } : {})
        })
      })

      // 月、四半期、年のブロックを追加
      children.push(
        {
          content: `#### ${t("Monthly")}`,
          children: [
            {
              content: `{{embed [[${monthlyPageName}]]}}`,
              ...(logseq.settings![SettingKeys.booleanWeeklyDeskMonthly] ? { properties: { collapsed: true } } : {}),
            },
          ],
        },
        ...(logseq.settings![SettingKeys.weekNumberOptions] === "YYYY/qqq/Www" || logseq.settings![SettingKeys.weekNumberOptions] === "YYYY-qqq-Www" ? [{
          content: `#### ${t("Quarterly")}`,
          children: [
            {
              content: `{{embed [[${quarterlyPageName}]]}}`,
              ...(logseq.settings![SettingKeys.booleanWeeklyDeskQuarterly] ? { properties: { collapsed: true } } : {}),
            }
          ],
        }] : []),
        {
          content: `#### ${t("Yearly")}`,
          children: [
            {
              content: `{{embed [[${yearlyPageName}]]}}`,
              ...(logseq.settings![SettingKeys.booleanWeeklyDeskYearly] ? { properties: { collapsed: true } } : {}),
            }
          ],
        },
      )

      setTimeout(async () => {
        // 年ページのファイルが存在するかどうかチェックし、ページが存在しなかったらテンプレートを挿入する
        await checkAndPageTemplate(yearlyPageName, logseq.settings![SettingKeys.yearlyJournalTemplateName] as string | undefined)
        // 月ページのファイルが存在するかどうかチェックし、ページが存在しなかったらテンプレートを挿入する
        await checkAndPageTemplate(monthlyPageName, logseq.settings![SettingKeys.monthlyJournalTemplateName] as string | undefined)
        // 四半期ページのファイルが存在するかどうかチェックし、ページが存在しなかったらテンプレートを挿入する
        await checkAndPageTemplate(quarterlyPageName, logseq.settings![SettingKeys.quarterlyJournalTemplateName] as string | undefined)
      }, 300)

      // batchの先頭に追加 
      batch.unshift({
        content: `${t("Calendar")}`,
        children,
        ...(logseq.settings![SettingKeys.show7days] === "collapsed" ? { properties: { collapsed: true } } : {}),
      })


      // ユーザー設定で、テンプレートを挿入する設定になっているときのみ
      if (logseq.settings![SettingKeys.show7daysNotExist] as string === "Insert template (embed)")
        dayTemplates(contentCheckTarget)

    } // end_if


    // バッチを挿入
    await logseq.Editor.insertBatchBlock(newBlockUuid, batch, { before: true, sibling: true })


    // バッチの2つ目を生成
    const dayOfWeekFirst = localizeDate(dayOfWeekFirstDate, { month: "long", day: "numeric" })
    const flagSameMonth = isSameMonth(dayOfWeekFirstDate, dayOfWeekLastDate)
    const dayOfWeekLast = localizeDate(dayOfWeekLastDate, { day: "numeric", ...(flagSameMonth ? {} : { month: "long" }) })
    const batchSecondary = await batchSecond(
      today,
      dayOfWeekFirstDate,
      dayOfWeekLastDate,
      `📆 ${dayOfWeekFirst} – ${dayOfWeekLast}`,
      dateArray,
      preferredDateFormat,
      weeklyPageName,
      newBlockUuid,
      startOfWeek,
      weekStartsOn,
      monthlyPageName,
      quarterlyPageName,
      yearlyPageName,
      flagSameMonth ? null : dayOfWeekLastDate
    )

    if (batchSecondary.length > 0) batch.push(...batchSecondary)

    setTimeout(() => {
      //その日のbatchをキャッシュとして保存
      logseq.updateSettings({
        [`cashBatch-${type}`]: batch,
        [`cashBatch-${type}-date`]: format(today, "yyyy-MM-dd"),
        [`cashBatch-${type}-reloadFlag`]: false,
      })
    }, 3000)
  }

  // ブロックを削除
  await logseq.Editor.removeBlock(newBlockUuid)

  // ブロックの編集モードを終了
  setTimeout(() => {
    logseq.Editor.exitEditingMode(false)
  }, 50)

}// end_generateContentForMainPageContent



// バッチの2つ目を生成
const batchSecond = async (
  today: Date,
  dayOfWeekFirstDate: Date,
  dayOfWeekLastDate: Date,
  stringDateRange: string,
  dateArray: number[],
  preferredDateFormat: string,
  weeklyPageName: string,
  newBlockUuid: string,
  startOfWeek: Date,
  weekStartsOn: 0 | 1,
  monthlyPageName: string,
  quarterlyPageName: string,
  yearlyPageName: string,
  lastDateWhenincludeNextMonth: Date | null
) => {
  let batch: IBatchBlock[] = []

  // 0.5秒間待機
  await new Promise(resolve => setTimeout(resolve, 500))

  // SCHEDULEDのブロックを追加
  if (logseq.settings![SettingKeys.showTasks] as string !== "false") {

    // 今日の日付と比較して相対的な日付を求める (-14dのような形式にする)
    const relativeDays = differenceInDays(today, dayOfWeekFirstDate) as number
    const relativeDaysLast = differenceInDays(today, dayOfWeekLastDate) as number

    // dateArrayの日付リストを使って、SCHEDULEDのクエリーを設置
    batch.push({
      content: `## ${t("Tasks")}`,
      ...(logseq.settings![SettingKeys.showTasks] === "collapsed" ? { properties: { collapsed: true } } : {}),
      children: [
        // 今日のタスク
        {
          content: `
#+BEGIN_QUERY
  {:title [[:h3 "Today's tasks"] ["${localizeDate(today, { month: "long", day: "numeric" })}"]]
    :query [
        :find (pull ?b [*])
        :in $ ?today
        :where
          [?p :block/journal-day ?today]
          [?b :block/page ?p]
          [?b :block/marker ?marker]
          [(contains? #{"TODO" "NOW" "DOING"} ?marker)]
    ]
  :inputs [:today]
  :result-transform (fn [result] (sort-by (fn [r] (get r :block/marker)) result))
  :table-view? false
  :breadcrumb-show? false
  :collapsed? ${logseq.settings![SettingKeys.showTodayTasks] === "collapsed" ? "true" : "false"}
  }
#+END_QUERY
              `,
        },
        // スケジュール
        {
          content: `
#+BEGIN_QUERY
  {:title [[:h3 "Scheduled"] ["${stringDateRange}"]] 
    :query [
        :find (pull ?b [*])
        :in $ ?start ?next
        :where
            [?b :block/scheduled ?d]
            [(>= ?d ?start)]
            [(<= ?d ?next)]
      ]
  :result-transform (fn [result] (sort-by (fn [d] (get d :block/scheduled) ) result))
  :inputs [:${relativeDays}d :${relativeDaysLast}d]
  :table-view? false
  :breadcrumb-show? false
    :collapsed? ${logseq.settings![SettingKeys.showScheduledTasks] === "collapsed" ? "true" : "false"}
  }
#+END_QUERY
              `,
        },
        // 締め切り
        {
          content: `
        #+BEGIN_QUERY
          {:title [[:h3 "Deadline"] ["${stringDateRange}"]] 
            :query [
                :find (pull ?b [*])
                :in $ ?start ?next
                :where
                    [?b :block/deadline ?d]
                    [(>= ?d ?start)]
                    [(<= ?d ?next)]
              ]
          :result-transform (fn [result] (sort-by (fn [d] (get d :block/scheduled) ) result))
          :inputs [:${relativeDays}d :${relativeDaysLast}d]
          :table-view? false
          :breadcrumb-show? false
            :collapsed? ${logseq.settings![SettingKeys.showScheduledTasks] === "collapsed" ? "true" : "false"}
          }
        #+END_QUERY
                      `,
        },
        // 未計画のTODO
        {
          content: `
#+BEGIN_QUERY
  {:title [[:h3 "☑ Unplanned"] ["${stringDateRange}"]]
    :query [
        :find (pull ?b [*])
        :in $ ?start ?next
        :where
          [?p :block/journal-day ?d]
          [(< ?d ?start)]
          [(> ?d ?next)]
          [?b :block/page ?p]
          [?b :block/marker "TODO"]
          (not [?b :block/scheduled _])
    ]
  :result-transform (fn [result] (sort-by (fn [r] (get-in r [:block/page :block/journal-day])) result))
  :inputs [:${relativeDays}d :${relativeDaysLast}d]
  :table-view? false
  :breadcrumb-show? false
  :collapsed? ${logseq.settings![SettingKeys.showUnplannedTasks] === "collapsed" ? "true" : "false"}
  }
#+END_QUERY
              `,
        }
      ]
    })
  } // end_if


  if (logseq.settings!.showLinkedReferences as string !== "false")
    buildQuery(startOfWeek, weekStartsOn, dateArray, today, preferredDateFormat, weeklyPageName, monthlyPageName, quarterlyPageName, lastDateWhenincludeNextMonth, batch, stringDateRange)


  // バッチを挿入
  await logseq.Editor.insertBatchBlock(newBlockUuid, batch, { before: true, sibling: true })
  return batch
}


// ページが存在しなかったらテンプレートを挿入する
const checkAndPageTemplate = async (pageName: string, templateName: string | undefined) => {
  if (!templateName) return
  const isExist = await isPageFileExist(pageName) as boolean
  if (isExist === false) { // ページが存在しなかったらテンプレートを挿入する
    const result = await pageTemplate(templateName, pageName) as boolean
    // ユーザー通知
    if (result) {
      //  ページが存在しなかったので、テンプレートを適用します。
      logseq.UI.showMsg(t("Page does not exist. Apply template."), "info", { timeout: 3000 })
    } else
      // テンプレートを適用できませんでした。
      logseq.UI.showMsg(t("Failed to apply template."), "warning", { timeout: 3000 })
  }
}

const buildQuery = (startOfWeek: Date, weekStartsOn: 0 | 1, dateArray: number[], today: Date, preferredDateFormat: string, weeklyPageName: string, monthlyPageName: string, quarterlyPageName: string, lastDateWhenincludeNextMonth: Date | null, batch: IBatchBlock[], stringDateRange: string) => {
  const weeklyPageNameBefore = getWeeklyPageName(subDays(startOfWeek, 7), weekStartsOn)
  const weeklyPageNameAfter = getWeeklyPageName(addDays(startOfWeek, 7), weekStartsOn)

  // weekNumberFormatに基づく週番号フォーマットの種類
  const userWeekNumberOptions = logseq.settings![SettingKeys.weekNumberOptions] as string
  // 四半期のフォーマットを使用するかどうか
  const flagUseQuarterly = userWeekNumberOptions === "YYYY/qqq/Www" || userWeekNumberOptions === "YYYY-qqq-Www"
  // 区切り文字
  const separator = userWeekNumberOptions.includes("/") ? "/" : "-"

  // 日付参照の生成
  const dateReferences = dateArray
    .map(num => `"${formatDate(addDays(today, num), preferredDateFormat)}"`)
    .join(" ")

  // ページ参照の生成
  const pageReferences = [
    `"${weeklyPageNameBefore}"`,
    `"${weeklyPageName}"`,
    `"${weeklyPageNameAfter}"`,
    `"${monthlyPageName}"`,
    ...(flagUseQuarterly ? [
      `"${quarterlyPageName}"`
    ] : []),
    // `"[[${yearlyPageName}]]"`,
    // 次の月が含まれている場合の追加参照
    ...(lastDateWhenincludeNextMonth ? (() => {
      const nextMonthYear = format(lastDateWhenincludeNextMonth, 'yyyy')
      const nextMonthMonth = format(lastDateWhenincludeNextMonth, 'MM')
      const nextMonthQuarter = getWeeklyNumberFromDate(lastDateWhenincludeNextMonth, 0).quarter
      const currentQuarter = getWeeklyNumberFromDate(today, 0).quarter
      //const currentYear = format(today, 'yyyy')

      return [
        // 月の参照
        ...(separator === "-" ? [
          `"${nextMonthYear}-${nextMonthMonth}"`
        ] : [
          `"${nextMonthYear}/${nextMonthMonth}"`
        ]),
        // 四半期の参照（flagUseQuarterlyがtrueの場合のみ、かつ異なる場合）
        ...(flagUseQuarterly && nextMonthQuarter !== currentQuarter ? (
          separator === "-" ? [
            `"${nextMonthYear}-Q${nextMonthQuarter}"`
          ] : [
            `"${nextMonthYear}/Q${nextMonthQuarter}"`
          ]
        ) : []),
        // 年の参照（異なる場合のみ）
        // ...(nextMonthYear !== currentYear ? [
        //   `"[[${nextMonthYear}]]"`
        // ] : [])
      ]
    })() : [])
  ].join(" ")

  batch.push({
    content: `## ${t("Linked References")}`,
    children: [{
      content: `
#+BEGIN_QUERY
  {:title ["${stringDateRange}"]
    :query (and
              (not (page "${mainPageTitle}"))
              (or ${dateReferences})
            )
    :breadcrumb-show? false
    :collapsed? ${logseq.settings![SettingKeys.showLinkedReferences] === "collapsed" ? "true" : "false"}
  }
#+END_QUERY
        `,
    },
    {
      // , ${t("Yearly")} Yearlyを入れると階層以下が含まれてしまう
      content: `
#+BEGIN_QUERY
  {:title ["${t("Week number")}, ${t("Monthly")}, ${t("Quarterly")}"]
    :query (and 
              (not
                  (page "${mainPageTitle}"))
              (or ${pageReferences})
            )
    :breadcrumb-show? false
    :collapsed? ${logseq.settings![SettingKeys.showLinkedReferences] === "collapsed" ? "true" : "false"}
  }
#+END_QUERY
        `
    }]
  })
}
