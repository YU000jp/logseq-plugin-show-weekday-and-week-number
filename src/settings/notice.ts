export const notice = () => {
      // メッセージを表示する
      const notice = "20240714notice01"
      if (logseq.settings!.weekNumberFormat !== undefined
            && logseq.settings!.notice !== notice) {
            logseq.updateSettings({ notice })
            setTimeout(() => {
                  // マークダウン形式でメッセージを表示する
                  logseq.UI.showMsg(`
  
      [:h3 📆"Show weekday and week-number" plugin Updated!]


      [:p New feature: **Monthly Calendar in left sidebar**]

      It is on by default. If not required, turn it off via the plugin settings.
      
      `, "info", { timeout: 8500 })
                  ;(async () => { try { await (logseq.App as any).invokeExternalCommand("logseq.ui/toggle-settings") } catch (e) { /* ignore */ } })()
            }, 5000)
      }
}