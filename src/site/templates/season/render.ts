// 和風沉穩：手機優先的單頁行程網站，每天一個和色；同一份 HTML 列印時排成 A4

import type { DayColor } from '../../colors'
import { esc, paragraphs, when } from '../../html'
import type { SiteData, SiteDay, SiteHotel } from '../../siteData'
import { icon } from '../common/icons'
import { page } from '../common/page'
import type { RenderOptions } from '../types'
import script from './app.js?raw'
import css from './style.css?raw'

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
    <div class="progress no-print" aria-live="polite"><div class="bar"><span data-progress-bar></span></div><p class="progress-text" data-progress-text></p></div>
    <div class="checklist">${d.checklist
      .map(
        (g) => `<section class="check-group">
      ${when(g.name, () => `<h3 class="box-title">${esc(g.name)}</h3>`)}
      <ul>${g.items.map((it) => `<li><label><input type="checkbox" data-check="${key++}"><span>${esc(it)}</span></label></li>`).join('')}</ul>
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
    ...d.checklist.map((c) => c.name),
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

  const body = `<header class="mast">
  <div class="wrap mast-in">
    <div class="mast-title">
      <h1>${esc(d.title)}</h1>
      ${when(d.dateRange, () => `<p class="mast-dates num">${esc(d.dateRange)}</p>`)}
    </div>
    <span class="offline" data-offline hidden>離線中</span>
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
    <button type="button" class="btn btn-outline" data-print>${icon('print')}列印／存成 PDF</button>
    <p>以旅遊手冊工坊製作</p>
  </div>
</footer>`
  return page(d, opts, {
    css,
    body,
    script,
    themeColor: head.deep,
    htmlStyle: colorVars(head),
    bodyClass: tabs.length > 1 ? 'has-tabs' : undefined,
  })
}
