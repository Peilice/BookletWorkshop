// 日期、天數、航程的顯示文字（網站範本共用）

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function parseDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}

// 範本的日期欄很窄，只輸出 月/日
export function shortDate(iso: string): string {
  const d = parseDate(iso)
  return d ? `${d.getMonth() + 1}/${d.getDate()}` : ''
}

export function weekday(iso: string): string {
  const d = parseDate(iso)
  return d ? WEEKDAYS[d.getDay()] : ''
}

const DIGITS = '〇一二三四五六七八九'

/** 第幾天（中文數字），例如 第二天、第十一天；1–99 */
export function chineseDay(n: number): string {
  const tens = Math.floor(n / 10)
  const ones = n % 10
  const num = (tens ? `${tens > 1 ? DIGITS[tens] : ''}十` : '') + (ones ? DIGITS[ones] : '')
  return `第${num}天`
}

/** 第一筆是去程；兩筆以上時最後一筆是回程；中間的不標 */
export function flightLeg(i: number, count: number): string {
  if (i === 0) return '去程'
  return i === count - 1 ? '回程' : ''
}
