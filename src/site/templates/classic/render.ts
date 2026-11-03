// 經典：Alice 的第一份範本。手寫感字型、圓形 Day 框、表格式航班與行前清單；整頁捲動閱讀，列印成 A4

import { mix } from '../../colors'
import { esc, paragraphs, when } from '../../html'
import type { SiteData, SiteFlight } from '../../siteData'
import { icon } from '../common/icons'
import { CLIENT_TEXT, countdown, page, todayTag } from '../common/page'
import { allText } from '../common/text'
import type { RenderOptions } from '../types'
import css from './style.css?raw'

const title = (id: string, text: string) => `<h2 class="sec-title" id="h-${id}">${icon('flower', 'ic flower')}${esc(text)}</h2>`

function flights(d: SiteData): string {
  type Col = [string, (f: SiteFlight) => string]
  // 全部都是飛機時照航班的叫法；混了其他交通方式時多一欄交通方式，表頭改成通用的說法
  const air = d.onlyFlights
  const cols: Col[] = [
    ['日期', (f) => f.date],
    ...(air ? [] : [['交通', (f: SiteFlight) => f.modeLabel] as Col]),
    [air ? '航空公司' : '業者', (f) => f.airline],
    [air ? '班機' : '班次', (f) => f.flightNo],
    [air ? '起飛' : '出發', (f) => f.from],
    [air ? '起飛時間' : '出發時間', (f) => f.departTime],
    ['抵達', (f) => f.to],
    ['抵達時間', (f) => (f.nextDay ? `${f.arriveTime} +1` : f.arriveTime)],
    [air ? '飛行時間' : '所需時間', (f) => f.duration],
  ]
  // 範本沒用到、或每班都沒填的欄位不顯示
  const shown = cols.filter(([, get]) => d.flights.some((f) => get(f)))
  return `<section class="sec" id="flights" aria-labelledby="h-flights">
  ${title('flights', air ? '航班資訊' : '交通資訊')}
  <table class="flights">
    <thead><tr>${shown.map(([h]) => `<th scope="col">${h}</th>`).join('')}</tr></thead>
    <tbody>${d.flights
      .map((f) => `<tr>${shown.map(([h, get]) => `<td data-label="${h}">${esc(get(f))}</td>`).join('')}</tr>`)
      .join('')}</tbody>
  </table>
</section>`
}

function days(d: SiteData): string {
  return `<section class="sec" id="days" aria-labelledby="h-days">
  ${title('days', '行程規劃')}
  ${d.days
    .map(
      (day) => `<article class="day" id="day-${day.n}"${when(day.iso, () => ` data-day-date="${esc(day.iso)}"`)}>
    <div class="daybox">
      ${todayTag}
      ${
        // 一日遊不標 Day 1，圓框裡直接放日期
        d.singleDay && day.date
          ? `<p class="daycircle"><b>${esc(day.date)}</b>${when(day.weekday, () => `<span>${esc(day.weekday)}</span>`)}</p>`
          : `<p class="daycircle"><b>Day ${day.n}</b>${when(day.date, () => `<span>${esc(day.date)}</span>`)}${when(day.weekday, () => `<span>${esc(day.weekday)}</span>`)}</p>`
      }
      <p class="overview">${esc(day.route.join(' → '))}</p>
    </div>
    ${day.spots
      .map(
        (s) => `<div class="spot">
      <h3 class="spot-name">${when(s.time, () => `<span class="spot-time num">${esc(s.time)}</span>`)}【${esc(s.name)}】</h3>
      ${paragraphs(s.content)}
    </div>`,
      )
      .join('')}
  </article>`,
    )
    .join('')}
</section>`
}

function foods(d: SiteData): string {
  return `<section class="sec page" id="foods" aria-labelledby="h-foods">
  ${title('foods', '當地美食、特產')}
  ${d.foods
    .map(
      (f) => `<div class="food">
    <h3 class="food-place">【${esc(f.place)}】</h3>
    <ul>${f.items.map((i) => `<li><b>${esc(i.name)}</b>${when(i.description, () => `：${esc(i.description)}`)}</li>`).join('')}</ul>
  </div>`,
    )
    .join('')}
</section>`
}

