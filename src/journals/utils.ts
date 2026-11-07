import { BlockEntity } from '@logseq/libs/dist/LSPlugin.user'

export const processJournal = async (
      match: string,
      templateName: string,
      successMessage: string,
) =>
      setTimeout(async () => {
            const currentBlockTree = await logseq.Editor.getPageBlocksTree(match) as BlockEntity[]//現在開いているページ

            let firstUuid = "" //1行目のuuidを決める
            if (currentBlockTree) {
                  //コンテンツがある場合は処理を中断する
                  //block.contentが空ではないブロックがひとつでもあったら処理を中断する
                  if (currentBlockTree.find((block) => block.content !== null)) return

                  //currentBlockTree[0]!.uuidが存在しなかったら処理を中断する
                  if (currentBlockTree[0]
                        && currentBlockTree[0].uuid)
                        firstUuid = currentBlockTree[0].uuid
                  else {
                        //ページを作成する
                        const prepend = await logseq.Editor.prependBlockInPage(match, "", {}) as { uuid: BlockEntity["uuid"] } | null //先頭に空のブロックを追加する
                        if (prepend)
                              firstUuid = prepend.uuid //uuidを取得する
                        else {
                              console.log("utils.ts: prepend is null")
                              return
                        }
                  }
                  if (logseq.settings!.quarterlyJournalSetPageTag === ""
                        && templateName === "") {
                        console.log("utils.ts: quarterlyJournalSetPageTag and templateName are empty")
                  } else {
                        const newBlockEntity = await logseq.Editor.insertBlock(firstUuid, "", { sibling: true, before: true }) as { uuid: BlockEntity["uuid"] } | null
                        if (newBlockEntity)
                              setTimeout(async () =>
                                    await journalInsertTemplate(newBlockEntity.uuid, templateName, successMessage)
                                    , 100)
                  }
            }
      }, 100)
export const journalInsertTemplate = async (uuid: string, templateName: string, successMsg: string) => {
  if (templateName === "") return
  if (await logseq.App.existTemplate(templateName) as boolean) {
    await logseq.App.insertTemplate(uuid, templateName)
    if (successMsg !== "")
      logseq.UI.showMsg(successMsg, 'success', { timeout: 2000 })
  }
  else
    logseq.UI.showMsg(`Template "${templateName}" does not exist.`, 'warning', { timeout: 2000 })
}
export const clearEleAll = (selector: string) => {
  const ele = parent.document.body.querySelectorAll(selector) as NodeListOf<HTMLElement>
  ele.forEach((e) => e.remove())
}

export const clearEle = (selector: string) => {
  const ele = parent.document.getElementById(selector) as HTMLElement | null
  if (ele) ele.remove()
}

export const hideMainContent = (selector: string) => {
  const ele = parent.document.querySelector(selector) as HTMLElement
  if (ele)
    ele.style.display = "none"
}


