// 從 Google Fonts 只下載手冊用到的字，轉成 data URL 內嵌，網站和 PDF 離線也能顯示同樣的字型

const CSS_URL = 'https://fonts.googleapis.com/css2'

function toBase64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

// 一次請求最多帶這麼多字；內文也用網路字型的範本字數多，分批下載，各批的 unicode-range 不重疊
const CHUNK = 1000

async function fetchSubset(family: string, weights: number[], chars: string): Promise<string> {
  const query = `family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@${weights.join(';')}&text=${encodeURIComponent(chars)}&display=swap`
  const res = await fetch(`${CSS_URL}?${query}`)
  if (!res.ok) throw new Error(`無法下載字型（${res.status}）`)
  let css = await res.text()
  // 一般瀏覽器拿到的是 woff2；依 format() 標示對應的類型
  const sources = new Map([...css.matchAll(/url\((https:[^)]+)\) format\('([\w-]+)'\)/g)].map((m) => [m[1], m[2]]))
  for (const [url, format] of sources) {
    const font = await fetch(url)
    if (!font.ok) throw new Error(`無法下載字型（${font.status}）`)
    const data = `data:font/${format === 'truetype' ? 'ttf' : format};base64,${toBase64(new Uint8Array(await font.arrayBuffer()))}`
    css = css.replaceAll(url, data)
  }
  return css
}

/** 回傳可以直接放進 <style> 的 @font-face；網路不通時丟出錯誤 */
export async function embedGoogleFont(family: string, weights: number[], text: string): Promise<string> {
  const chars = [...new Set(text.replace(/\s/g, ''))]
  const chunks: string[] = []
  for (let i = 0; i < chars.length; i += CHUNK) chunks.push(chars.slice(i, i + CHUNK).join(''))
  const css = await Promise.all(chunks.map((c) => fetchSubset(family, weights, c)))
  return css.join('\n')
}
