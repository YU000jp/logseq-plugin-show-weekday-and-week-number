import { BlockEntity, BlockUUID } from "@logseq/libs/dist/LSPlugin.user"
import { getPageBlocks } from "./query/advancedQuery"

// タイトル要素の判定: 旧UIは h1.title、新UI(DB系アプリ+ファイルグラフ)は span.block-title-wrap
export const isJournalTitleElement = (el: HTMLElement): boolean =>
  el.classList.contains("title") || el.classList.contains("block-title-wrap")

export const removeProvideStyle = (className: string) => {
  const doc = parent.document.head.querySelector(
    `style[data-injected-style^="${className}"]`
  ) as HTMLStyleElement | null
  if (doc) doc.remove()
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
  const element = parent.document.createElement(domElementTag)
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
