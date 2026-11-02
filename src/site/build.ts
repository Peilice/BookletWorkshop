// 組出網站成品：單一 HTML 檔，或可以上架的 zip（加上離線快取與加到主畫面）

import PizZip from 'pizzip'
import type { SiteData } from './siteData'
import { SITE_TEMPLATES } from './templates'
import type { RenderOptions, SiteTemplate } from './templates/types'

export function siteTemplate(id: string): SiteTemplate {
  const t = SITE_TEMPLATES[id]
  if (!t) throw new Error(`找不到網站範本「${id}」`)
  return t
}

export function renderSite(templateId: string, data: SiteData, opts: RenderOptions = {}): string {
  return siteTemplate(templateId).render(data, opts)
}

/** Service Worker：先用快取，背景再更新；版本號不同就清掉舊快取 */
export function serviceWorker(version: string, files: string[]): string {
  return `const CACHE = 'booklet-${version}'
const FILES = ${JSON.stringify(['./', ...files])}
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('booklet-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      const net = fetch(e.request)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()))
          return res
        })
        .catch(() => hit)
      return hit || net
    }),
  )
})
`
}

export function webManifest(data: SiteData): string {
  return JSON.stringify(
    {
      name: data.title,
      short_name: data.title.length > 12 ? data.title.slice(0, 12) : data.title,
      start_url: './',
      scope: './',
      display: 'standalone',
      background_color: '#FFFFFF',
      theme_color: data.colors[0].deep,
      lang: 'zh-Hant-TW',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
    null,
    2,
  )
}

export interface SiteIcons {
  'icon-180.png': Uint8Array
  'icon-192.png': Uint8Array
  'icon-512.png': Uint8Array
}

export function buildSiteZip(
  templateId: string,
  data: SiteData,
  opts: Omit<RenderOptions, 'pwa'>,
  icons: SiteIcons,
  version = Date.now().toString(36),
): Uint8Array {
  const zip = new PizZip()
  const files: Record<string, string | Uint8Array> = {
    'index.html': renderSite(templateId, data, { ...opts, pwa: true }),
    'manifest.webmanifest': webManifest(data),
    ...icons,
  }
  files['sw.js'] = serviceWorker(version, Object.keys(files))
  for (const [name, content] of Object.entries(files)) zip.file(name, content)
  return zip.generate({ type: 'uint8array', compression: 'DEFLATE' })
}
