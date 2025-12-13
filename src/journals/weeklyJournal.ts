import { AppUserConfigs, BlockEntity, BlockUUID, IBatchBlock, PageEntity } from '@logseq/libs/dist/LSPlugin.user'
import { addDays, addWeeks, eachDayOfInterval, format, isSameISOWeek, isSameWeek, startOfWeek, startOfISOWeek, subDays, subWeeks } from 'date-fns' //https://date-fns.org/
import { t } from 'logseq-l10n'
import { boundariesProcess } from '../calendar/boundaries'
import { refreshMonthlyCalendar } from '../calendar/left-calendar'
import { existInsertTemplate, getWeekStartFromWeekNumber } from '../lib'
import { findPageUuid, showConfirmDialog } from '../lib'
import { booleanDbGraph } from '..'
import { getWeekStartOn } from '../lib'
import { separate, weeklyJournalCreateNav } from './nav'
import CSSThisWeekPopup from "./weeklyEmbed.css?inline" //CSSをインラインで読み込む

let processingWeeklyJournal: boolean = false
export const keyThisWeekPopup = "weeklyEmbed"

export const weeklyEmbed = () => logseq.provideStyle({ key: keyThisWeekPopup, style: CSSThisWeekPopup })


export const currentPageIsWeeklyJournal = async (titleElement: HTMLElement, match: RegExpMatchArray) => {
    //yyyy-Wwwのページを開いた状態

    const year = Number(match[1]) //2023
    const weekNumber = Number(match[2]) //27
    const weekNumberString = weekNumber.toString().padStart(2, "0") //27→"27"
    const ISO = (logseq.settings?.weekNumberFormat === "ISO(EU) format") ? true : false
    const weekStartsOn = (logseq.settings?.weekNumberFormat === "US format") ? 0 : 1
    const weekStart: Date = getWeekStartFromWeekNumber(year, weekNumber, weekStartsOn, ISO)
    //プロセスロック
    if (processingWeeklyJournal === true
        || (titleElement.dataset!.WeeklyJournalChecked as string) === "true")
        return//一度だけ処理を行う

    //処理中フラグを立てる ここからreturnする場合は必ずfalseにすること
    processingWeeklyJournal = true
    setTimeout(() => processingWeeklyJournal = false, 10)
    titleElement.dataset.WeeklyJournalChecked = "true"


    //Journal Boundariesを表示する
    callMiniCalendar(logseq.settings!.booleanBoundariesOnWeeklyJournal as boolean, weekStart)

    //Left Calendarの更新
    refreshMonthlyCalendar(weekStart, false, true)

    if (logseq.settings!.booleanWeeklyJournal === false) return


    const weekEnd: Date = addDays(weekStart, 6)

    //weekStartの前日から週番号を求める(前の週番号を求める)
    const prevWeekStart: Date = (ISO === true)
        ? subWeeks(weekStart, 1)
        : subDays(weekStart, 1)

    //次の週番号を求める
    const nextWeekStart: Date = (ISO === true)
        ? addWeeks(weekStart, 1)
        : addDays(weekEnd, 1)

    setTimeout(async () => {
        // 週番号のナビゲーションを作成する
        const boolean = await weeklyJournalCreateNav(ISO, year.toString(), weekNumberString, weekStart, weekEnd, prevWeekStart, nextWeekStart)
        if (boolean === false)
            setTimeout(async () =>
                await weeklyJournalCreateNav(ISO, year.toString(), weekNumberString, weekStart, weekEnd, prevWeekStart, nextWeekStart) //再度実行
                , 1200)
    }, 300)

    if (logseq.settings!.booleanWeeklyJournalThisWeek === true
        && logseq.settings!.weeklyEmbed === true)
        setTimeout(() => {
            const today = new Date()
            // スクロールを縦ではなく横にする (ホイールイベント)
            const currentWeek: boolean = ISO === true ? isSameISOWeek(today, weekStart) : isSameWeek(today, weekStart)
            handleScrolling(currentWeek, today, ISO)
        }, 300)

    // もしページが存在しなかったら作成する
    const pageUuid = await findPageUuid(match[0]) as PageEntity["uuid"] | false
    if (pageUuid) {
        // ページが存在した場合
        const pageBlockTree = await logseq.Editor.getPageBlocksTree(pageUuid) as { content: BlockEntity["content"] }[] | null
        if (pageBlockTree) {
            //コンテンツがある場合は処理を中断する
            if (pageBlockTree.find((block) => block.content !== null)) // block.contentが空ではないブロックがひとつでもあったら処理を中断する
                return

            await new Promise(async (resolve) => {
                await weeklyJournalCreateContent(weekStart, weekEnd, pageUuid)
                resolve("Done")
            })
        }
        //else console.warn("pageBlockTree is null") //pageBlockTreeがnullの場合は警告を出す
    } else {
        console.log("Weekly Journal page not found") //ページが見つからない場合はログを出す
        // ページが存在しない場合は作成する
        // If DB graph and weekly page name contains a slash, abort and prompt user to change plugin settings
        if (booleanDbGraph() && match[0].includes('/')) {
            await showConfirmDialog(
                t('Cannot create weekly journal'),
                `${t('Your graph is a DB graph. Weekly journal names containing slashes cannot be created.')}
\n${t('Please change the week-number format in plugin settings to a format without slashes and try again.')}`,
                { confirmText: t('Open plugin settings'), cancelText: t('Cancel') }
            )
            try { await (logseq.App as any).invokeExternalCommand("logseq.ui/toggle-settings") } catch (e) { /* ignore */ }
            return
        }

        const createName = booleanDbGraph() && /W\d{2}/.test(match[0]) ? `${match[0]} #journal` : match[0]
        const pageEntity = await logseq.Editor.createPage(createName, {}, { redirect: false, createFirstBlock: false, journal: false }) as { uuid: BlockEntity["uuid"] } | null
        if (pageEntity) {
            console.log("Weekly Journal page created") //ページが作成された場合はログを出す
            processingWeeklyJournal = true//処理中フラグを立てる ここからreturnする場合は必ずfalseにすること
            titleElement.dataset.WeeklyJournalChecked = "true"
            await new Promise(async (resolve) => {
                await weeklyJournalCreateContent(weekStart, weekEnd, pageEntity.uuid)
                resolve("Done")
            })
        }
        //else console.warn("pageEntity is null") //pageEntityがnullの場合は警告を出す
    }

}// end of currentPageIsWeeklyJournal


