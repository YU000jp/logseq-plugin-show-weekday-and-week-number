import { BlockEntity, BlockUUID, PageEntity } from "@logseq/libs/dist/LSPlugin.user"
import { addDays, addWeeks, format, getISOWeek, getISOWeekYear, getWeek, getWeekYear, startOfISOWeek, startOfWeek } from "date-fns"
import { t } from "logseq-l10n"
import { enableWeekNumber, enableRelativeTime } from "../dailyJournalDetails"
import { SettingKeys } from "../settings/SettingKeys"
import { getPageBlocks, doesPageExist, findPageUuid } from "./query/advancedQuery"
import { booleanLogseqMdModel } from ".."
import { DayShortCode } from "../types"

// Lightweight built-in confirm dialog implemented with <dialog>, falling back to a simple overlay
// Uses `logseq-l10n`'s `t()` for translations.
const injectedModalStyleId = 'ls-plugin-simple-modal-style'
const ensureModalStyle = () => {
  if (parent.document.getElementById(injectedModalStyleId)) return
  const style = parent.document.createElement('style')
  style.id = injectedModalStyleId
  style.textContent = `
  dialog.ls-plugin-modal{border:none;border-radius:8px;padding:1rem;max-width:520px;width:90%;box-shadow:0 10px 30px rgba(0,0,0,0.2);background:var(--ls-ui-bg, white);color:var(--ls-ui-fg, #111);font-family:inherit}
  dialog.ls-plugin-modal::backdrop{background:rgba(0,0,0,0.4);z-index:99999}
  dialog.ls-plugin-modal h3{margin:0 0 0.5rem;font-size:1.1rem}
  dialog.ls-plugin-modal div{font-size:small;margin:0 0 1rem;white-space:pre-wrap;font-weight:500}
  .ls-plugin-modal-actions{display:flex;gap:0.5rem;justify-content:flex-end}
  .ls-plugin-modal-actions button{padding:0.45rem 0.8rem;border-radius:6px;border:none;cursor:pointer;font-weight:600}
  dialog.ls-plugin-modal button.confirm, dialog.ls-plugin-modal button.confirm:focus{background:#ffd54f;color:#000 !important;box-shadow:0 2px 6px rgba(0,0,0,0.12);text-shadow:none}
  dialog.ls-plugin-modal button.cancel, dialog.ls-plugin-modal button.cancel:focus{background:#d33;color:#fff !important;box-shadow:0 2px 6px rgba(211,51,51,0.25)}
  /* Fallback overlay styles for environments without <dialog> support */
  .ls-plugin-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:99999}
  .ls-plugin-modal-fallback{background:var(--ls-ui-bg, white);color:var(--ls-ui-fg, #111);max-width:520px;width:90%;padding:1rem;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.2);}
  `
  parent.document.head.appendChild(style)
}

const escapeHtml = (unsafe: string) => {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export const showConfirmDialog = (title: string, text: string, opts?: { confirmText?: string; cancelText?: string }) => {
  ensureModalStyle()
  return new Promise<boolean>((resolve) => {
    // Create a <dialog> and use its built-in modal behavior if supported by the host
    try {
      const dialog = parent.document.createElement('dialog') as HTMLDialogElement
      dialog.className = 'ls-plugin-modal'
      dialog.setAttribute('aria-modal', 'true')

      const safeTitle = escapeHtml(title)
      const safeText = escapeHtml(text).replace(/\n/g, '<br>')

      dialog.innerHTML = `
        <form method="dialog" style="margin:0">
          <h3>${safeTitle}</h3>
          <hr/>
          <div>${safeText}</div>
          <div class="ls-plugin-modal-actions">
            <button type="button" class="cancel">${escapeHtml(opts?.cancelText ?? t('Cancel'))}</button>
            <button type="submit" class="confirm">${escapeHtml(opts?.confirmText ?? t('Confirm'))}</button>
          </div>
        </form>
      `

      // result stored on dataset by button handlers
      const onClose = () => {
        const res = dialog.dataset.result
        dialog.removeEventListener('close', onClose)
        dialog.remove()
        resolve(res === 'confirm')
      }

      dialog.addEventListener('close', onClose)
      // ESC triggers 'cancel' event on dialog
      dialog.addEventListener('cancel', (e) => {
        dialog.dataset.result = 'cancel'
      })

      parent.document.body.appendChild(dialog)

      const btnCancel = dialog.querySelector('button.cancel') as HTMLButtonElement
      const btnConfirm = dialog.querySelector('button.confirm') as HTMLButtonElement

      btnCancel.addEventListener('click', () => {
        dialog.dataset.result = 'cancel'
        try { dialog.close() } catch { /* ignore */ }
      })

      btnConfirm.addEventListener('click', () => {
        // submit will close the dialog; mark result first
        dialog.dataset.result = 'confirm'
      })

      // clicking on backdrop should cancel
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          dialog.dataset.result = 'cancel'
          try { dialog.close() } catch { /* ignore */ }
        }
      })

      // Show modal
      if (typeof dialog.showModal === 'function') {
        dialog.showModal()
      } else {
        // If showModal not supported, throw to go to fallback
        throw new Error('showModal not supported')
      }
    } catch (e) {
      // Fallback to overlay-based modal for environments where <dialog> isn't available
      const overlay = parent.document.createElement('div')
      overlay.className = 'ls-plugin-modal-overlay'

      const modal = parent.document.createElement('div')
      modal.className = 'ls-plugin-modal-fallback'

      const h = parent.document.createElement('h3')
      h.textContent = title
      modal.appendChild(h)

      const p = parent.document.createElement('p')
      p.innerHTML = text.replace(/\n/g, '<br>')
      modal.appendChild(p)

      const actions = parent.document.createElement('div')
      actions.className = 'ls-plugin-modal-actions'

      const btnCancel = parent.document.createElement('button')
      btnCancel.className = 'cancel'
      btnCancel.textContent = opts?.cancelText ?? t('Cancel')
      btnCancel.addEventListener('click', () => {
        overlay.remove()
        resolve(false)
      })

      const btnConfirm = parent.document.createElement('button')
      btnConfirm.className = 'confirm'
      btnConfirm.textContent = opts?.confirmText ?? t('Confirm')
      btnConfirm.addEventListener('click', () => {
        overlay.remove()
        resolve(true)
      })

      actions.appendChild(btnCancel)
      actions.appendChild(btnConfirm)
      modal.appendChild(actions)
      overlay.appendChild(modal)
      parent.document.body.appendChild(overlay)
    }
  })
}


