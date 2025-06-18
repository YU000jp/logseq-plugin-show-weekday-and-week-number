import { boundariesProcess } from "../calendar/boundaries"

//boundaries 実行ロックのため
let processingBoundaries: boolean = false
// Boundaries(2行カレンダー)を呼び出す

export const invokeBoundaryHandler = (targetElementName: string, remove?: boolean) => {
  if (processingBoundaries) return
  processingBoundaries = true
  try {
    boundariesProcess(targetElementName, remove ? remove : false, 0)
  } finally {
    processingBoundaries = false // 確実にフラグを解除
  }
}
