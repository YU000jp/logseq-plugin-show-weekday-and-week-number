import { t } from 'logseq-l10n'
import { keyPageBarId, mainPageTitle, keyToggleButton, keySettingsButton, keyReloadButton, mainPageTitleLower } from './constant'


export const registerPageBarButtonsForBoard = () => {
  // ページバーにボタンを追加
  logseq.App.registerUIItem('pagebar', {
    key: keyPageBarId,
    template: `
      <div id="${keyPageBarId}" title="${mainPageTitle} ${t("Plugin")}">
      <button id="${keySettingsButton}" data-on-click="${keySettingsButton}" title="${t("Plugin settings")}">⚙</button>
      <button id="${keyReloadButton}" data-on-click="${keyReloadButton}" title="${t("Update the list")}">◆ ${t("Reload")}</button>
      </div>
      <style>
      #${keyPageBarId} {
        display: none;
      }
      div.page:has([id="${t(mainPageTitleLower)}"i]) #${keyPageBarId} {
        display: block;
      }
      </style>
      `,
  })
}