export const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as DayShortCode[]

export const colorMap: { [key: string]: string } = {
  blue: 'var(--ls-wb-stroke-color-blue)',
  red: 'var(--ls-wb-stroke-color-red)',
  green: 'var(--ls-wb-stroke-color-green)'
}



export const getDateFromJournalDay = (str: string): Date =>
  new Date(
    Number(str.slice(0, 4)), //year
    Number(str.slice(4, 6)) - 1, //month 0-11
    Number(str.slice(6)) //day
  )

export const getWeeklyNumberFromDate = (date: Date, weekStartsOn: 0 | 1): { year: number, weekString: string, quarter: number } => {
  // 日付のバリデーション
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error("Invalid date provided to getWeeklyNumberFromDate:", date)
    return { year: 0, weekString: "00", quarter: 0 }
  }

  const year: number = logseq.settings?.weekNumberFormat === "ISO(EU) format" ? //年
    getISOWeekYear(date) // ISO 8601
    : getWeekYear(date, { weekStartsOn }) //NOTE: getWeekYear関数は1月1日がその年の第1週の始まりとなる(デフォルト)

  const week: number = logseq.settings?.weekNumberFormat === "ISO(EU) format" ? //週番号
    getISOWeek(date)// ISO 8601
    : getWeek(date, { weekStartsOn })

  // 週番号のバリデーション
  if (isNaN(week) || week < 1 || week > 53) {
    console.error("Invalid week number calculated:", week)
    return { year: 0, weekString: "00", quarter: 0 }
  }

  const quarter: number = getQuarterFromWeekNumber(week) //四半期を求める

  const weekString: string = (week < 10) ?
    String("0" + week)
    : String(week) //weekを2文字にする

  return {
    year,
    weekString,
    quarter
  }
}

export const getQuarterFromWeekNumber = (week: number): number => week < 14 ? 1 : week < 27 ? 2 : week < 40 ? 3 : 4

export const getWeeklyNumberString = (year: number, weekString: string, quarter: number): string => {
  switch (logseq.settings?.weekNumberOptions) {
    case "YYYY-Www":
      return `${year}-W${weekString}` // "YYYY-Www"
    case "YYYY/qqq/Www":
      return `${year}/Q${quarter}/W${weekString}` // "YYYY/qqq/Www"
    case "YYYY-qqq-Www":
      return `${year}-Q${quarter}-W${weekString}` // "YYYY-qqq-Www"
    default:
      return `${year}/W${weekString}` // "YYYY/Www"
  }
}

