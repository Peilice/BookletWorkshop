// 單欄捲動式範本的共用骨架：頁首、導覽列、航班／行程／美食／住宿／資訊／清單六個區塊。
// 各範本只要提供自己的 CSS，或用 hooks 換掉某個區塊裡的一小段版面（例如 Day 標頭、航班那一列）。

import { esc, paragraphs, when } from '../../html'
import type { SiteData, SiteDay, SiteFlight, SiteHotel } from '../../siteData'
import base from './basic.css?raw'
import { icon } from './icons'
import { CLIENT_TEXT, countdown, page, todayTag } from './page'
import { allText } from './text'
import type { RenderOptions } from '../types'

export type SectionId = 'flights' | 'days' | 'foods' | 'hotels' | 'info' | 'checklist'

export interface BasicConfig {
  css: string
  bodyClass?: string
  themeColor?: string
  /** 寫在 <html style> 的 CSS 變數；預設只有 --accent */
  vars?: (d: SiteData) => string
  /** 區塊出現的順序 */
  order?: SectionId[]
  /** 每天的標頭（Day 幾、日期、今天標籤、出門時間） */
  dayHead?: (day: SiteDay, d: SiteData) => string
  /** 每天的大標路線 */
  route?: (day: SiteDay) => string
  /** 一筆交通（<li> 裡面的內容） */
  flight?: (f: SiteFlight, d: SiteData) => string
  /** 一間住宿（<article> 裡面的內容） */
  hotel?: (h: SiteHotel, d: SiteData) => string
  /** 放在頁首裡、標題上方的裝飾 */
  headerTop?: string
}

const BASIC_TEXT = '航班交通每日行程當日美食特產住宿旅遊資訊行前清單出門入住退房地圖撥打電話列印存成以旅遊手冊工坊製作離線中去程回程跳到主要內容Day'

/** 用網路字型的範本：這些範本固定會出現的字加上手冊內容 */
export const basicText = (d: SiteData, extra = '') => allText(d, BASIC_TEXT + extra + CLIENT_TEXT)

export const dateW = (date: string, w: string) => (date ? `${date}${w ? `（${w}）` : ''}` : '')
const heading = (id: string, text: string) => `<h2 class="sec-title" id="h-${id}">${esc(text)}</h2>`

function defaultFlight(f: SiteFlight, d: SiteData): string {
  const carrier = [d.onlyFlights ? '' : f.modeLabel, f.airline, f.flightNo].filter(Boolean).join(' ')
  const dep = [f.from, f.departTime].filter(Boolean).join(' ')
  const arr = [f.to, f.arriveTime && `${f.arriveTime}${f.nextDay ? ' +1' : ''}`].filter(Boolean).join(' ')
  return `<span class="num when">${esc(dateW(f.date, f.weekdayShort))}</span>
      <span class="what">${when(f.leg, () => `<b>${esc(f.leg)}</b> `)}${esc(carrier)}</span>
      <span class="route">${esc(dep)} → ${esc(arr)}${when(f.duration, () => `<small>（${esc(f.duration)}）</small>`)}</span>`
}

function defaultDayHead(day: SiteDay, d: SiteData): string {
  return `${when(!d.singleDay, () => `<b class="day-n num">Day ${day.n}</b>`)}
      <span class="num">${esc(dateW(day.date, day.weekdayShort))}</span>
      ${todayTag}
      ${when(day.departTime, () => `<span class="num dep">${esc(day.departTime)} 出門</span>`)}`
}

function defaultHotel(h: SiteHotel): string {
  const stay = [h.checkIn && `${h.checkIn} 入住`, h.checkOut && `${h.checkOut} 退房`].filter(Boolean).join(' – ')
  return `<h3>${when(h.city, () => `<small>${esc(h.city)}</small> `)}${esc(h.name)}</h3>
    ${when(stay, () => `<p class="num">${esc(stay)}</p>`)}
    ${when(h.address, () => `<p>${esc(h.address)}</p>`)}
    ${when(h.phone, () => `<p class="num">${esc(h.phone)}</p>`)}
    ${when(h.note, () => paragraphs(h.note))}
    <p class="actions no-print">
      ${when(h.name || h.address, () => `<a href="${esc(h.mapUrl)}" target="_blank" rel="noopener">${icon('pin')}地圖</a>`)}
      ${when(h.phone, () => `<a href="tel:${esc(h.phone.replace(/[^\d+]/g, ''))}">${icon('phone')}撥打電話</a>`)}
    </p>`
}

const defaultRoute = (day: SiteDay) => `<p class="route-line">${esc(day.route.join(' → '))}</p>`

