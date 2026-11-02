// 和風沉穩：手機優先的單頁行程網站，每天一個和色；同一份 HTML 列印時排成 A4

import type { DayColor } from '../../colors'
import { esc, paragraphs, when } from '../../html'
import type { SiteData, SiteDay, SiteHotel } from '../../siteData'
import type { RenderOptions } from '../types'
import script from './app.js?raw'
import css from './style.css?raw'

const ICONS: Record<string, string> = {
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16"/>',
  plane:
    '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  bed: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  phone:
    '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  food: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  print: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>',
}

const sprite = () =>
  `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${Object.entries(ICONS)
    .map(([id, body]) => `<symbol id="i-${id}" viewBox="0 0 24 24">${body}</symbol>`)
    .join('')}</svg>`

const icon = (id: string, cls = 'ic') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`

const colorVars = (c: DayColor) => `--day:${c.deep};--day-chip:${c.chip};--day-soft:${c.soft}`

const dateLine = (date: string, weekday: string) => [date, weekday].filter(Boolean).join(' ')

// ---------- 航班 ----------

function flights(d: SiteData): string {
  const cards = d.flights.map((f) => {
    const carrier = [f.airline, f.flightNo].filter(Boolean).join(' ')
    return `<article class="flight">
  <header class="flight-head">
    ${when(f.leg, () => `<span class="pill">${esc(f.leg)}</span>`)}
    <span class="flight-date">${esc(dateLine(f.date, f.weekday))}</span>
    ${when(carrier, () => `<span class="flight-no">${esc(carrier)}</span>`)}
  </header>
  <div class="flight-route">
    <div class="pt"><b class="time">${esc(f.departTime || '--:--')}</b><span>${esc(f.from)}</span></div>
    <div class="flight-line">${icon('plane')}</div>
    <div class="pt pt-end"><b class="time">${esc(f.arriveTime || '--:--')}</b><span>${esc(f.to)}</span></div>
  </div>
</article>`
  })
  return `<section class="panel" id="flights" aria-labelledby="h-flights">
  <div class="wrap">
    <h2 class="sec-title" id="h-flights">航班</h2>
    <div class="flights">${cards.join('')}</div>
  </div>
</section>`
}

// ---------- 住宿 ----------

function hotelCard(h: SiteHotel, d: SiteData, compact: boolean): string {
  const color = d.days[h.nights[0]]?.color ?? d.colors[0]
  const stay = [h.checkIn && `${h.checkIn} 入住`, h.checkOut && `${h.checkOut} 退房`].filter(Boolean).join(' → ')
  const nights = h.nights.length ? `${h.nights.length} 晚` : ''
  const strip = when(h.nights.length && d.days.length > 1, () => {
    const cells = d.days.map((day, i) =>
      h.nights.includes(i) ? `<span style="--c:${day.color.chip}"></span>` : '<span></span>',
    )
    return `<div class="nights" aria-hidden="true">${cells.join('')}</div>`
  })
  const Tag = compact ? 'h4' : 'h3'
  return `<article class="hotel" style="${colorVars(color)}">
  <header class="hotel-head">
    ${icon('bed', 'ic hotel-ic')}
    <div>
      ${when(compact, () => '<p class="hotel-kicker">今晚住宿</p>')}
      <${Tag} class="hotel-name">${esc(h.name || '（未命名的住宿）')}</${Tag}>
      ${when(h.city || stay, () => `<p class="hotel-stay">${[h.city && `<span class="pill">${esc(h.city)}</span>`, esc(stay), esc(nights)].filter(Boolean).join(' ')}</p>`)}
      ${strip}
    </div>
  </header>
  <div class="hotel-body">
    ${when(h.address, () => `<p class="fact">${icon('pin')}<span>${esc(h.address)}</span></p>`)}
    ${when(h.phone, () => `<p class="fact">${icon('phone')}<span class="num">${esc(h.phone)}</span></p>`)}
    <div class="actions no-print">
      ${when(h.name || h.address, () => `<a class="btn" href="${esc(h.mapUrl)}" target="_blank" rel="noopener">${icon('pin')}地圖</a>`)}
      ${when(h.phone, () => `<a class="btn btn-outline" href="tel:${esc(h.phone.replace(/[^\d+]/g, ''))}">${icon('phone')}撥打電話</a>`)}
    </div>
  </div>
</article>`
}

function stay(d: SiteData): string {
  return `<section class="panel" id="stay" aria-labelledby="h-stay">
  <div class="wrap">
    <h2 class="sec-title" id="h-stay">住宿</h2>
    <div class="hotels">${d.hotels.map((h) => hotelCard(h, d, false)).join('')}</div>
    ${when(d.hotelNote, () => `<div class="note"><h3 class="box-title">住宿備註</h3>${paragraphs(d.hotelNote)}</div>`)}
  </div>
