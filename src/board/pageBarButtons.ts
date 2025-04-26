import { t } from 'logseq-l10n'
import { keyPageBarId, keyPageBarIdTemplateInsert, keyReloadButton, keySettingsButton, keyTemplateInsertButton, keyTemplateInsertSelect, mainPageTitle, mainPageTitleLower } from './constant'


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
  // ページバーにテンプレート挿入用ボタンを追加
  logseq.App.registerUIItem('pagebar', {
    key: keyPageBarIdTemplateInsert,
    template: `
      <select id="${keyTemplateInsertSelect}" data-on-change="${keyTemplateInsertSelect}" style="display: none;">
        <option value="">${t("Select template")}</option>
        <option value="sunday">${t("Sunday")}</option>
        <option value="monday">${t("Monday")}</option>
        <option value="tuesday">${t("Tuesday")}</option>
        <option value="wednesday">${t("Wednesday")}</option>
        <option value="thursday">${t("Thursday")}</option>
        <option value="friday">${t("Friday")}</option>
        <option value="saturday">${t("Saturday")}</option>
        <option value="">${t("Cancel")}</option>
      </select>
      <button id="${keyTemplateInsertButton}" data-on-click="${keyTemplateInsertButton}" title="${t("Insert template")}\n(Show weekday and week number plugin)">🔧</button>
      <style>
      div.page:not(.is-journals) #${keyTemplateInsertButton} {
        display:none;
      }
      #${keyTemplateInsertSelect} {
          background-color: var(--ls-quaternary-background-color);
          color: var(--ls-primary-text-color);
          &[style*="display: block"] {
            &+button#${keyTemplateInsertButton} {
              display: none;
            }
            & option {
              background-color: var(--ls-quaternary-background-color);
              color: var(--ls-primary-text-color);
            }
          }
      }
      </style>
      `,
  })
}
