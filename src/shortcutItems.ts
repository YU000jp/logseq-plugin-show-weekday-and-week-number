import { AppUserConfigs, BlockEntity, IBatchBlock } from "@logseq/libs/dist/LSPlugin"
import { getQuarterFromWeekNumber, getWeeklyNumberFromDate, getWeeklyNumberString } from "./lib"
import { addMonths, addWeeks, addYears, endOfYear, format, startOfMonth, } from "date-fns"
import { separate } from "./journals/nav"

export const loadShortcutItems = () => {

    currentWeekNumberLink()

    nextWeekNumberLink()

    weekNumberYearAllThisYear()

    weekNumberYearAllNextYear()

    currentDateAndTime()

    currentDayOfWeek()

    currentMonth()

    nextMonth()

    currentYear()

    nextYear()

    nextYearMOnth()
}


const currentWeekNumberLink = () => logseq.Editor.registerSlashCommand("Current week number link", async () => {
    //Week number linkのスラッシュコマンド
    const { year, weekString, quarter } = getWeeklyNumberFromDate(new Date(), logseq.settings?.weekNumberFormat === "US format" ? 0 : 1) // 週番号を取得する
    const weekNumberString = getWeeklyNumberString(year, weekString, quarter) // 週番号からユーザー指定文字列を取得する
    logseq.Editor.insertAtEditingCursor(` [[${weekNumberString}]] `)
})

const nextWeekNumberLink = () => logseq.Editor.registerSlashCommand("Next week number link", async () => {
    //Week number linkのスラッシュコマンド
    const { year, weekString, quarter } = getWeeklyNumberFromDate(addWeeks(new Date(), 1), logseq.settings?.weekNumberFormat === "US format" ? 0 : 1) // 週番号を取得する
    const weekNumberString = getWeeklyNumberString(year, weekString, quarter) // 週番号からユーザー指定文字列を取得する
    logseq.Editor.insertAtEditingCursor(` [[${weekNumberString}]] `)
})


const weekNumberYearAllThisYear = () => logseq.Editor.registerSlashCommand("Create Week number list of this year", async ({ uuid }) => {
    //今年の12月31日のDateオブジェクトを作成
    await weekNumberYearAll(new Date().getFullYear(), uuid)
})

const weekNumberYearAllNextYear = () => logseq.Editor.registerSlashCommand("Create Week number list of next year", async ({ uuid }) => {
    //来年の12月31日のDateオブジェクトを作成
    await weekNumberYearAll(new Date().getFullYear() + 1, uuid)
})

const weekNumberYearAll = async (selectYear: number, uuid: string) => {
    const lastDate = endOfYear(new Date(selectYear, 2))

    //週番号を取得
    let { year, weekString }: { year: number; weekString: string } = getWeeklyNumberFromDate(
        lastDate,
        logseq.settings?.weekNumberFormat === "US format" ? 0 : 1
    )
    if (year !== selectYear) {
        //今年の12月31日が週番号の最終週の場合、来年の週番号を取得する
        year = selectYear
        weekString = "52"
    }
    //週番号のリストを作成
    //weekStringが52か53なのでそれを元に、1～52か1～53の配列を作成
    const weekNumberList = [...Array(Number(weekString)).keys()].map((i) => i + 1)

    //週番号のリストを元に、年と週番号を組み合わせたリストを作成
    const weekNumberListWithYear = weekNumberList.map((weekNumber) =>
        getWeeklyNumberString(year,
            weekNumber.toString().padStart(2, "0"),
            getQuarterFromWeekNumber(weekNumber)))

    let batch: IBatchBlock[]
    batch = weekNumberListWithYear.map((weekNumber) => ({
        content: `[[${weekNumber}]] `,
    }))
    const { uuid: yearUuid } = await logseq.Editor.insertBlock(uuid,
        `[[${year}]] `,
        { sibling: true }) as BlockEntity as { uuid: string }

    if (yearUuid) await logseq.Editor.insertBatchBlock(yearUuid, batch, { sibling: false })
}


const currentDateAndTime = () => logseq.Editor.registerSlashCommand("Current date and time: [[(user date format)]] *HH:mm*", async () => {
    const { preferredDateFormat }: { preferredDateFormat: string } = (await logseq.App.getUserConfigs()) as AppUserConfigs
    const date = new Date()
    const journalLink = format(date, preferredDateFormat)
    const time = format(date, "HH:mm")
    logseq.Editor.insertAtEditingCursor(` [[${journalLink}]] *${time}* `)
})

const currentDayOfWeek = () => logseq.Editor.registerSlashCommand("Current day of week (Localize)", async () => {
    const dayOfWeek = new Intl.DateTimeFormat("default", { weekday: "long" }).format(new Date())
    logseq.Editor.insertAtEditingCursor(` *${dayOfWeek}* `)
})


const currentMonth = () => logseq.Editor.registerSlashCommand("Current month", async () => {
    //今日の日付から年と月を取得
    const date = new Date()
    logseq.Editor.insertAtEditingCursor(` [[${format(date, `yyyy${separate()}MM`)}]] `)
})

const nextMonth = () => logseq.Editor.registerSlashCommand("Next month", async () => {
    //月初めの日付を取得
    //1か月を足す
    const date = addMonths(startOfMonth(new Date()), 1)
    logseq.Editor.insertAtEditingCursor(` [[${format(date, `yyyy${separate()}MM`)}]] `)

})

const currentYear = () => logseq.Editor.registerSlashCommand("Current year", async () => {
    const year = new Date().getFullYear()
    logseq.Editor.insertAtEditingCursor(` [[${year}]] `)
})

const nextYear = () => logseq.Editor.registerSlashCommand("Next year", async () => {
    const year = addYears(new Date(), 1)
    logseq.Editor.insertAtEditingCursor(` [[${format(year, "yyyy")}]] `)
})

const nextYearMOnth = () => logseq.Editor.registerSlashCommand("A year later", async () => {
    //月初めの日付を取得
    let date = addYears(new Date(), 1)
    logseq.Editor.insertAtEditingCursor(` [[${format(date, `yyyy${separate()}MM`)}]] `)
})