function hotels(d: SiteData): string {
  return `<section class="sec page" id="hotels" aria-labelledby="h-hotels">
  ${title('hotels', '住宿資訊')}
  ${d.hotels
    .map(
      (h) => `<article class="hotel">
    <h3 class="hotel-name">${esc(h.name)}</h3>
    ${when(h.address, () => `<p>地址：${esc(h.address)}</p>`)}
    ${when(h.phone, () => `<p>電話：<span class="num">${esc(h.phone)}</span></p>`)}
    <p class="actions no-print">
      ${when(h.name || h.address, () => `<a href="${esc(h.mapUrl)}" target="_blank" rel="noopener">${icon('pin')}地圖</a>`)}
      ${when(h.phone, () => `<a href="tel:${esc(h.phone.replace(/[^\d+]/g, ''))}">${icon('phone')}撥打電話</a>`)}
    </p>
  </article>`,
    )
    .join('')}
</section>`
}

function info(d: SiteData): string {
  return `<section class="sec page" id="info" aria-labelledby="h-info">
  ${title('info', '旅遊資訊')}
  ${d.infos.map((i) => `<div class="info"><h3 class="tag">${esc(i.title)}</h3>${paragraphs(i.content)}</div>`).join('')}
</section>`
}

function checklist(d: SiteData): string {
  let key = 0
  const groups = d.checklist.map(
    (c) => `<div class="check-group">
      ${when(c.name, () => `<h3>${esc(c.name)}</h3>`)}
      <ul class="check-grid">${c.items
        .map((it) => `<li><label><input type="checkbox" data-check="${key++}"><span>${esc(it)}</span></label></li>`)
        .join('')}</ul>
    </div>`,
  )
  return `<section class="sec page" id="checklist" aria-labelledby="h-checklist">
  <div class="checktable">
    <h2 class="check-head" id="h-checklist">萬全的準備是愉快旅程的開始！</h2>
    <div class="progress no-print" aria-live="polite"><div class="bar"><span data-progress-bar></span></div><p data-progress-text></p></div>
    ${groups.join('')}
  </div>
</section>`
}

const BOX_FIXED = 'Day0123456789/星期一二三四五六日→'

/** Day 框、住宿名稱、手冊名稱用圓體 */
export function boxText(d: SiteData): string {
  return [BOX_FIXED, d.title, ...d.days.map((x) => x.route.join('')), ...d.hotels.map((h) => h.name)].join('')
}

export function bodyText(d: SiteData): string {
  return allText(d, `航班資訊行程規劃當地美食特產住宿旅遊資訊萬全的準備是愉快旅程的開始地址電話撥打地圖列印存成全部準備好了已離線中跳到主要內容以旅遊手冊工坊製作航空公司班機起飛時間抵達日期交通業者班次出發飛行所需+${CLIENT_TEXT}`)
}

export function render(d: SiteData, opts: RenderOptions): string {
  const p = d.palette
  const nav = [
    { id: 'flights', label: d.onlyFlights ? '航班' : '交通', show: d.flights.length > 0 },
    { id: 'days', label: '行程', show: d.days.length > 0 },
    { id: 'foods', label: '美食', show: d.foods.length > 0 },
    { id: 'hotels', label: '住宿', show: d.hotels.length > 0 },
    { id: 'info', label: '資訊', show: true },
    { id: 'checklist', label: '清單', show: d.checklist.length > 0 },
  ].filter((n) => n.show)

  const vars = [
    `--a1:${p.accent1}`,
    `--a2:${p.accent2}`,
    `--a3:${p.accent3}`,
    `--a4:${p.accent4}`,
    `--a5:${p.accent5}`,
    `--a6:${p.accent6}`,
    `--a1-line:${mix(p.accent1, '#FFFFFF', 0.55)}`,
    `--a5-line:${mix(p.accent5, '#FFFFFF', 0.72)}`,
    `--a5-soft:${mix(p.accent5, '#FFFFFF', 0.93)}`,
  ].join(';')

  const body = `<header class="top">
  <div class="wrap top-in">
    <h1>${esc(d.title)}</h1>
    ${when(d.dateRange, () => `<p class="dates num">${esc(d.dateRange)}</p>`)}
    ${countdown(d)}
    <span class="offline" data-offline hidden>離線中</span>
  </div>
  <nav class="toc" aria-label="手冊內容"><div class="wrap">${nav.map((n) => `<a href="#${n.id}">${n.label}</a>`).join('')}</div></nav>
</header>
<main id="main" class="wrap">
${when(d.flights.length, () => flights(d))}
${when(d.days.length, () => days(d))}
${when(d.foods.length, () => foods(d))}
${when(d.hotels.length, () => hotels(d))}
${info(d)}
${when(d.checklist.length, () => checklist(d))}
</main>
<footer class="foot no-print">
  <div class="wrap">
    <button type="button" class="print" data-print>${icon('print')}列印／存成 PDF</button>
    <p>以旅遊手冊工坊製作</p>
  </div>
</footer>`

  return page(d, opts, { css, body, themeColor: p.accent1, htmlStyle: vars })
}
