import { PageEntity } from "@logseq/libs/dist/LSPlugin.user"
import { t } from "logseq-l10n"
import { booleanDbGraph } from ".."
import { showConfirmDialog } from "./dialog"
import { findDbWeeklyPageUuid, findPageUuid, parseWeeklyPageName } from "./query/advancedQuery"

/**
 * When a weekly page is not found on DB graph, guide the user to create it manually.
 * 
 * Note: On Logseq DB graphs, it is not possible to automatically create weekly pages
 * via the plugin API and set them as children of a year page in Library.
 * 
 * Reasons:
 * - `createPage` API does not work correctly on DB graphs
 * - `:block/namespace` cannot be set directly from the plugin API
 * - `Extends` property is for tag parent relationships, not for page namespaces
 * 
 * Users are guided to create manually with the following steps:
 * 1. Open Library
 * 2. Open the year page (e.g., "2026")
 * 3. Add `[[W42]]` as a child block
 * 4. Convert `[[W42]]` to a page with `#Page` tag
 * 
 * @param year Year (e.g., "2026")
 * @param weekName Week name (e.g., "W42")
 * @returns Always null (no auto-creation)
 */
export const createDbWeeklyPage = async (year: string, weekName: string): Promise<string | null> => {
  // Auto-creation of weekly pages is not possible on DB graphs; only guide manual creation
  logseq.UI.showMsg(
    `Weekly page "${weekName}" does not exist. Please create it manually in Library under "${year}" by adding [[${weekName}]] and tagging it with #Page.`,
    'warning',
    { timeout: 8000 }
  )
  return null
}

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
    let weeklyUuid: string | null | false = await findDbWeeklyPageUuid(weekly.year, weekly.week)
    
    // If weekly page is not found on DB graph, attempt auto-creation
    if (!weeklyUuid) {
      weeklyUuid = await createDbWeeklyPage(weekly.year, weekly.week)
      
      if (weeklyUuid) {
        // After successful creation, open the page
        if (shiftKey === true) {
          await logseq.Editor.openInRightSidebar(weeklyUuid)
        } else {
          logseq.App.pushState('page', { name: weeklyUuid })
        }
      } else {
        // If creation fails, show a warning message
        logseq.UI.showMsg(`Weekly page "${weekly.week}" was not found under "${weekly.year}".`, 'warning', { timeout: 4000 })
      }
    } else if (shiftKey === true) {
      await logseq.Editor.openInRightSidebar(weeklyUuid)
    } else {
      logseq.App.pushState('page', { name: weeklyUuid })
    }
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
  // On DB graphs, findPageUuid query may not work correctly
  // Prioritize using logseq.Editor.getPage() API
  let pageUuid: PageEntity["uuid"] | false = false
  
  const isDb = booleanDbGraph()
  
  if (isDb) {
    // On DB graphs, page names may be stored in different formats
    // Try multiple formats
    const page = await logseq.Editor.getPage(pageName)
    
    if (page?.uuid) {
      pageUuid = page.uuid
    } else {
      // Retry by converting slashes to dashes
      const dashName = pageName.replace(/\//g, '-')
      if (dashName !== pageName) {
        const page2 = await logseq.Editor.getPage(dashName)
        if (page2?.uuid) pageUuid = page2.uuid
      }
      
      // Last resort: search by journalDay attribute
      if (!pageUuid) {
        const journalDayMatch = pageName.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
        if (journalDayMatch) {
          // Search in yyyyMMdd format (e.g., 20261107)
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
      // On DB graphs, pushState('page', { name: uuid }) format is required
      logseq.App.pushState('page', { name: pageUuid })
    } else {
      logseq.App.pushState('page', { name: pageName })
    }
  } else {
    await promptCreateIfMissing()
  }
}