export const getRelativeDateString = (targetDate: Date, today?: Date): string => {
  const currentDate = today ? today : new Date()

  // 日付を比較するために年月日の部分だけを取得
  const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
  const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())

  // 比較した結果、同じ日付だった場合は空文字を返す
  // if (targetDateOnly.getTime() === currentDateOnly.getTime()) {
  //   return '';
  // }
  // 相対的な日付差を計算
  const diffInDays: number = Math.floor((targetDateOnly.getTime() - currentDateOnly.getTime()) / (1000 * 60 * 60 * 24))

  // 相対的な日付差をローカライズした文字列に変換し、先頭を大文字に
  const relativeString = new Intl.RelativeTimeFormat((logseq.settings![SettingKeys.localizeOrEnglish] as string | "default"), { numeric: 'auto' }).format(diffInDays, 'day') as string
  return relativeString.charAt(0).toUpperCase() + relativeString.slice(1)
} //formatRelativeDate end

export const getWeekStartOn = (): 0 | 1 | 6 => {
  let weekStartsOn: 0 | 1 | 6
  switch (logseq.settings!.boundariesWeekStart) {
    case "Sunday":
      weekStartsOn = 0
      break
    case "Monday":
      weekStartsOn = 1
      break
    case "Saturday":
      weekStartsOn = 6
      break
    default: //"unset"
      weekStartsOn = (logseq.settings?.weekNumberFormat === "US format") ? 0 : 1
      break
  }
  return weekStartsOn
}

export const createSettingButton = (): HTMLButtonElement => {
  const button: HTMLButtonElement = document.createElement("button")
  button.textContent = "⚙"
  button.title = t("Open plugin setting")
  button.style.marginLeft = "1em"
  button.addEventListener("click", () => {
    logseq.showSettingsUI()
  })
  return button
}

export const createLinkMonthlyLink = (linkString: string, pageName: string, elementTitle: string): HTMLButtonElement => {
  const button: HTMLButtonElement = document.createElement("button")
  button.textContent = linkString
  button.title = elementTitle
  button.style.marginLeft = "1em"
  button.addEventListener("click", ({ shiftKey }) => openPageFromPageName(pageName, shiftKey))
  return button
}

export const openPageFromPageName = async (pageName: string, shiftKey: boolean) => {
  if (shiftKey === true) {
    const pageUuid = await findPageUuid(pageName) as PageEntity["uuid"] | null
    if (pageUuid)
      logseq.Editor.openInRightSidebar(pageUuid) //ページが存在しない場合は開かない
  }
  else {
    const mdModel = booleanLogseqMdModel() as boolean
    if (mdModel === true) {
      logseq.App.pushState('page', { name: pageName })
    } else {
      const page = await doesPageExist(pageName) as boolean
      if (page) {
        logseq.App.pushState('page', { name: pageName })
      } else {
        logseq.Editor.showMsg(`Page "${pageName}" does not exist.`, 'warning', { timeout: 5000 })

        logseq.showMainUI()
        const confirmed = await showConfirmDialog(
          t("Do you want to continue?"),
          `${t("Page not found")}\n\n${t("Create a new page.")}\n\n[[${pageName}]]`,
          { confirmText: t('Confirm'), cancelText: t('Cancel') }
        )
        if (confirmed) {
          //ページが存在しない場合は、ページを作成する
          await logseq.Editor.createPage(pageName, {}, { createFirstBlock: true, redirect: true })
          logseq.UI.showMsg(t("Page created successfully."), 'success', { timeout: 2000 })
        } else
          await logseq.UI.showMsg(t("Cancelled"), "warning")
        logseq.hideMainUI()
      }
    }
  }
}

export const removeProvideStyle = (className: string) => {
  const doc = parent.document.head.querySelector(
    `style[data-injected-style^="${className}"]`
  ) as HTMLStyleElement | null
  if (doc) doc.remove()
}

export const existInsertTemplate = async (blockUuid: BlockUUID, templateName: string, successMessage: string) => {
  if (templateName === "") return
  if (await logseq.App.existTemplate(templateName) as boolean) {
    await logseq.App.insertTemplate(blockUuid, templateName)
    logseq.UI.showMsg(successMessage, 'success', { timeout: 2000 })
  }
  else
    logseq.UI.showMsg(`Template "${templateName}" does not exist.`, 'warning', { timeout: 2000 })
}

export const localizeDate = (date: Date, options: Intl.DateTimeFormatOptions): string => new Intl.DateTimeFormat((logseq.settings?.localizeOrEnglish as string || "default"), options).format(date)

export const localizeMonthString = (date: Date, long: boolean): string => localizeDate(date, { month: long === true ? "long" : "short" })

export const localizeDayOfWeekString = (date: Date, long: boolean): string => localizeDate(date, { weekday: long === true ? "long" : "short" })

export const localizeMonthDayString = (date: Date): string => localizeDate(date, { month: "short", day: "numeric" })

export const localizeDayOfWeekDayString = (date: Date): string => localizeDate(date, { weekday: "short", day: "numeric" })