const weeklyJournalCreateContent = async (
    weekStart: Date,
    weekEnd: Date,
    pageUuid: BlockUUID,
) => {

    let batchArray: IBatchBlock[] = [
        {// 空ブロック block 0
            content: ""
        },
        {// テンプレート挿入用のブロック block 1
            content: ""
        },
        {// 空ブロック block 2
            content: ""
        },
    ]

    if (logseq.settings!.booleanWeeklyJournalHeadline === true
        && logseq.settings!.weeklyJournalHeadlineProperty !== "") {
        // Headline section
        const block = {
            content: `#+BEGIN_QUERY
{:title [:h4 "${t("Headline")}"]
 :query [:find (pull ?b [{:block/page
     [:block/name :block/journal-day]} :block/properties])
      :where
      [?b :block/properties ?bProps]
      [(get ?bProps :${logseq.settings!.weeklyJournalHeadlineProperty as string} "nil") ?bs]
      [(not= ?bs "nil")]
      [?b :block/page ?p]
      [?p :block/journal-day ?jd]
     [(>= ?jd ${format(weekStart, "yyyyMMdd")})]
     [(<= ?jd ${format(weekEnd, "yyyyMMdd")})]]
:result-transform (fn [result]
                     (sort-by (fn [s]
                        (get-in s [:block/page :block/journal-day])) (fn [a b] (compare b a)) result)) 
:table-view? true
}
#+END_QUERY
    `} as IBatchBlock
        batchArray.push(block)
    }

    //This Week section
    if (logseq.settings!.booleanWeeklyJournalThisWeek === true) {
        const weekDays: Date[] = eachDayOfInterval({ start: weekStart, end: weekEnd })
        const { preferredDateFormat } = await logseq.App.getUserConfigs() as { preferredDateFormat: AppUserConfigs["preferredDateFormat"] }
        const weekDaysLinkArray: string[] = weekDays.map((day) => format(day, preferredDateFormat) as string) // 曜日ごとのリンクを作成する
        batchArray.push({
            content: `#### ${t("This Week")}${logseq.settings!.weeklyEmbed === true ? " #.ThisWeek " : ""}`,
            children:
                weekDaysLinkArray.map((eachJournal) => {
                    return {
                        content: logseq.settings!.weeklyEmbed === true ? `{{embed [[${eachJournal}]]}}` : `[[${eachJournal}]]`,
                        children: [
                            { content: "" }
                        ]
                    }
                })
        } as IBatchBlock)
    }

    // 空ブロックを追加する
    batchArray.push({ content: "" })


    //一行目を作成する
    const newBlock = await logseq.Editor.prependBlockInPage(
        pageUuid,
        "",
        {
            properties: {
                tags: generatePageTagsArray(weekStart, weekEnd) as string[] //ページプロパティを追加する
            }
        }
    ) as { uuid: BlockEntity["uuid"] }

    // バッチ処理を行う
    if (newBlock) {
        await logseq.Editor.insertBatchBlock(newBlock.uuid, batchArray) as { uuid: BlockEntity["uuid"] }[] | null
        setTimeout(async () => {
            const blocks = await logseq.Editor.getPageBlocksTree(pageUuid) as { uuid: BlockEntity["uuid"] }[] | null
            if (blocks) {
                if (logseq.settings!.weeklyJournalTemplateName !== "")
                    await existInsertTemplate(
                        blocks[1].uuid, //2番目のブロックにテンプレートを挿入する
                        logseq.settings!.weeklyJournalTemplateName as string,
                        t("Weekly journal created"))
                // テンプレートにページプロパティが含まれる場合は、重複してしまう。
                else
                    console.warn("weeklyJournalTemplateName is not set") //weeklyJournalTemplateNameが設定されていない場合は警告を出す
            } else
                console.warn("blocks is null") //blocksがnullの場合は警告を出す
        }, 10)
    } else
        console.warn("newBlock is null") //newBlockがnullの場合は警告を出す
}


