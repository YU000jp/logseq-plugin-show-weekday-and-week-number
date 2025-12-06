export const KEY_BOUNDARIES_ROOT = 'boundaries-root'

/**
 * Ensure a mount point exists inside the given parent element for a React two-line calendar.
 * Returns the mount element (existing or newly created).
 */
export const ensureBoundariesMountPoint = (parentElement: HTMLElement): HTMLElement => {
             try {
                          const doc = parent.document
                          const parentAny = parent as any
                          // Reuse cached mount point if present
                          let cached = parentAny.__boundariesMountPoint as HTMLElement | undefined
                          if (cached) {
                                       // If cached element is not attached to desired parentElement, move it
                                       try {
                                                    if (cached.parentElement !== parentElement) parentElement.appendChild(cached)
                                       } catch (e) { /* ignore move errors */ }
                                       return cached
                          }

                          // Try to find by id in parent document
                          let root = doc.getElementById(KEY_BOUNDARIES_ROOT) as HTMLElement | null
                          if (!root) {
                                       root = doc.createElement('div')
                                       root.id = KEY_BOUNDARIES_ROOT
                                       root.className = 'nav-two-line-calendar-root'
                                       parentElement.appendChild(root)
                          } else {
                                       // ensure it's placed inside the requested parentElement
                                       if (root.parentElement !== parentElement) {
                                                    try { parentElement.appendChild(root) } catch (e) { /* ignore */ }
                                       }
                          }
                          parentAny.__boundariesMountPoint = root
                          return root
             } catch (e) {
                          // In environments without parent, fall back to creating an element in current document
                          let root = document.getElementById(KEY_BOUNDARIES_ROOT) as HTMLElement | null
                          if (!root) {
                                       root = document.createElement('div')
                                       root.id = KEY_BOUNDARIES_ROOT
                                       root.className = 'nav-two-line-calendar-root'
                                       parentElement.appendChild(root)
                          } else {
                                       if (root.parentElement !== parentElement) {
                                                    try { parentElement.appendChild(root) } catch (e) { /* ignore */ }
                                       }
                          }
                          return root
             }
}
