// 和風直排：A5 小冊子風格。班機住宿、行程總覽橫排，景點介紹是中文直排的卡片；列印成 A4、一頁兩個景點

import { mix } from '../../colors'
import { esc, paragraphs, when } from '../../html'
import type { SiteData, SiteDay } from '../../siteData'
import { chineseDay } from '../../../model/dates'
import { icon } from '../common/icons'
import { countdown, page, todayTag } from '../common/page'
import { spotPhoto } from '../common/photos'
import type { RenderOptions } from '../types'
import css from './style.css?raw'

/** 11/26（四） */
const dateW = (date: string, w: string) => (date ? `${date}${w ? `（${w}）` : ''}` : '')

function travel(d: SiteData): string {
  const move = d.onlyFlights ? '班機' : '交通'
  const flights = d.flights.map((f) => {
    const carrier = [d.onlyFlights ? '' : f.modeLabel, f.airline, f.flightNo].filter(Boolean).join(' ')
    const leg = f.leg ? `<span class="leg">${esc(f.leg)}：</span>` : ''
    const from = [f.from, f.departTime && `${f.departTime} ${f.departWord}`].filter(Boolean).join(' ')
    const to = [f.to, f.arriveTime && `${f.arriveTime}${f.nextDay ? '（隔天）' : ''} 抵達`].filter(Boolean).join(' ')
    return `<li>${leg}<span class="num">${esc(dateW(f.date, f.weekdayShort))}</span>${when(carrier, () => `<span class="carrier">${esc(carrier)}</span>`)}<span>${esc(from)} → ${esc(to)}</span>${when(f.duration, () => `<span class="dur">（${esc(f.duration)}）</span>`)}</li>`
  })
  const hotels = d.hotels.map((h) => {
    const stay = [h.checkIn && `${h.checkIn} 入住`, h.checkOut && `${h.checkOut} 退房`].filter(Boolean).join(' - ')
    return `<article class="hotel">
      <h4>${when(h.city, () => `${esc(h.city)}｜`)}${esc(h.name)}</h4>
      ${when(stay, () => `<p class="num">${esc(stay)}</p>`)}
      ${when(h.address, () => `<p>地址：${esc(h.address)}</p>`)}
      ${when(h.phone, () => `<p>電話：<span class="num">${esc(h.phone)}</span></p>`)}
      ${when(h.note, () => `<div class="note">${paragraphs(`※ ${h.note}`)}</div>`)}
      <p class="links no-print">
        ${when(h.name || h.address, () => `<a href="${esc(h.mapUrl)}" target="_blank" rel="noopener">${icon('pin')}地圖</a>`)}
        ${when(h.phone, () => `<a href="tel:${esc(h.phone.replace(/[^\d+]/g, ''))}">${icon('phone')}撥打電話</a>`)}
      </p>
    </article>`
  })
  return `<section class="sec" id="travel" aria-labelledby="h-travel">
  <h2 class="sec-title" id="h-travel">${d.flights.length && d.hotels.length ? `${move}與住宿` : d.flights.length ? move : '住宿'}</h2>
  ${when(flights.length, () => `<h3 class="sub">【${move}】</h3><ul class="flights">${flights.join('')}</ul>`)}
  ${when(hotels.length, () => `<h3 class="sub">【住宿】</h3><div class="hotels">${hotels.join('')}</div>`)}
</section>`
}

function overview(d: SiteData): string {
  const days = d.days.map((day) => {
    const head = [dateW(day.date, day.weekdayShort) || `Day ${day.n}`, day.departTime && `${day.departTime} 出門`].filter(Boolean)
    return `<article class="ov" id="ov-${day.n}"${when(day.iso, () => ` data-day-date="${esc(day.iso)}"`)}>
      <h3 class="num">${head.map(esc).join('<span class="gap"></span>')}${todayTag}</h3>
      ${when(day.route.length, () => `<p>行程：${esc(day.route.join(' → '))}</p>`)}
      ${when(
        // 有填景點時間時，橫排列出時間軸（直排卡片裡的數字不好讀）
        day.spots.some((s) => s.time),
        () => `<ol class="times">${day.spots.map((s) => `<li><span class="num">${esc(s.time)}</span>${esc(s.name)}</li>`).join('')}</ol>`,
      )}
    </article>`
  })
  return `<section class="sec" id="overview" aria-labelledby="h-overview">
  <h2 class="sec-title" id="h-overview">${d.singleDay ? '當日行程' : '行程總覽'}</h2>
  <div class="ovs">${days.join('')}</div>
</section>`
}

function spotGroup(day: SiteDay, single: boolean): string {
  const spots = day.spots.filter((s) => s.content || s.photo)
  if (!spots.length) return ''
  // 一日遊不標第一天
  const n = single ? '' : chineseDay(day.n)
  return `<div class="spot-day">
    ${when(!single, () => `<h3 class="sub">${esc(n)}${when(day.date, () => `<span class="num">${esc(dateW(day.date, day.weekdayShort))}</span>`)}</h3>`)}
    <div class="spots">${spots
      .map(
        (s) => `<article class="spot">
      <div class="tate">
        <h4>${esc(s.name)}${when(n, () => `<small>（${esc(n)}）</small>`)}</h4>
        ${paragraphs(s.content)}
      </div>
      ${spotPhoto(s)}
    </article>`,
      )
      .join('')}</div>
  </div>`
}

const hasSpots = (d: SiteData) => d.days.some((x) => x.spots.some((s) => s.content || s.photo))

export function render(d: SiteData, opts: RenderOptions): string {
  const accent = d.palette.accent1
  const nav = [
    { id: 'travel', label: d.onlyFlights ? '班機住宿' : '交通住宿', show: d.flights.length > 0 || d.hotels.length > 0 },
    { id: 'overview', label: d.singleDay ? '當日行程' : '行程總覽', show: d.days.length > 0 },
    { id: 'spots', label: '景點介紹', show: hasSpots(d) },
  ].filter((n) => n.show)

  const body = `<header class="top">
  <div class="wrap top-in">
    <div>
      <h1>${esc(d.title)}</h1>
      ${when(d.dateRange, () => `<p class="dates num">${esc(d.dateRange)}</p>`)}
      ${countdown(d)}
    </div>
    <span class="offline" data-offline hidden>離線中</span>
  </div>
  ${when(nav.length > 1, () => `<nav class="toc" aria-label="手冊內容"><div class="wrap">${nav.map((n) => `<a href="#${n.id}">${n.label}</a>`).join('')}</div></nav>`)}
</header>
<main id="main" class="wrap">
${when(d.flights.length || d.hotels.length, () => travel(d))}
${when(d.days.length, () => overview(d))}
${when(
  hasSpots(d),
  () => `<section class="sec spots-sec" id="spots" aria-labelledby="h-spots">
  <h2 class="sec-title" id="h-spots">景點介紹</h2>
  ${d.days.map((x) => spotGroup(x, d.singleDay)).join('')}
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
