import { AppInfo } from "@logseq/libs/dist/LSPlugin"
import { replaceLogseqDbGraph, replaceLogseqMdModel, replaceLogseqVersion } from "."

// Check if the model is Markdown-based. Returns false for DB models.
const checkLogseqVersion = async (): Promise<boolean> => {
    const logseqInfo = (await logseq.App.getInfo("version")) as AppInfo | any
    // The version format is like "0.11.0" or "0.11.0-alpha+nightly.20250427".
    // Extract the first three numeric parts (1-digit, 2-digit, 2-digit) using a regular expression.
    const version = logseqInfo.match(/(\d+)\.(\d+)\.(\d+)/)
    if (version) {
        replaceLogseqVersion(version[0]) // Update the version
        // If the version is 0.10.* or lower, set logseqVersionMd to true.
        if (version[0].match(/0\.([0-9]|10)\.\d+/)) {
            return true
        }
    } else {
        replaceLogseqVersion("0.0.0") // Update the version
    }
    return false
}

// Check if the graph is a DB graph. Returns true only for DB graphs.
const checkLogseqDbGraph = async (): Promise<boolean> => (logseq.App as any).checkCurrentIsDbGraph() as boolean || false

// Show a warning message if the graph is a DB graph and limit the message to 3 times.
const showDbGraphIncompatibilityMsg = () => {
    if (!logseq.settings!.warningMessageShownDbGraph) {
        // Do not show the notification after the third time. Increment the count.
        logseq.updateSettings({
            warningMessageShownDbGraph: true
        })
        logseq.UI.showMsg("The ’Page-tags and Hierarchy’ plugin does not support Logseq DB graph.", "warning", { timeout: 5000 })
    }
    return
}

/**
 * Checks the Logseq model type (Markdown or DB graph) and handles related state and UI updates.
 * @returns Promise<boolean[]> - [isDbGraph, isMdModel]
 */
export const logseqModelCheck = async (): Promise<boolean[]> => {
    const logseqMdModel = await checkLogseqVersion() // Check if it's an MD model
    replaceLogseqMdModel(logseqMdModel)
    const logseqDbGraph = logseqMdModel === true ?
        false
        : await checkLogseqDbGraph() // Check if it's a DB graph
    replaceLogseqDbGraph(logseqDbGraph)
    // Wait for 100ms
    await new Promise(resolve => setTimeout(resolve, 100))

    if (logseqDbGraph === true) {
        // Not supported for DB graph
        showDbGraphIncompatibilityMsg()
    }

    logseq.App.onCurrentGraphChanged(async () => { // Callback when the graph changes

        const logseqDbGraph = await checkLogseqDbGraph()
        if (logseqDbGraph === true) {
            // Not supported for DB graph
            showDbGraphIncompatibilityMsg()

            // Remove unused <style> elements


        } else {
            // Set styles according to the model
            

        }
        /* Update user settings */
        
        
    })
    return [logseqDbGraph, logseqMdModel] // Return [isDbGraph, isMdModel]
}