</section>`
}

// ---------- 行程 ----------

/** 當日大標：短地名不斷行，箭頭跟著前一個地名 */
function route(day: SiteDay): string {
  if (!day.route.length) return `Day ${day.n}`
  return day.route
    .map((part, i) => {
      const arrow = i < day.route.length - 1 ? '<span class="arr" aria-label="到">→</span>' : ''
      return `<span class="${part.length <= 8 ? 'nb' : ''}">${esc(part)}${arrow}</span>`
    })
    .join(' ')
}

function stops(day: SiteDay, open: boolean): string {
  if (!day.spots.length) return '<p class="empty">這天還沒有景點。</p>'
  const items = day.spots.map((s, i) => {
    const mark = `<span class="stop-mark">${icon('pin')}<span class="badge">${i + 1}</span></span>`
    const name = `<span class="stop-name">${esc(s.name || `景點 ${i + 1}`)}</span>`
    if (!s.content) return `<li class="stop"><div class="stop-row">${mark}${name}</div></li>`
    return `<li class="stop"><details${open ? ' open' : ''}><summary class="stop-row">${mark}${name}${icon('chevron', 'ic chev')}</summary><div class="stop-body">${paragraphs(s.content)}</div></details></li>`
  })
  return `<ol class="stops">${items.join('')}</ol>`
}

function day(day: SiteDay, d: SiteData, open: boolean): string {
  const hotel = day.hotel !== null ? d.hotels[day.hotel] : null
  const chips = [
    day.theme && `<span class="pill">${esc(day.theme)}</span>`,
    day.departTime && `<span class="pill">${icon('clock')}出門 <span class="num">${esc(day.departTime)}</span></span>`,
    // 列印時不放整張住宿卡（常被擠到下一頁），只標出今晚住哪
    hotel?.name && `<span class="pill print-pill">${icon('bed')}住 ${esc(hotel.name)}</span>`,
  ].filter(Boolean)
  return `<article class="day" id="day-${day.n}" role="tabpanel" aria-labelledby="tab-day-${day.n}" data-date="${esc(day.iso)}" data-deep="${day.color.deep}" data-chip="${day.color.chip}" data-soft="${day.color.soft}" style="${colorVars(day.color)}">
  <header class="day-head">
    <div class="wrap">
      <h3 class="route">${route(day)}</h3>
      <p class="day-meta"><b>Day ${day.n}</b>${when(day.date, () => ` · ${esc(dateLine(day.date, day.weekday))}`)}</p>
      ${when(chips.length, () => `<p class="day-chips">${chips.join('')}</p>`)}
    </div>
  </header>
  <div class="wrap day-body${hotel ? ' has-side' : ''}">
    <div>${stops(day, open)}</div>
    ${when(hotel, () => `<aside class="day-side">${hotelCard(hotel!, d, true)}</aside>`)}
  </div>
</article>`
}

/** 列印版第一頁的行程總覽表 */
function overview(d: SiteData): string {
  const rows = d.days.map(
    (day) => `<tr style="${colorVars(day.color)}">
  <th scope="row"><span class="ov-day">Day ${day.n}</span></th>
  <td class="num">${esc(dateLine(day.date, day.weekday))}</td>
  <td>${esc(day.route.join(' → '))}</td>
  <td>${esc(day.hotel !== null ? d.hotels[day.hotel].name : '')}</td>
</tr>`,
  )
  return `<div class="overview print-only">
  <h2 class="sec-title">行程總覽</h2>
  <table><thead><tr><th scope="col">天數</th><th scope="col">日期</th><th scope="col">行程</th><th scope="col">住宿</th></tr></thead><tbody>${rows.join('')}</tbody></table>
</div>`
}

function trip(d: SiteData, open: boolean): string {
  const buttons = d.days.map(
    (day) =>
      `<button type="button" class="daybtn" role="tab" id="tab-day-${day.n}" aria-controls="day-${day.n}" aria-selected="${day.n === 1}" data-day="${day.n}" style="--c:${day.color.chip}"><span class="today" hidden>今天</span><b>${day.n}</b><small>${esc(day.date)}</small></button>`,
  )
  return `<section class="panel" id="trip" aria-labelledby="h-trip">
  <div class="wrap">${overview(d)}</div>
  <div class="season">
    <div class="wrap">
      <h2 class="sr-only" id="h-trip">每日行程</h2>
      ${
        d.days.length
          ? `<div class="daybar" role="tablist" aria-label="選擇日期" style="--n:${d.days.length}">${buttons.join('')}</div>`
          : '<p class="empty empty-on-color">還沒有行程。</p>'
      }
    </div>
  </div>
  ${d.days.map((x) => day(x, d, open)).join('')}
