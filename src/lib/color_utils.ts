import { DayShortCode } from "../types"

export const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as DayShortCode[]

export const colorMap: { [key: string]: string } = {
  blue: 'var(--ls-wb-stroke-color-blue)',
  red: 'var(--ls-wb-stroke-color-red)',
  green: 'var(--ls-wb-stroke-color-green)'
}

// Resolve a choice value from settings into a CSS color string the code can use directly.
// - If the choice matches a key in colorMap, return that mapped CSS var.
// - If the choice looks like a CSS variable name (starts with "--"), return `var(--name)`.
// - If the choice is falsy or 'unset', fall back to the provided fallback variable (default `--highlight-bg-color`).
export const resolveColorChoice = (choice?: string | null, fallbackVar = '--highlight-bg-color'): string => {
  if (!choice || choice === 'unset') return `var(${fallbackVar})`
  if (Object.prototype.hasOwnProperty.call(colorMap, choice)) return colorMap[choice]
  if (typeof choice === 'string' && choice.startsWith('--')) return `var(${choice})`
  return choice // assume it's a plain valid CSS color like '#f00' or 'rgb(...)'
}

// Convert a CSS color (hex, rgb(a), or var(...)/keyword) to a translucent rgba string when possible.
// If conversion isn't possible (e.g., CSS variable or keyword), return the original string.
export const toTranslucent = (cssColor: string, alpha = 0.12): string => {
  if (!cssColor) return `rgba(0,0,0,${alpha})`
  // hex #RRGGBB or #RGB
  const hexMatch = cssColor.match(/^#([0-9a-fA-F]{3}){1,2}$/)
  if (hexMatch) {
    let hex = cssColor.substring(1)
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('')
    }
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  // rgb(...) or rgba(...)
  const rgbMatch = cssColor.match(/rgba?\s*\(([^)]+)\)/)
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map(p => p.trim())
    const r = parseInt(parts[0], 10)
    const g = parseInt(parts[1], 10)
    const b = parseInt(parts[2], 10)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  // For CSS variables and keywords, we can't compute translucency here — return as-is
  // Use color-mix to create a translucent version when possible (supports var(...) and keywords)
  try {
    const pct = Math.round(alpha * 100)
    return `color-mix(in srgb, ${cssColor} ${pct}%, transparent)`
  } catch (e) {
    return cssColor
  }
}

/**
 * Get weekend color for a DayShortCode (e.g., 'Sun','Mon',...)
 * Returns a CSS color string or undefined.
 */
export const getWeekendColor = (day: string) => {
  const color = colorMap[logseq.settings!["userWeekend" + day as keyof typeof logseq.settings] as string]
  return color
}
