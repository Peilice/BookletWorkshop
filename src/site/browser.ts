// 只能在瀏覽器裡做的事：畫主畫面圖示、叫出列印視窗存成 PDF

import type { SiteIcons } from './build'
import type { SiteData } from './siteData'

async function drawIcon(size: number, color: string, label: string): Promise<Uint8Array> {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // 留出 maskable 圖示的安全區
  ctx.font = `900 ${Math.round(size * 0.42)}px 'Zen Maru Gothic', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif`
  ctx.fillText(label, size / 2, size / 2 + size * 0.02)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('無法產生圖示')
  return new Uint8Array(await blob.arrayBuffer())
}

/** 主畫面圖示：第一天的深色底，白色手冊名稱第一個字 */
export async function siteIcons(data: SiteData): Promise<SiteIcons> {
  const color = data.colors[0].deep
  const label = [...data.title][0] ?? '旅'
  const [a, b, c] = await Promise.all([180, 192, 512].map((s) => drawIcon(s, color, label)))
  return { 'icon-180.png': a, 'icon-192.png': b, 'icon-512.png': c }
}

/**
 * 在看不見的 iframe 裡打開網站並叫出列印視窗；使用者選「另存為 PDF」就得到 A4 的 PDF。
 * 列印視窗關掉（不論存檔或取消）後 resolve。
 */
export function printHtml(html: string, title: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe')
    frame.setAttribute('aria-hidden', 'true')
    frame.tabIndex = -1
    // A4 內容寬度，讓列印前的排版和紙張一致
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;visibility:hidden'
    const pageTitle = document.title
    const cleanup = () => {
      document.title = pageTitle
      frame.remove()
      resolve()
    }
    frame.onload = async () => {
      const win = frame.contentWindow
      if (!win) return reject(new Error('無法準備列印'))
      try {
        await win.document.fonts.ready
        // Chrome 用最上層網頁的標題當 PDF 預設檔名
        document.title = title
        win.addEventListener('afterprint', () => setTimeout(cleanup, 0), { once: true })
        win.focus()
        win.print()
      } catch (e) {
        cleanup()
        reject(e)
      }
    }
    frame.srcdoc = html
    document.body.appendChild(frame)
  })
}
