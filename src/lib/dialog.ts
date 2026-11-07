import { t } from "logseq-l10n"

// Lightweight built-in confirm dialog implemented with <dialog>, falling back to a simple overlay
// Uses `logseq-l10n`'s `t()` for translations.
const injectedModalStyleId = 'ls-plugin-simple-modal-style'
const ensureModalStyle = () => {
  if (parent.document.getElementById(injectedModalStyleId)) return
  const style = parent.document.createElement('style')
  style.id = injectedModalStyleId
  style.textContent = `
  dialog.ls-plugin-modal{border:none;border-radius:8px;padding:1rem;max-width:520px;width:90%;box-shadow:0 10px 30px rgba(0,0,0,0.2);background:var(--ls-ui-bg, white);color:var(--ls-ui-fg, #111);font-family:inherit}
  dialog.ls-plugin-modal::backdrop{background:rgba(0,0,0,0.4);z-index:99999}
  dialog.ls-plugin-modal h3{margin:0 0 0.5rem;font-size:1.1rem}
  dialog.ls-plugin-modal div{font-size:small;margin:0 0 1rem;white-space:pre-wrap;font-weight:500}
  .ls-plugin-modal-actions{display:flex;gap:0.5rem;justify-content:flex-end}
  .ls-plugin-modal-actions button{padding:0.45rem 0.8rem;border-radius:6px;border:none;cursor:pointer;font-weight:600}
  dialog.ls-plugin-modal button.confirm, dialog.ls-plugin-modal button.confirm:focus{background:#ffd54f;color:#000 !important;box-shadow:0 2px 6px rgba(0,0,0,0.12);text-shadow:none}
  dialog.ls-plugin-modal button.cancel, dialog.ls-plugin-modal button.cancel:focus{background:#d33;color:#fff !important;box-shadow:0 2px 6px rgba(211,51,51,0.25)}
  /* Fallback overlay styles for environments without <dialog> support */
  .ls-plugin-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:99999}
  .ls-plugin-modal-fallback{background:var(--ls-ui-bg, white);color:var(--ls-ui-fg, #111);max-width:520px;width:90%;padding:1rem;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.2);}
  `
  parent.document.head.appendChild(style)
}

export const escapeHtml = (unsafe: string) => {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export const showConfirmDialog = (title: string, text: string, opts?: { confirmText?: string; cancelText?: string }) => {
  ensureModalStyle()
  return new Promise<boolean>((resolve) => {
    // Create a <dialog> and use its built-in modal behavior if supported by the host
    try {
      const dialog = parent.document.createElement('dialog') as HTMLDialogElement
      dialog.className = 'ls-plugin-modal'
      dialog.setAttribute('aria-modal', 'true')

      const safeTitle = escapeHtml(title)
      const safeText = escapeHtml(text).replace(/\n/g, '<br>')

      dialog.innerHTML = `
        <form method="dialog" style="margin:0">
          <h3>${safeTitle}</h3>
          <hr/>
          <div>${safeText}</div>
          <div class="ls-plugin-modal-actions">
            <button type="button" class="cancel">${escapeHtml(opts?.cancelText ?? t('Cancel'))}</button>
            <button type="submit" class="confirm">${escapeHtml(opts?.confirmText ?? t('Confirm'))}</button>
          </div>
        </form>
      `

      // result stored on dataset by button handlers
      const onClose = () => {
        const res = dialog.dataset.result
        dialog.removeEventListener('close', onClose)
        dialog.remove()
        resolve(res === 'confirm')
      }

      dialog.addEventListener('close', onClose)
      // ESC triggers 'cancel' event on dialog
      dialog.addEventListener('cancel', (e) => {
        dialog.dataset.result = 'cancel'
      })

      parent.document.body.appendChild(dialog)

      const btnCancel = dialog.querySelector('button.cancel') as HTMLButtonElement
      const btnConfirm = dialog.querySelector('button.confirm') as HTMLButtonElement

      btnCancel.addEventListener('click', () => {
        dialog.dataset.result = 'cancel'
        try { dialog.close() } catch { /* ignore */ }
      })

      btnConfirm.addEventListener('click', () => {
        // submit will close the dialog; mark result first
        dialog.dataset.result = 'confirm'
      })

      // clicking on backdrop should cancel
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          dialog.dataset.result = 'cancel'
          try { dialog.close() } catch { /* ignore */ }
        }
      })

      // Show modal
      if (typeof dialog.showModal === 'function') {
        dialog.showModal()
      } else {
        // If showModal not supported, throw to go to fallback
        throw new Error('showModal not supported')
      }
    } catch (e) {
      // Fallback to overlay-based modal for environments where <dialog> isn't available
      const overlay = parent.document.createElement('div')
      overlay.className = 'ls-plugin-modal-overlay'

      const modal = parent.document.createElement('div')
      modal.className = 'ls-plugin-modal-fallback'

      const h = parent.document.createElement('h3')
      h.textContent = title
      modal.appendChild(h)

      const p = parent.document.createElement('p')
      p.innerHTML = text.replace(/\n/g, '<br>')
      modal.appendChild(p)

      const actions = parent.document.createElement('div')
      actions.className = 'ls-plugin-modal-actions'

      const btnCancel = parent.document.createElement('button')
      btnCancel.className = 'cancel'
      btnCancel.textContent = opts?.cancelText ?? t('Cancel')
      btnCancel.addEventListener('click', () => {
        overlay.remove()
        resolve(false)
      })

      const btnConfirm = parent.document.createElement('button')
      btnConfirm.className = 'confirm'
      btnConfirm.textContent = opts?.confirmText ?? t('Confirm')
      btnConfirm.addEventListener('click', () => {
        overlay.remove()
        resolve(true)
      })

      actions.appendChild(btnCancel)
      actions.appendChild(btnConfirm)
      modal.appendChild(actions)
      overlay.appendChild(modal)
      parent.document.body.appendChild(overlay)
    }
  })
}
