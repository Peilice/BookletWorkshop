// 網站範本的介面：每個範本把 SiteData 排成一份完整的 HTML

import type { SiteData } from '../siteData'

export interface RenderOptions {
  pwa?: boolean // zip 版：加上 manifest 與離線快取
  print?: boolean // 給 PDF 用：景點介紹全部展開
  fontCss?: string // 內嵌字型的 @font-face
  documentTitle?: string // <title>；PDF 會拿它當預設檔名
}

/** 要內嵌的 Google Fonts 字型，以及會用這個字型顯示的字 */
export interface SiteFont {
  family: string
  weights: number[]
  text(data: SiteData): string
}

export interface SiteTemplate {
  render(data: SiteData, opts: RenderOptions): string
  fonts: SiteFont[]
}
