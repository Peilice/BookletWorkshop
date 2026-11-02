// 網站範本共用的 HTML 外殼：<head>、內嵌樣式與程式、zip 版的 manifest

import { esc, when } from '../../html'
import type { SiteData } from '../../siteData'
import type { RenderOptions } from '../types'
import client from './client.js?raw'
import { sprite } from './icons'

export interface PageParts {
  css: string
  body: string
  script?: string // 範本自己的互動，接在共用程式後面
  themeColor: string
  htmlStyle?: string
  bodyClass?: string
}

export function page(d: SiteData, opts: RenderOptions, p: PageParts): string {
  return `<!doctype html>
<html lang="zh-Hant-TW" data-trip="${esc(d.tripKey)}"${opts.pwa ? ' data-pwa="1"' : ''}${p.htmlStyle ? ` style="${p.htmlStyle}"` : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(opts.documentTitle ?? d.title)}</title>
<meta name="theme-color" content="${p.themeColor}">
<meta name="generator" content="旅遊手冊工坊">
${when(opts.pwa, () => '<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icon-180.png">\n<meta name="apple-mobile-web-app-capable" content="yes">')}
<style>${opts.fontCss ?? ''}
${p.css}</style>
</head>
<body${p.bodyClass ? ` class="${p.bodyClass}"` : ''}>
${sprite()}
<a class="skip" href="#main">跳到主要內容</a>
${p.body}
<script>${client}
${p.script ?? ''}</script>
</body>
</html>
`
}
