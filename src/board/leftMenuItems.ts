import { keyLeftMenu, leftMenuItems, mainPageTitle, shortKey } from "./constant"
import { removeElementById } from "../lib/lib"


export const registerLeftMenuItemsForBoard = () => {
             leftMenuItems.forEach(item => eachItems(keyLeftMenu + "-" + item.suffix, item.icon, item.title, mainPageTitle))
}


const eachItems = (divId: string, icon: string, title: string, baseName: string) => {
             try {
                          removeElementById(divId)
             } finally {
                          const leftSidebarElement = parent.document.querySelector("#left-sidebar div.nav-header") as HTMLElement | null
                          if (leftSidebarElement) {
                                       const div = document.createElement("div")
                                       div.id = divId
                                       div.className = `${shortKey}--nav-header`
                                       leftSidebarElement.appendChild(div)

                                       const anchor = document.createElement("a")
                                       anchor.className = "item group flex items-center text-sm font-medium rounded-md"

                                       // ページを開く
                                       setTimeout(() => {
                                                    anchor.addEventListener("click", () => logseq.App.pushState('page', { name: (baseName) }))
                                       }, 400)

                                       div.appendChild(anchor)

                                       const spanIcon = document.createElement("span")
                                       spanIcon.className = "ui__icon ti ls-icon-files"
                                       spanIcon.textContent = icon
                                       anchor.appendChild(spanIcon)

                                       const span = document.createElement("span")
                                       span.className = ("flex-1")
                                       span.textContent = title
                                       anchor.appendChild(span)
                          }
             }
}
