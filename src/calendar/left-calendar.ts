import { isSameMonth } from "date-fns"
import { t } from "logseq-l10n"
import { getConfigPreferredDateFormat, getLeftSidebarFooterSelector, pluginName } from ".."
import { removeElementById } from "../lib"
import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import MonthlyCalendar from '../components/MonthlyCalendar'

export const keyLeftCalendarContainer = "left-calendar-container"

export let currentCalendarDate: Date = new Date() //今日の日付を取得
let flagWeekly = false //週間表示フラグ

export const loadLeftCalendar = (logseqDbGraph: boolean) => {
    // Prevent concurrent creation: use a parent-scoped creating lock to avoid race conditions
    if ((parent as any).__leftCalendarCreating) return
    (parent as any).__leftCalendarCreating = true
    if (parent.document.getElementById(keyLeftCalendarContainer))
        removeElementById(keyLeftCalendarContainer)//すでに存在する場合は削除する

    setTimeout(async () => {

        //左サイドバーのフッターに追加する
        const footerElement: HTMLElement | null = parent.document.querySelector(getLeftSidebarFooterSelector()) as HTMLElement | null
        if (footerElement === null) {
            ;(parent as any).__leftCalendarCreating = false
            return //nullの場合はキャンセル
        }

        const containerElement: HTMLDivElement = parent.document.createElement("div")
        containerElement.className = "nav-content-item mt-6 is-expand flex-shrink-0"
        containerElement.id = keyLeftCalendarContainer
        const detailsElement: HTMLDetailsElement = parent.document.createElement("details")
        detailsElement.className = "nav-content-item-inner"
        detailsElement.open = true
        const summaryElement: HTMLElement = parent.document.createElement("summary")
        summaryElement.className = "header items-center pl-4"
        summaryElement.style.cursor = "row-resize"
        summaryElement.style.backgroundColor = "var(--ls-tertiary-background-color)"
        summaryElement.innerText = t("Monthly Calendar") // タイトルを入れる
        summaryElement.title = pluginName // プラグイン名を入れる
        const innerElement: HTMLDivElement = parent.document.createElement("div")
        innerElement.className = "bg"
        innerElement.id = "left-calendar-inner"
        detailsElement.appendChild(summaryElement)
        detailsElement.appendChild(innerElement)
        containerElement.appendChild(detailsElement)
        if (logseqDbGraph)
            footerElement.insertAdjacentElement("afterend", containerElement) //DBグラフの場合は後ろ
        else
            footerElement.insertAdjacentElement("beforebegin", containerElement)

        //スペースに表示する
        setTimeout(async () => {
            const innerElement: HTMLDivElement | null = parent.document.getElementById("left-calendar-inner") as HTMLDivElement | null

            if (innerElement === null) {
                ;(parent as any).__leftCalendarCreating = false
                return //nullの場合はキャンセル
            }

            // dataset.flag prevents duplicate initialization for the same inner element
            if (innerElement.dataset.flag !== "true") {//すでに存在する場合はキャンセル
                try {
                    await createCalendar(new Date(), await getConfigPreferredDateFormat(), innerElement)
                } finally {
                    // ensure the creating lock is released after createCalendar completes
                    ;(parent as any).__leftCalendarCreating = false
                }
            } else {
                ;(parent as any).__leftCalendarCreating = false
            }
        }, 1)

    }, 500)
}

// 月間カレンダーを作成する（マウントポイントの作成に限定）
const createCalendar = async (targetDate: Date, preferredDateFormat: string, innerElement: HTMLDivElement, flag?: { singlePage?: boolean, weekly?: boolean }) => {
    // Keep weekly flag and currentCalendarDate module state
    flagWeekly = flag?.weekly === true ? true : false
    currentCalendarDate = targetDate

    // Ensure a single React mount point exists inside the inner element.
    // Do not attempt to move/remove legacy elements here; leave that to cleanup logic.
    let calendarElement = parent.document.getElementById('left-calendar-root') as HTMLElement | null
    if (!calendarElement) {
        calendarElement = parent.document.createElement('div')
        calendarElement.className = 'nav-calendar-react-wrapper'
        calendarElement.id = 'left-calendar-root'
        innerElement.appendChild(calendarElement)
    }

    try {
        // Create or reuse root stored on the parent/window
        const existingRoot = (window as any).__leftCalendarRoot || (parent as any).__leftCalendarRoot || null
        if (existingRoot && typeof existingRoot.render === 'function') {
            // Re-render into existing root
            existingRoot.render(React.createElement(MonthlyCalendar, { targetDate, preferredDateFormat, flag, onTargetDateChange: (d: Date) => { currentCalendarDate = d; flagWeekly = flag?.weekly === true ? true : false } }))
        } else {
            const root: Root = createRoot(calendarElement)
            ;(window as any).__leftCalendarRoot = root
            root.render(React.createElement(MonthlyCalendar, { targetDate, preferredDateFormat, flag, onTargetDateChange: (d: Date) => { currentCalendarDate = d; flagWeekly = flag?.weekly === true ? true : false } }))
        }
        try { (parent as any).__leftCalendarInitialized = true } catch (e) { /* ignore */ }
    } catch (e) {
        console.error('Failed to render MonthlyCalendar React component', e)
    }
}

//カレンダーとナビゲーションを削除 (再描画時に使用)
const removeCalendarAndNav = () => {

    // Unmount React root if exists
    try {
        const root = (window as any).__leftCalendarRoot as any
        if (root && typeof root.unmount === 'function') {
            root.unmount()
            (window as any).__leftCalendarRoot = null
        }
    } catch (e) { /* ignore */ }

    // Remove the container that holds the calendar (created by loadLeftCalendar)
    removeElementById(keyLeftCalendarContainer)

    // Unset parent-scoped flags so creation can happen again
    try {
        ;(parent as any).__leftCalendarCreating = false
        ;(parent as any).__leftCalendarInitialized = false
    } catch (e) { /* ignore */ }
}

export const refreshMonthlyCalendar = async (targetDate: Date, singlePage: boolean, weekly: boolean) => {
    const innerElement: HTMLDivElement | null = parent.document.getElementById("left-calendar-inner") as HTMLDivElement | null
    const preferredDateFormat = await getConfigPreferredDateFormat()
    // If React root exists, update it by re-rendering with new props instead of unmounting
    try {
        const root = (window as any).__leftCalendarRoot as any
        if (root && typeof root.render === 'function') {
            root.render(React.createElement(MonthlyCalendar, { targetDate, preferredDateFormat, flag: { singlePage, weekly }, onTargetDateChange: (d: Date) => { currentCalendarDate = d; flagWeekly = weekly === true } }))
            // update module-level state
            currentCalendarDate = targetDate
            flagWeekly = weekly === true
            return
        }
    } catch (e) { /* ignore and fallback to recreate */ }

    if (innerElement) {
        // fallback: remove and recreate
        removeCalendarAndNav()
        createCalendar(
            targetDate,
            preferredDateFormat,
            innerElement,
            { singlePage, weekly })
    }
}


export const refreshCalendarCheckSameMonth = () => {
    const today = new Date()
    if (flagWeekly === true
        || isSameMonth(currentCalendarDate, today) === false)
        refreshMonthlyCalendar(today, false, false)
}
