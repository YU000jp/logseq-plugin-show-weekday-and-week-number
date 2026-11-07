import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin.user"
import { t } from "logseq-l10n"
import { booleanDbGraph } from ".."
import { showConfirmDialog } from "./dialog"
import { findDbWeeklyPageUuid, findPageUuid, parseWeeklyPageName } from "./query/advancedQuery"

export const openPageFromPageName = async (pageName: string, shiftKey: boolean) => {
  // Helper to prompt user to create page when it does not exist
  const isJournalPageName = (name: string) => {
    if (!name) return false
    // yyyy/MM/dd or yyyy-MM-dd (allow single-digit month/day)
    const dRegex = /^\d{4}([\/\-])\d{1,2}\1\d{1,2}$/
    // yyyy/MM or yyyy-MM (monthly journal)
    const mRegex = /^\d{4}([\/\-])\d{1,2}$/
    // weekly patterns: contains Wnn like 2024/W01 or 2024-W01 or 2024/Q1/W01 variants
    const wRegex = /W\d{2}/
    return dRegex.test(name) || wRegex.test(name) || mRegex.test(name)
  }
  const promptCreateIfMissing = async (): Promise<void> => {
    logseq.UI.showMsg(`Page "${pageName}" does not exist.`, 'warning', { timeout: 5000 })
    const confirmed = await showConfirmDialog(
      t("Do you want to continue?"),
      `${t("Page not found")}\n\n${t("Create a new page.")}\n\n[[${pageName}]]`,
      { confirmText: t('Confirm'), cancelText: t('Cancel') }
    )
    if (confirmed) {
        // DB graph: block-based pages should not use slash-containing journal names.
        if (booleanDbGraph() && pageName.includes('/')) {
          // Regexes for date-like and weekly patterns
          const dRegex = /^\d{4}([\/\-])\d{1,2}\1\d{1,2}$/
          const mRegex = /^\d{4}([\/\-])\d{1,2}$/
          const wRegex = /W\d{2}/

          // Allow monthly journal names (yyyy/MM or yyyy-MM) to be created on DB graphs
          if (mRegex.test(pageName)) {
            // permit creation — fall through to creation logic below
          }
          // If it's a daily-like name (yyyy/MM/dd), instruct user to change Logseq app date format.
          else if (dRegex.test(pageName)) {
            await showConfirmDialog(
              t('Cannot create daily journal'),
              `${t('Your graph is a DB graph. Pages with slashes in the name (e.g. yyyy/MM/dd) cannot be created.')}
\n${t('Please change Logseq application date format to use dashes (recommended: yyyy-MM-dd) and try again.')}`,
              { confirmText: t('Open settings'), cancelText: t('Cancel') }
            )
            try { await (logseq.App as any).invokeExternalCommand("logseq.ui/toggle-settings") } catch (e) { /* ignore */ }
            return
          }
          // If it's a weekly-like name that contains a slash, instruct to change plugin settings to non-slash format
          else if (wRegex.test(pageName) && pageName.includes('/')) {
            await showConfirmDialog(
              t('Cannot create weekly journal'),
              `${t('Your graph is a DB graph. Weekly journal names containing slashes cannot be created.')}
\n${t('Please change the week-number format in plugin settings to a format without slashes and try again.')}`,
              { confirmText: t('Open plugin settings'), cancelText: t('Cancel') }
            )
            try { await (logseq.App as any).invokeExternalCommand("logseq.ui/toggle-settings") } catch (e) { /* ignore */ }
            return
          }
          // For other slash-containing names on DB graphs, do not auto-create; warn and abort.
          else {
            logseq.UI.showMsg(t('Cannot create page with slash in name on DB graph.'), 'warning', { timeout: 4000 })
            return
          }
        }
        //ページが存在しない場合は、ページを作成する
        const createName = booleanDbGraph() && isJournalPageName(pageName) ? `${pageName} #Journal` : pageName
        await logseq.Editor.createPage(createName, {}, { createFirstBlock: true, redirect: true })
        logseq.UI.showMsg(t("Page created successfully."), 'success', { timeout: 2000 })
    } else {
      logseq.UI.showMsg(t("Cancelled"), "warning")
    }
  }

  // DB graph: weekly journals live under the year page, so look them up by parent instead of by "yyyy/Wnn"
  const weekly = booleanDbGraph() ? parseWeeklyPageName(pageName) : null
  if (weekly) {
    const weeklyUuid = await findDbWeeklyPageUuid(weekly.year, weekly.week)
    if (!weeklyUuid)
      logseq.UI.showMsg(`Weekly page "${weekly.week}" was not found under "${weekly.year}".`, 'warning', { timeout: 4000 })
    else if (shiftKey === true)
      await logseq.Editor.openInRightSidebar(weeklyUuid)
    else
      logseq.App.pushState('page', { name: weeklyUuid })
    return
  }

  if (shiftKey === true) {
    const pageUuid = await findPageUuid(pageName) as PageEntity["uuid"] | false
    if (pageUuid) {
      await logseq.Editor.openInRightSidebar(pageUuid) // open existing page in right sidebar
    } else {
      // Provide feedback and option to create when shift-click requested but page missing
      await promptCreateIfMissing()
    }
    return
  }
  // DBグラフでは findPageUuid のクエリが正しく動作しない場合があるため
  // logseq.Editor.getPage() API を優先して使用する
  let pageUuid: PageEntity["uuid"] | false = false
  
  const isDb = booleanDbGraph()
  
  if (isDb) {
    // DBグラフではページ名が異なる形式で保存されている可能性がある
    // 複数の形式で試す
    const page = await logseq.Editor.getPage(pageName)
    
    if (page?.uuid) {
      pageUuid = page.uuid
    } else {
      // スラッシュをダッシュに変換して再試行
      const dashName = pageName.replace(/\//g, '-')
      if (dashName !== pageName) {
        const page2 = await logseq.Editor.getPage(dashName)
        if (page2?.uuid) pageUuid = page2.uuid
      }
      
      // journalDay属性で検索する最後の手段
      if (!pageUuid) {
        const journalDayMatch = pageName.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
        if (journalDayMatch) {
          // yyyyMMdd 形式で検索 (例: 20261107)
          const journalDay = journalDayMatch[1] + journalDayMatch[2].padStart(2, '0') + journalDayMatch[3].padStart(2, '0')
          const queryResult = await logseq.DB.datascriptQuery(`
            [:find (pull ?b [:block/uuid :block/title :block/name :block/journal-day])
             :in $ ?jd
             :where
             [?b :block/journal-day ?jd]]
          `, journalDay)
          if (queryResult && queryResult.length > 0) {
            pageUuid = queryResult[0][0].uuid
          }
        }
      }
    }
  } else {
    pageUuid = await findPageUuid(pageName) as PageEntity["uuid"] | false
  }
  
  if (pageUuid) {
    if (isDb) {
      // DBグラフでは pushState('page', { name: uuid }) の形式が必要
      logseq.App.pushState('page', { name: pageUuid })
    } else {
      logseq.App.pushState('page', { name: pageName })
    }
  } else {
    await promptCreateIfMissing()
  }
}