const generatePageTagsArray = (weekStart: Date, weekEnd: Date) => {
    let pageTagsPropertyArray: string[] = []
    const formatSeparate = separate() as "/" | "-"
    const printMonthLink = format(weekStart, `yyyy${formatSeparate}MM`)
    const printMonthLink2 = format(weekEnd, `yyyy${formatSeparate}MM`)
    if (printMonthLink !== printMonthLink2)
        pageTagsPropertyArray.unshift(printMonthLink2)
    pageTagsPropertyArray.unshift(printMonthLink)

    //ユーザー設定のページタグを追加
    if (logseq.settings!.weeklyJournalSetPageTag !== "")
        pageTagsPropertyArray.push((logseq.settings!.weeklyJournalSetPageTag) as string)
    return pageTagsPropertyArray
}


const handleScrolling = (currentWeek: boolean, today: Date, ISO: boolean) => {
    //data-refs-selfの値に「.thisweek」が含まれる場合のみ処理
    const scrollTargetElement = parent.document.querySelector("div.ls-block[data-refs-self*='.thisweek']") as HTMLElement | null // スクロール対象の要素
    if (scrollTargetElement)
        scrollTargetElement.addEventListener("wheel", (ev: WheelEvent) => eventListener(scrollTargetElement, ev), { passive: false }) // ホイールイベント
    else
        console.warn("scrollTargetElement is null")

    //今週のページを開いた場合は、曜日が中心にくるように横スクロールする
    if (currentWeek === true)
        //今日の曜日が週後半の場合は、右端までスクロールする
        if (ISO === true) {
            if (today.getDay() >= 4 || today.getDay() === 0) // 週後半 (水曜日から日曜日) 0,4,5,6
                setTimeout(() => {
                    const target = parent.document.querySelector("div.ls-block[data-refs-self*='.thisweek']>div.block-children-container>div.block-children") as HTMLElement | null
                    if (target)
                        target.scrollLeft = target.scrollWidth - target.clientWidth
                    else
                        console.warn("target is null")
                }, 500)
        } else {
            if (today.getDay() >= 3) // 週後半 (木曜日から土曜日) 3,4,5,6
                setTimeout(() => {
                    const target = parent.document.querySelector("div.ls-block[data-refs-self*='.thisweek']>div.block-children-container>div.block-children") as HTMLElement | null
                    if (target)
                        target.scrollLeft = target.scrollWidth - target.clientWidth
                    else
                        console.warn("target is null")
                }, 500)
        }
}


let processingEventListener = false

const eventListener = (scrollTargetElement: HTMLElement, ev: WheelEvent) => {
    if (processingEventListener) return
    processingEventListener = true

    const target = parent.document.querySelector("div.ls-block[data-refs-self*='.thisweek']>div.block-children-container>div.block-children") as HTMLElement | null
    if (target) {
        if (parent.document.activeElement?.classList.contains("normal-block")) // ブロックを編集中の場合は横スクロールをしない
        { }
        else
            if (Math.abs(ev.deltaY) < Math.abs(ev.deltaX)) // 縦より横のスクロールの方が大きい場合
            { }
            else
                if (target.scrollWidth <= target.clientWidth) // スクロールが必要ない場合
                { }
                else
                    if ((target.scrollLeft <= 0 && ev.deltaY < 0) || (target.scrollLeft >= (target.scrollWidth - target.clientWidth) && ev.deltaY > 0)) // スクロールが端に達した場合
                    { ev.preventDefault() }
                    else {
                        ev.preventDefault()
                        target.scrollLeft += ev.deltaY // 横スクロール実行
                        //console.log("activeElement", parent.document.activeElement?.classList)
                    }
        //遅延処理
        setTimeout(() => processingEventListener = false, 10) // 10ms後に処理を再開

    } else {
        // イベントリスナー削除
        scrollTargetElement.removeEventListener("wheel", (ev) => eventListener(scrollTargetElement, ev))
        setTimeout(() => processingEventListener = false, 1000) // 1秒後に処理を再開
    }
}


let processingFoundBoundaries: boolean = false
export const callMiniCalendar = (check: boolean, monthStartDay: Date) => {
    if (check === true
        && !parent.document.getElementById("weekBoundaries")
        && processingFoundBoundaries !== true) {
        processingFoundBoundaries = true
        setTimeout(() => {
            try {
                const weekStartsOn = getWeekStartOn()
                const useISO = weekStartsOn === 1 && (logseq.settings?.weekNumberFormat === "ISO(EU) format")
                const start = useISO ? startOfISOWeek(monthStartDay) : startOfWeek(monthStartDay, { weekStartsOn })
                boundariesProcess("weeklyJournal", false, 0, start)
            } catch (e) {
                // fallback
                boundariesProcess("weeklyJournal", false, 0, startOfWeek(monthStartDay))
            }
            processingFoundBoundaries = false
        }, 200)
    }
}
