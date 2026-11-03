// 和風直排：A5 小冊子風格。班機住宿、行程總覽橫排，景點介紹是中文直排的卡片；列印成 A4、一頁兩個景點

import { mix } from '../../colors'
import { esc, paragraphs, when } from '../../html'
import type { SiteData, SiteDay } from '../../siteData'
import { chineseDay } from '../../../model/dates'
import { icon } from '../common/icons'
import { page } from '../common/page'
import type { RenderOptions } from '../types'
import css from './style.css?raw'

/** 11/26（四） */
const dateW = (date: string, w: string) => (date ? `${date}${w ? `（${w}）` : ''}` : '')

function travel(d: SiteData): string {
  const flights = d.flights.map((f) => {
    const carrier = [f.airline, f.flightNo].filter(Boolean).join(' ')
    const leg = f.leg ? `<span class="leg">${esc(f.leg)}：</span>` : ''
    const from = [f.from, f.departTime && `${f.departTime} 起飛`].filter(Boolean).join(' ')
    const to = [f.to, f.arriveTime && `${f.arriveTime} 抵達`].filter(Boolean).join(' ')
    return `<li>${leg}<span class="num">${esc(dateW(f.date, f.weekdayShort))}</span>${when(carrier, () => `<span class="carrier">${esc(carrier)}</span>`)}<span>${esc(from)} → ${esc(to)}</span></li>`
  })
  const hotels = d.hotels.map((h) => {
    const stay = [h.checkIn && `${h.checkIn} 入住`, h.checkOut && `${h.checkOut} 退房`].filter(Boolean).join(' - ')
    return `<article class="hotel">
      <h4>${when(h.city, () => `${esc(h.city)}｜`)}${esc(h.name)}</h4>
      ${when(stay, () => `<p class="num">${esc(stay)}</p>`)}
      ${when(h.address, () => `<p>地址：${esc(h.address)}</p>`)}
      ${when(h.phone, () => `<p>電話：<span class="num">${esc(h.phone)}</span></p>`)}
      <p class="links no-print">
        ${when(h.name || h.address, () => `<a href="${esc(h.mapUrl)}" target="_blank" rel="noopener">${icon('pin')}地圖</a>`)}
        ${when(h.phone, () => `<a href="tel:${esc(h.phone.replace(/[^\d+]/g, ''))}">${icon('phone')}撥打電話</a>`)}
      </p>
    </article>`
  })
  return `<section class="sec" id="travel" aria-labelledby="h-travel">
  <h2 class="sec-title" id="h-travel">${d.flights.length && d.hotels.length ? '班機與住宿' : d.flights.length ? '班機' : '住宿'}</h2>
  ${when(flights.length, () => `<h3 class="sub">【班機】</h3><ul class="flights">${flights.join('')}</ul>`)}
  ${when(hotels.length, () => `<h3 class="sub">【住宿】</h3><div class="hotels">${hotels.join('')}</div>`)}
  ${when(d.hotelNote, () => `<div class="note">${paragraphs(`※ ${d.hotelNote}`)}</div>`)}
</section>`
}

function overview(d: SiteData): string {
  const days = d.days.map((day) => {
    const head = [dateW(day.date, day.weekdayShort) || `Day ${day.n}`, day.departTime && `${day.departTime} 出門`].filter(Boolean)
    return `<article class="ov">
      <h3 class="num">${head.map(esc).join('<span class="gap"></span>')}</h3>
      ${when(day.theme, () => `<p>主題：${esc(day.theme)}</p>`)}
      ${when(day.route.length, () => `<p>行程：${esc(day.route.join(' → '))}</p>`)}
    </article>`
  })
  return `<section class="sec" id="overview" aria-labelledby="h-overview">
  <h2 class="sec-title" id="h-overview">行程總覽</h2>
  <div class="ovs">${days.join('')}</div>
</section>`
}

function spotGroup(day: SiteDay): string {
  const spots = day.spots.filter((s) => s.content)
  if (!spots.length) return ''
  const n = chineseDay(day.n)
  return `<div class="spot-day">
    <h3 class="sub">${esc(n)}${when(day.date, () => `<span class="num">${esc(dateW(day.date, day.weekdayShort))}</span>`)}</h3>
    <div class="spots">${spots
      .map(
        (s) => `<article class="spot">
      <div class="tate">
        <h4>${esc(s.name)}<small>（${esc(n)}）</small></h4>
        ${paragraphs(s.content)}
      </div>
    </article>`,
      )
      .join('')}</div>
  </div>`
}

const hasSpots = (d: SiteData) => d.days.some((x) => x.spots.some((s) => s.content))

export function render(d: SiteData, opts: RenderOptions): string {
  const accent = d.palette.accent1
  const nav = [
    { id: 'travel', label: '班機住宿', show: d.flights.length > 0 || d.hotels.length > 0 },
    { id: 'overview', label: '行程總覽', show: d.days.length > 0 },
    { id: 'spots', label: '景點介紹', show: hasSpots(d) },
  ].filter((n) => n.show)

  const body = `<header class="top">
  <div class="wrap top-in">
    <div>
      <h1>${esc(d.title)}</h1>
      ${when(d.dateRange, () => `<p class="dates num">${esc(d.dateRange)}</p>`)}
    </div>
    <span class="offline" data-offline hidden>離線中</span>
  </div>
  ${when(nav.length > 1, () => `<nav class="toc" aria-label="手冊內容"><div class="wrap">${nav.map((n) => `<a href="#${n.id}">${n.label}</a>`).join('')}</div></nav>`)}
</header>
<main id="main" class="wrap">
${when(d.flights.length || d.hotels.length || d.hotelNote, () => travel(d))}
${when(d.days.length, () => overview(d))}
${when(
  hasSpots(d),
  () => `<section class="sec spots-sec" id="spots" aria-labelledby="h-spots">
  <h2 class="sec-title" id="h-spots">景點介紹</h2>
  ${d.days.map(spotGroup).join('')}
</section>`,
)}
</main>
<footer class="foot no-print">
  <div class="wrap">
    <button type="button" class="print" data-print>${icon('print')}列印／存成 PDF</button>
    <p>以旅遊手冊工坊製作</p>
  </div>
</footer>`

  return page(d, opts, {
    css,
    body,
    themeColor: accent,
    htmlStyle: `--accent:${accent};--accent-soft:${mix(accent, '#FFFFFF', 0.92)};--accent-line:${mix(accent, '#FFFFFF', 0.7)}`,
  })
}