export function renderBasic(d: SiteData, opts: RenderOptions, cfg: BasicConfig): string {
  const flight = cfg.flight ?? defaultFlight
  const dayHead = cfg.dayHead ?? defaultDayHead
  const route = cfg.route ?? defaultRoute
  const hotel = cfg.hotel ?? defaultHotel

  const sections: Record<SectionId, { label: string; show: boolean; html: () => string }> = {
    flights: {
      label: d.onlyFlights ? '航班' : '交通',
      show: d.flights.length > 0,
      html: () => `<section class="sec" id="flights" aria-labelledby="h-flights">
  ${heading('flights', d.onlyFlights ? '航班' : '交通')}
  <ul class="rows">${d.flights.map((f) => `<li>${flight(f, d)}</li>`).join('')}</ul>
</section>`,
    },
    days: {
      label: '行程',
      show: d.days.length > 0,
      html: () => `<section class="sec" id="days" aria-labelledby="h-days">
  ${heading('days', d.singleDay ? '當日行程' : '每日行程')}
  ${d.days
    .map(
      (day) => `<article class="day" id="day-${day.n}"${when(day.iso, () => ` data-day-date="${esc(day.iso)}"`)}>
    <header class="day-head">${dayHead(day, d)}</header>
    ${when(day.route.length, () => route(day))}
    ${day.spots
      .map(
        (s) => `<div class="spot">
      <h3>${when(s.time, () => `<span class="num time">${esc(s.time)}</span>`)}${esc(s.name)}</h3>
      ${when(s.content, () => paragraphs(s.content))}
    </div>`,
      )
      .join('')}
  </article>`,
    )
    .join('')}
</section>`,
    },
    foods: {
      label: '美食',
      show: d.foods.length > 0,
      html: () => `<section class="sec" id="foods" aria-labelledby="h-foods">
  ${heading('foods', '美食特產')}
  ${d.foods
    .map(
      (f) => `<div class="food"><h3>${esc(f.place)}</h3>
    <ul>${f.items.map((i) => `<li><b>${esc(i.name)}</b>${when(i.description, () => `　${esc(i.description)}`)}</li>`).join('')}</ul></div>`,
    )
    .join('')}
</section>`,
    },
    hotels: {
      label: '住宿',
      show: d.hotels.length > 0,
      html: () => `<section class="sec" id="hotels" aria-labelledby="h-hotels">
  ${heading('hotels', '住宿')}
  ${d.hotels.map((h) => `<article class="hotel">${hotel(h, d)}</article>`).join('')}
</section>`,
    },
    info: {
      label: '資訊',
      show: d.infos.length > 0,
      html: () => `<section class="sec" id="info" aria-labelledby="h-info">
  ${heading('info', '旅遊資訊')}
  ${d.infos.map((i) => `<div class="info"><h3>${esc(i.title)}</h3>${paragraphs(i.content)}</div>`).join('')}
</section>`,
    },
    checklist: {
      label: '清單',
      show: d.checklist.length > 0,
      html: () => {
        let key = 0
        const groups = d.checklist.map(
          (c) => `<div class="check-group">${when(c.name, () => `<h3>${esc(c.name)}</h3>`)}
      <ul class="check-grid">${c.items
        .map((it) => `<li><label><input type="checkbox" data-check="${key++}"><span>${esc(it)}</span></label></li>`)
        .join('')}</ul></div>`,
        )
        return `<section class="sec" id="checklist" aria-labelledby="h-checklist">
  ${heading('checklist', '行前清單')}
  <div class="progress no-print" aria-live="polite"><div class="bar"><span data-progress-bar></span></div><p data-progress-text></p></div>
  ${groups.join('')}
</section>`
      },
    },
  }

  const order = cfg.order ?? ['flights', 'days', 'foods', 'hotels', 'info', 'checklist']
  const shown = order.map((id) => ({ id, ...sections[id] })).filter((s) => s.show)

  const body = `<header class="top">
  ${cfg.headerTop ?? ''}
  <div class="wrap">
    <h1>${esc(d.title)}</h1>
    ${when(d.dateRange, () => `<p class="dates num">${esc(d.dateRange)}</p>`)}
    ${countdown(d)}
    <span class="offline" data-offline hidden>離線中</span>
  </div>
</header>
<nav class="toc no-print" aria-label="手冊內容"><div class="wrap">${shown.map((s) => `<a href="#${s.id}">${s.label}</a>`).join('')}</div></nav>
<main id="main" class="wrap">
${shown.map((s) => s.html()).join('\n')}
</main>
<footer class="foot no-print">
  <div class="wrap">
    <button type="button" class="print" data-print>${icon('print')}列印／存成 PDF</button>
    <p>以旅遊手冊工坊製作</p>
  </div>
</footer>`

  return page(d, opts, {
    css: base + '\n' + cfg.css,
    body,
    themeColor: cfg.themeColor ?? '#ffffff',
    htmlStyle: cfg.vars ? cfg.vars(d) : `--accent:${d.palette.accent1}`,
    bodyClass: cfg.bodyClass,
  })
}