export const getWeekStartFromWeekNumber = (year: number, weekNumber: number, weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined, ISO: boolean): Date => {
  if (ISO === true) {
    const firstDayOfWeek = startOfISOWeek(new Date(year, 0, 4, 0, 0, 0, 0)) //1/4を含む週
    return (getISOWeekYear(firstDayOfWeek) === year)
      ? addDays(firstDayOfWeek, (weekNumber - 1) * 7)
      : addWeeks(firstDayOfWeek, weekNumber)
  }
  else
    return addDays(startOfWeek(new Date(year, 0, 1, 0, 0, 0, 0), { weekStartsOn }), (weekNumber - 1) * 7)
}

export const userColor = (dayDate: Date, titleElement: HTMLElement) => {
  if (logseq.settings!.userColorList as string === "") return

  let returnEventName: string = ""
  const list = logseq.settings!.userColorList as string
  // logseq.settings!.userColorListには、「yyyy/mm/dd::イベント名」あるいは「mm/dd::イベント名」のような年が入ってる日付とそうでない日付のリストが入っていて、改行区切りになっている
  const userColorList = list.includes("\n") ?
    list.split("\n")
    : [list]
  for (const userColor of userColorList) {
    const [dateString, eventName] = userColor.split("::")

    if ( //dateStringに/が2湖ある場合は、年が入っている
      (dateString.split("/").length === 3
        && (format(dayDate, "yyyy/MM/dd") === dateString //2024/07/21
          || format(dayDate, "yyyy/M/d") === dateString // 2024/7/1のように月と日が1桁の場合
        ))
      // dateStringに/が2湖ある場合は、年が入っていない
      || (dateString.split("/").length === 2
        && (format(dayDate, "MM/dd") === dateString //07/21
          || format(dayDate, "M/d") === dateString // 7/1のように月と日が1桁の場合
        ))) {
      if (returnEventName === "") {
        titleElement.style.color = logseq.settings!.choiceUserColor as string
        titleElement.style.fontWeight = "1800"
        returnEventName = eventName
      } else
        returnEventName = `${returnEventName}\n${eventName}`
    }
  }
  return returnEventName
}

export const getDayOfWeekName = (journalDate: Date): string => {
  return logseq.settings!.booleanDayOfWeek
    ? new Intl.DateTimeFormat(
      logseq.settings!.localizeOrEnglish as string || "default",
      { weekday: logseq.settings!.longOrShort as "long" | "short" || "long" }
    ).format(journalDate)
    : ""
}

export const getWeekNumberHtml = (journalDate: Date): string => {
  return logseq.settings!.booleanWeekNumber
    ? enableWeekNumber(journalDate, logseq.settings!.weekNumberFormat === "US format" ? 0 : 1)
    : ""
}

export const getRelativeTimeHtml = (journalDate: Date): string => {
  return logseq.settings!.booleanRelativeTime
    ? enableRelativeTime(journalDate)
    : ""
}

export const removeElementById = (elementById: string) => {
  const ele: HTMLDivElement | null = parent.document.getElementById(elementById) as HTMLDivElement | null
  if (ele) ele.remove()
}



export const removeAllElements = (selector: string) => {
  const ele = parent.document.body.querySelectorAll(selector) as NodeListOf<HTMLElement>
  ele.forEach((e) => e.remove())
}

export const hideElementBySelector = (selector: string) => {
  const ele = parent.document.querySelector(selector) as HTMLElement
  if (ele)
    ele.style.display = "none"
}

export const clearBlocks = async (blocks: { uuid: BlockEntity["uuid"] }[]) => {
  for (const block of blocks)
    await logseq.Editor.removeBlock(block.uuid)
}

export const clearPageBlocks = async (pageTitle: string) => {
  const blocksUuid = await getPageBlocks(pageTitle) as { uuid: BlockEntity["uuid"] }[] | null
  // console.log("pageName", pageTitle)
  // console.log("blocksUuid", blocksUuid)
  if (blocksUuid && blocksUuid.length > 0)
    clearBlocks(blocksUuid)
}

/**
 * Create an HTML element with specified classes.
 * @param domElementTag The type of element to create.
 * @param classNames The classes to add to the element.
 * @returns The created HTML element.
 */
export const createElementWithClass = (domElementTag: string, ...classNames: string[]): HTMLElement => {
  const element = document.createElement(domElementTag)
  element.classList.add(...classNames)
  return element
}

/**
 * Add an event listener to an element that will be executed only once.
 * @param element The element to add the event listener to.
 * @param event The event type to listen for.
 * @param handler The event handler function.
 */
export const addEventListenerOnce = (element: HTMLElement, event: string, handler: EventListenerOrEventListenerObject) => {
  element.addEventListener(event, handler, { once: true })
}
