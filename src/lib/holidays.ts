import { HolidayUtil, Lunar } from 'lunar-typescript'
import { getConfigPreferredLanguage } from ".."
import { resolveColorChoice, toTranslucent } from './lib'


let holidaysBundle: any | null // バンドルを作成するための変数
let alreadyHolidayBundle: boolean = false // プラグイン設定変更時にバンドルを更新するためのフラグ

// date-holidaysのバンドルを作成する
export const getHolidaysBundle = async (userLanguage: string, flag?: { settingsChanged?: boolean, already?: boolean }) => {

  if (flag
    && flag.already === true
    && alreadyHolidayBundle === true)
    return // 既にバンドルを作成している場合は作成しないフラグでキャンセルする

  if ((flag
    && flag.settingsChanged !== true
    && logseq.settings!.booleanBoundariesHolidays === false) // 設定変更時はバンドルを更新する
    || logseq.settings!.booleanLunarCalendar === true // 太陰暦オンの場合はバンドルを作成しない
    && ((userLanguage === "zh-Hant"
      || userLanguage === "zh-CN")) // 中国の祝日はdate-holidaysではなくlunar-typescriptを使用する
  ) return

  userLanguage = (logseq.settings!.holidaysCountry as string || "US: United States of America").split(":")[0] //プラグイン設定で指定された言語を取得する

  // dynamically import date-holidays to avoid bundling it in the main chunk
  const HolidaysModule = await import('date-holidays')
  const Holidays = (HolidaysModule && (HolidaysModule as any).default) ? (HolidaysModule as any).default : HolidaysModule

  if (holidaysBundle === null
    || alreadyHolidayBundle === false)
    holidaysBundle = new (Holidays as any)(userLanguage, logseq.settings!.holidaysState as string, logseq.settings!.holidaysRegion as string, { types: ["public"] }) // バンドルを作成する 公共の祝日のみに限定する
  else
    holidaysBundle.init(userLanguage) // プラグイン設定変更時にバンドルを更新する
  alreadyHolidayBundle = true
}

export const exportHolidaysBundle = () => holidaysBundle // バンドルをエクスポートする

export const removeHolidaysBundle = () => {
  holidaysBundle = null
  alreadyHolidayBundle = false
}

// For Chinese lunar-calendar and holidays
export const lunarString = (targetDate: Date, dayElement: HTMLSpanElement, addToElementTip: boolean): string => {
  const getHoliday = HolidayUtil.getHoliday(targetDate.getFullYear(), targetDate.getMonth() + 1, targetDate.getDate()) // year, month, day
  const getHolidayName = getHoliday ? getHoliday.getName() : undefined
  const string = (Lunar.fromDate(targetDate).getDayInChinese() as string)
    if (getHolidayName) {
      if (addToElementTip === true)
        dayElement.title = string + ` (${getHolidayName})` + "\n"// 中国の祝日
      const cssColor = resolveColorChoice(logseq.settings!.choiceHolidaysColor as string | undefined)
      const bg = toTranslucent(cssColor, 0.12)
      // Highlight holiday by applying a subtle background and making the text bold
      dayElement.style.backgroundColor = bg
      dayElement.style.fontWeight = '700'
    } else
    dayElement.title = string + "\n"// 祝日がない場合は、旧暦 (中国の伝統的な暦) を表示する 
  return string
}


// For World holidays
export const holidaysWorld = (targetDate: Date, dayElement: HTMLSpanElement, addToElementTip: boolean): string => {
  const holidaysBundle = exportHolidaysBundle()
  if (!holidaysBundle) return ""
  const checkHoliday = holidaysBundle.isHoliday(targetDate)

  if (checkHoliday !== false
    && checkHoliday[0].type === "public") {
    const holidayName = checkHoliday[0].name
      if (holidayName) {
        if (addToElementTip === true)
          dayElement.title = holidayName + "\n"
        const cssColor = resolveColorChoice(logseq.settings!.choiceHolidaysColor as string | undefined)
        const bg = toTranslucent(cssColor, 0.12)
        // Highlight holiday by applying a subtle background and making the text bold
        dayElement.style.backgroundColor = bg
        dayElement.style.fontWeight = '700'
        return holidayName
      }
  }
  return ""
}


// 祝日情報を取得する
/**
 * Retrieves the holiday name for a given date based on the user's preferred language and settings.
 * 
 * If the user's preferred language is Chinese (either Traditional or Simplified) and the lunar calendar setting is enabled,
 * it will return the Chinese lunar calendar day along with the holiday name if it is a holiday.
 * 
 * For other languages or if the lunar calendar setting is disabled, it will return the name of the public holiday if it is a holiday.
 * 
 * @param {Date} targetDate - The date for which to retrieve the holiday name.
 * @returns {Promise<string>} - A promise that resolves to the holiday name or an empty string if there is no holiday.
 */
export const getHolidays = async (targetDate: Date):Promise<string> => {
  const configPreferredLanguage = await getConfigPreferredLanguage()
  // Chinese lunar-calendar or holidays
  if (logseq.settings!.booleanLunarCalendar === true // プラグイン設定で太陰暦オンの場合
    && (configPreferredLanguage === "zh-Hant" //中国語の場合
      || configPreferredLanguage === "zh-CN")) {
    // 中国の祝日        
    const getHoliday = HolidayUtil.getHoliday(targetDate.getFullYear(), targetDate.getMonth() + 1, targetDate.getDate()) // year, month, day
    const getHolidayName = getHoliday ? getHoliday.getName() : undefined // 中国の祝日名
    const string = (Lunar.fromDate(targetDate).getDayInChinese() as string) // 旧暦
    return getHolidayName ? string + ` (${getHolidayName})` : string
  } else {
    // World holidays
    const holidaysBundle = exportHolidaysBundle()
    if (!holidaysBundle) return ""
    const checkHoliday = holidaysBundle.isHoliday(targetDate)
    if (checkHoliday !== false
      && checkHoliday[0].type === "public") {
      const holidayName = checkHoliday[0].name
      return holidayName ? holidayName : ""
    }
  }
  return ""
}