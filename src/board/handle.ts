import { BlockEntity, LSPluginBaseInfo, PageEntity } from '@logseq/libs/dist/LSPlugin.user'
import { t } from 'logseq-l10n'
import Swal from 'sweetalert2' //https://sweetalert2.github.io/
import { clearPageBlocks, removeAllElements } from '../lib/lib'
import { getCurrentPageOriginalName, isPageExist } from '../lib/query/advancedQuery'
import { SettingKeys } from '../settings/SettingKeys'
import { keyAnotherJournal, keyReloadButton, keySettingsButton, keyTemplateInsertButton, keyTemplateInsertSelect, keyToolbar, mainPageTitle, mainPageTitleLower, shortKey } from './constant'
import { pageTemplate } from './embed/dayTemplates'
import { generateEmbed } from './embed/generateBlock'
import { registerLeftMenuItemsForBoard } from './leftMenuItems'
import { registerPageBarButtonsForBoard, updateTemplateInsertButton } from './pageBarButtons'

// ページを開いたらフラグを立てたままにする
let isOpeningPageName = ""

// ページを開いたとき
let isProcessingRootChanged = false

const handleRouteChangeForBoard = async (path: string, template: string) => {
  if (template !== "/page/:name" || isProcessingRootChanged) {
    clearMainPage()
    return
  }
  isProcessingRootChanged = true
  setTimeout(() => isProcessingRootChanged = false, 100)

  const pageName = path.replace(/^\/page\//, "")
  if (pageName === mainPageTitle) {
    // メインページを開いたとき
    isOpeningPageName = pageName
    await generateEmbed(keyAnotherJournal, pageName)
  } else
    clearMainPage()
}

// ほかのページを開いたときにメインページ内のブロックすべてを削除する (クリア処理)
const clearMainPage = async () => {
  if (isOpeningPageName !== "") {
    isOpeningPageName = ""
    await clearPageBlocks(mainPageTitle)
  }
}

// ボードの初期化
export const initializeBoard = () => {

  // 左メニューにボタンを設置
  registerLeftMenuItemsForBoard()

  // ページバー上にボタンを設置
  registerPageBarButtonsForBoard()

  // ページ遷移時に処理をする
  logseq.App.onRouteChanged(async ({ path, template }) => handleRouteChangeForBoard(path, template))
  //  logseq.App.onPageHeadActionsSlotted(async () => handleRouteChange())//Logseqのバグあり。動作保証が必要

  // Model
  model()

  // 設定変更時の処理
  settingsUpdateListener()

  logseq.provideStyle(`
#main-content-container {
    overflow-x: scroll;
}
#root div.cp__sidebar-main-content:has(div[id="${mainPageTitleLower}"]){
    &:not(:has(div[id="${mainPageTitleLower}"]>div.content>div.blocks-container>div>div>div.ls-block:nth-child(1)[data-collapsed~="{:db/id"])){
        max-width: var(--ls-main-content-max-width-wide);
        position: fixed;
        top: 5em;
        left: 530px;
        overflow: scroll;
        max-height: 90vh;
        margin-right: 3em;
    }
    & :is(div.page-hierarchy, div.page-unlinked) {
        display:none;
    }
    & div.ls-page-title span[data-ref="weekly-desk"] {
        font-size: medium;
    }
}

div[id="${mainPageTitleLower}"]>div.content>div.blocks-container>div>div>div.ls-block {
    &:nth-child(1):not([data-refs="[]"]) {
        min-width:500px;
        opacity: 0.8;
        position: fixed;
        top: 5em;
        left: 0.2em;
        width: 500px;
        max-width: fit-content;
        overflow:scroll;
        max-height: 90vh;
        z-index: 3;
    }
    &:not(:nth-child(1)) {
        width: auto;
        min-width:500px;
    }
    &:nth-last-child {
        clear: both;
    }
}

#root main.ls-left-sidebar-open div.cp__sidebar-main-content:has(div[id="${mainPageTitleLower}"]):not(:has(div[id="${mainPageTitleLower}"]>div.content>div.blocks-container>div>div>div.ls-block:nth-child(1)[data-collapsed~="{:db/id"])){
    left: calc(var(--ls-left-sidebar-width) + 530px);
}

#root main.ls-left-sidebar-open div[id="${mainPageTitleLower}"]>div.content>div.blocks-container>div>div>div.ls-block:nth-child(1):not([data-refs="[]"]) {
    left: calc(var(--ls-left-sidebar-width) + 0.2em);
}
    `)

}

// 設定変更時の処理
const settingsUpdateListener = () =>
  logseq.onSettingsChanged((newSet: LSPluginBaseInfo["settings"], oldSet: LSPluginBaseInfo["settings"]) => {

    // 左メニューの項目のトグル
    if (oldSet[SettingKeys.addLeftMenu] !== newSet[SettingKeys.addLeftMenu]) {
      if (newSet[SettingKeys.addLeftMenu] === false)
        removeAllElements(`.${shortKey}--nav-header`)
      else
        registerLeftMenuItemsForBoard()
    }

    // boardに関係する設定項目がユーザーによって変更された場合
    // (headingBatchBoard,addLeftMenu,show7days,show7daysNotExist,showMemo,showMemoPageName,showLinkedReferences,showTasks,showTasksToday,showTasks7days,showTasksUnplanned)
    if (
      oldSet[SettingKeys.headingBatchBoard] !== newSet[SettingKeys.headingBatchBoard]
      || oldSet[SettingKeys.addLeftMenu] !== newSet[SettingKeys.addLeftMenu]
      || oldSet[SettingKeys.show7days] !== newSet[SettingKeys.show7days]
      || oldSet[SettingKeys.show7daysNotExist] !== newSet[SettingKeys.show7daysNotExist]
      || oldSet[SettingKeys.showMemo] !== newSet[SettingKeys.showMemo]
      || oldSet[SettingKeys.showMemoPageName] !== newSet[SettingKeys.showMemoPageName]
      || oldSet[SettingKeys.showLinkedReferences] !== newSet[SettingKeys.showLinkedReferences]
      || oldSet[SettingKeys.showTasks] !== newSet[SettingKeys.showTasks]
      || oldSet[SettingKeys.showTasksToday] !== newSet[SettingKeys.showTasksToday]
      || oldSet[SettingKeys.showTasks7days] !== newSet[SettingKeys.showTasks7days]
      || oldSet[SettingKeys.showTasksUnplanned] !== newSet[SettingKeys.showTasksUnplanned]
    ) {
      // キャッシュを無効にする
      logseq.updateSettings({
        // フラグを立てる
        [`cashBatch-${keyAnotherJournal}-reloadFlag`]: true,
        // キャッシュを削除する
        [`cashBatch-${keyAnotherJournal}`]: undefined,
      })
    }


    // additionalTemplates が変更された場合
    if (oldSet[SettingKeys.additionalTemplates] !== newSet[SettingKeys.additionalTemplates]) {
      // ページバーのテンプレート挿入用ボタンを更新する
      updateTemplateInsertButton()
    }
  })

// ボタン処理中フラグ
let processingButton = false

// Model
const model = () =>
  logseq.provideModel({

    [keyToolbar]: async () => {// ツールバーボタンが押されたら
      if (processingButton) return
      processingButton = true
      setTimeout(() => processingButton = false, 100)
      if (await isPageExist(mainPageTitle) as boolean)
        logseq.App.pushState('page', { name: mainPageTitle })// ページを開く
      else {
        await logseq.Editor.createPage(mainPageTitle, { public: false }, { createFirstBlock: false })
        setTimeout(() => {
          const runButton = parent.document.getElementById(keyReloadButton) as HTMLElement | null
          if (runButton)
            runButton.click()
        }, 300)
      }
      logseq.UI.showMsg(`${mainPageTitle}`, "info", { timeout: 2200 })
    },

    [keySettingsButton]: () => {// 設定ボタンが押されたら
      if (processingButton) return
      processingButton = true
      setTimeout(() => processingButton = false, 100)

      logseq.showSettingsUI()
    },

    [keyReloadButton]: async () => {// リロードボタンが押されたら
      if (processingButton) return
      processingButton = true
      setTimeout(() => processingButton = false, 100)

      // currentPage.nameがQuickly-PARA-Method-Plugin/Projectsの場合に、スラッシュの右側Projectsの部分を取得
      // const type = currentPage.originalName.split("/")[1]
      logseq.updateSettings({
        [`cashBatch-${keyAnotherJournal}`]: undefined,
        [`cashBatch-${keyAnotherJournal}-reloadFlag`]: true,
      })
      logseq.App.pushState('page', { name: mainPageTitle })// ページを開く // (mainPageTitle + "/" + type)
    },


    [keyTemplateInsertButton]: () => {
      if (processingButton) return
      processingButton = true
      setTimeout(() => processingButton = false, 100)
      const select = parent.document.getElementById(keyTemplateInsertSelect) as HTMLSelectElement | null
      if (select)
        select.style.display = "block"
    },

    [keyTemplateInsertSelect]: async () => {
      if (processingButton) return
      processingButton = true
      setTimeout(() => processingButton = false, 100)
      const select = parent.document.getElementById(keyTemplateInsertSelect) as HTMLSelectElement | null
      if (select) {
        // selectを非表示にする
        select.style.display = "none"

        // select の value が空の場合は、テンプレートを挿入しない
        if (select.value !== "") {
          // select.valueが sunday..saturday など曜日名のいずれかの場合
          const templateName = (select.value === "sunday" || select.value === "monday" || select.value === "tuesday" || select.value === "wednesday" || select.value === "thursday" || select.value === "friday" || select.value === "saturday")
            ? logseq.settings![SettingKeys[select.value + "Template"]] as string || ""
            : select.value || ""
          if (templateName !== ""
            && await logseq.App.existTemplate(templateName)) {
            logseq.showMainUI()
            // 現在のページの名前を取得する
            const currentPageName = await getCurrentPageOriginalName() as PageEntity["original-name"] | null
            if (currentPageName) {
              // confirmでユーザーに確認してから実行
              // ページのブロックをすべて削除し、テンプレートに置き換えます。
              const userConfirm = await Swal.fire({
                title: t("Are you sure you want to insert the template?"),
                text: `
                ${t("All blocks will be deleted and replaced with the template.")}
                ${t("Current page name")}: [[${currentPageName}]]
                ${t("Template name")}: ${templateName}
                `,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: t("Yes"),
                cancelButtonText: t("No"),
                theme: "auto",
              })
              if (userConfirm.isConfirmed) {
                await logseq.Editor.exitEditingMode(false) // 編集モードを終了する
                // ページのブロックを取得する
                const blocks = await logseq.Editor.getPageBlocksTree(currentPageName as string) as BlockEntity[] | null
                if (blocks) {
                  // ブロックを削除する
                  for (const block of blocks)
                    await logseq.Editor.removeBlock(block.uuid)
                  await new Promise(resolve => setTimeout(resolve, 100))// 0.1秒待つ
                  // テンプレートを挿入する
                  const result = await pageTemplate(templateName, currentPageName as string)
                  // テンプレートを挿入したことをユーザーに知らせる
                  if (result)
                    logseq.UI.showMsg(t("Template inserted"), "info", { timeout: 5000 })
                }
              }
            }
            logseq.hideMainUI({ restoreEditingCursor: false })
          } else
            logseq.UI.showMsg(t("Template not found") + ": " + templateName, "info", { timeout: 5000 })
        }

        // selectの選択状態を解除する
        select.selectedIndex = 0
      }
    },
  })/* end_model */