</section>`
}

// ---------- 資訊：旅遊資訊、美食、行前清單 ----------

function info(d: SiteData): string {
  const n = d.colors.length
  const foodColor = (i: number) => d.colors[d.foods.length > 1 ? Math.round((i * (n - 1)) / (d.foods.length - 1)) : 0].chip
  let key = 0
  return `<section class="panel" id="info" aria-labelledby="h-info">
  <div class="wrap">
    <h2 class="sec-title" id="h-info">旅遊資訊</h2>
    ${when(
      d.infos.length,
      () =>
        `<div class="infos">${d.infos.map((i) => `<div class="info-box">${when(i.title, () => `<h3 class="box-title">${esc(i.title)}</h3>`)}${paragraphs(i.content)}</div>`).join('')}</div>`,
    )}
    ${when(
      d.foods.length,
      () => `<h2 class="sec-title">${icon('food', 'ic sec-ic')}吃什麼</h2>
    <div class="foods">${d.foods
      .map(
        (f, i) => `<section class="food">
      <h3 class="box-title"><span class="sq" style="--c:${foodColor(i)}"></span>${esc(f.place || '其他')}</h3>
      <ul>${f.items.map((it) => `<li><b>${esc(it.name)}</b>${when(it.description, () => `<span>${esc(it.description)}</span>`)}</li>`).join('')}</ul>
    </section>`,
      )
      .join('')}</div>`,
    )}
    ${when(
      d.checklist.length,
      () => `<h2 class="sec-title">${icon('check', 'ic sec-ic')}行前清單</h2>
    <div class="progress no-print" aria-live="polite"><div class="bar"><span></span></div><p class="progress-text"></p></div>
    <div class="checklist">${d.checklist
      .map(
        (g) => `<section class="check-group">
      <h3 class="box-title">${esc(g.label)}</h3>
      <ul>${g.items.map((it) => `<li><label><input type="checkbox" data-key="${key++}"><span>${esc(it)}</span></label></li>`).join('')}</ul>
    </section>`,
      )
      .join('')}</div>`,
    )}
  </div>
</section>`
}

const hasInfo = (d: SiteData) => d.infos.length > 0 || d.foods.length > 0 || d.checklist.length > 0

/** 會用圓體顯示的文字：網站只內嵌這些字，檔案才不會太大 */
export function displayText(d: SiteData): string {
  return [
    d.title,
    d.dateRange,
    '行程航班住宿資訊旅遊吃什麼行前清單今天今晚入住退房晚地圖撥打電話出門到總覽天數日期離線中列印存成全部準備好了未命名的',
    'DayABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:/→·（）',
    ...d.flights.flatMap((f) => [f.leg, f.date, f.weekday, f.airline, f.flightNo, f.from, f.to]),
    ...d.days.flatMap((x) => [...x.route, x.date, x.weekday, x.theme, ...x.spots.map((s) => s.name)]),
    ...d.hotels.flatMap((h) => [h.name, h.city]),
    ...d.infos.map((i) => i.title),
    ...d.foods.flatMap((f) => [f.place, ...f.items.map((i) => i.name)]),
    ...d.checklist.map((c) => c.label),
  ].join('')
}

export function render(d: SiteData, opts: RenderOptions): string {
  const tabs = [
    { id: 'trip', label: '行程', icon: 'route', show: true },
    { id: 'flights', label: '航班', icon: 'plane', show: d.flights.length > 0 },
    { id: 'stay', label: '住宿', icon: 'bed', show: d.hotels.length > 0 },
    { id: 'info', label: '資訊', icon: 'book', show: hasInfo(d) },
  ].filter((t) => t.show)
  const head = d.colors[0]

  return `<!doctype html>
<html lang="zh-Hant-TW" data-trip="${esc(d.tripKey)}"${opts.pwa ? ' data-pwa="1"' : ''} style="${colorVars(head)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(opts.documentTitle ?? d.title)}</title>
<meta name="theme-color" content="${head.deep}">
<meta name="generator" content="旅遊手冊工坊">
${when(opts.pwa, () => '<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icon-180.png">\n<meta name="apple-mobile-web-app-capable" content="yes">')}
<style>${opts.fontCss ?? ''}
${css}</style>
</head>
<body${tabs.length > 1 ? ' class="has-tabs"' : ''}>
${sprite()}
<a class="skip" href="#main">跳到主要內容</a>
<header class="mast">
  <div class="wrap mast-in">
    <div class="mast-title">
      <h1>${esc(d.title)}</h1>
      ${when(d.dateRange, () => `<p class="mast-dates num">${esc(d.dateRange)}</p>`)}
    </div>
    <span class="offline" hidden>離線中</span>
    ${when(
      tabs.length > 1,
      () =>
        `<nav class="tabs" aria-label="手冊分頁">${tabs.map((t) => `<a class="tab" href="#${t.id}" data-tab="${t.id}">${icon(t.icon)}<span>${t.label}</span></a>`).join('')}</nav>`,
    )}
  </div>
</header>
<main id="main">
${when(d.flights.length, () => flights(d))}
${trip(d, opts.print ?? false)}
${when(d.hotels.length, () => stay(d))}
${when(hasInfo(d), () => info(d))}
</main>
<footer class="foot no-print">
  <div class="wrap">
    <button type="button" class="btn btn-outline print-btn">${icon('print')}列印／存成 PDF</button>
    <p>以旅遊手冊工坊製作</p>
  </div>
</footer>
<script>${script}</script>
</body>
</html>
`
}
