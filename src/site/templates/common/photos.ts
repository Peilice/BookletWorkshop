// 照片（封面、封底、整本底圖、景點）在網站上的樣子。所有範本共用；沒放照片時什麼都不輸出，版面和以前一樣

import { esc, when } from '../../html'
import type { SiteData, SiteSpot } from '../../siteData'

/** 景點的照片；沒有照片時是空字串 */
export const spotPhoto = (s: SiteSpot): string =>
  when(s.photo, () => `<figure class="spot-photo"><img src="${s.photo}" alt="${esc(s.name)}" loading="lazy" decoding="async"></figure>`)

const hero = (cls: string, src: string, d: SiteData, label: string) =>
  `<section class="${cls}" aria-label="${label}">
  <img class="hero-img" src="${src}" alt="">
  <div class="hero-text">
    <p class="hero-title" aria-hidden="true">${esc(d.title)}</p>
    ${when(d.dateRange, () => `<p class="hero-dates num" aria-hidden="true">${esc(d.dateRange)}</p>`)}
  </div>
</section>`

const CSS = `
.hero, .hero-back { position: relative; isolation: isolate; display: flex; align-items: flex-end; min-height: 100vh; min-height: 100svh; overflow: hidden; background: #222; color: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.hero-img { position: absolute; inset: 0; z-index: -2; width: 100%; height: 100%; object-fit: cover; }
.hero::after, .hero-back::after { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(to top, rgb(0 0 0 / 0.66), rgb(0 0 0 / 0.08) 58%, rgb(0 0 0 / 0.28)); }
.hero-text { width: 100%; max-width: 720px; margin: 0 auto; padding: 0 20px max(44px, env(safe-area-inset-bottom)); }
.hero-title { margin: 0; font-size: clamp(36px, 11vw, 64px); font-weight: 900; line-height: 1.15; letter-spacing: 0.02em; text-wrap: balance; word-break: keep-all; overflow-wrap: anywhere; text-shadow: 0 2px 16px rgb(0 0 0 / 0.45); }
.hero-dates { margin: 8px 0 0; font-size: 16px; letter-spacing: 0.12em; text-shadow: 0 1px 8px rgb(0 0 0 / 0.5); }
.hero-back .hero-title { font-size: clamp(24px, 7vw, 36px); }
.spot-photo { margin: 10px 0 4px; }
.spot-photo img { display: block; width: 100%; max-height: 440px; object-fit: cover; }
.has-bg::before { content: ''; position: fixed; inset: 0; z-index: -1; pointer-events: none; }
@media print {
  .hero, .hero-back { height: 284mm; min-height: 0; break-after: page; }
  .hero-back { break-before: page; break-after: auto; }
  .has-bg::before { display: none; }
  .spot-photo img { max-height: 70mm; }
  .spot-photo { break-inside: avoid; }
}`

export interface PhotoParts {
  /** 沒有任何照片時是空字串 */
  css: string
  cover: string
  backCover: string
  bodyClass: string
}

export function photoParts(d: SiteData): PhotoParts {
  const hasSpotPhoto = d.days.some((x) => x.spots.some((s) => s.photo))
  if (!d.cover && !d.backCover && !d.background && !hasSpotPhoto) return { css: '', cover: '', backCover: '', bodyClass: '' }
  // 底圖上面蓋一層和範本紙色一樣的半透明底色，字才看得清楚
  const tint = 'color-mix(in srgb, var(--paper, #fff) 88%, transparent)'
  const bg = when(d.background, () => `\n.has-bg::before { background: linear-gradient(${tint}, ${tint}), url("${d.background}") center / cover no-repeat; }`)
  return {
    css: CSS + bg,
    cover: when(d.cover, () => hero('hero', d.cover, d, '封面')),
    backCover: when(d.backCover, () => hero('hero-back', d.backCover, d, '封底')),
    bodyClass: d.background ? 'has-bg' : '',
  }
}
