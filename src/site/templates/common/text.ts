// 收集手冊裡所有會顯示的字，給內文也用網路字型的範本下載子集

import type { SiteData } from '../../siteData'

const SKIP = new Set(['tripKey', 'palette', 'colors', 'color', 'mapUrl', 'iso', 'mode', 'icon'])

function collect(v: unknown, out: string[]) {
  if (typeof v === 'string') out.push(v)
  else if (Array.isArray(v)) v.forEach((x) => collect(x, out))
  else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) if (!SKIP.has(k)) collect(x, out)
  }
}

/** 手冊內容加上範本固定的字（標題、按鈕、數字等） */
export function allText(d: SiteData, fixed: string): string {
  const out: string[] = [fixed, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz:/.-→·、，。：（）【】！？～']
  collect(d, out)
  return out.join('')
}
