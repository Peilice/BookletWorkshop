// 日本文青手帳：做舊紙張、橫格筆記頁、機票票根、郵戳；Day 用襯線斜體加一道手寫弧線

import { esc, paragraphs, when } from '../../html'
import type { SiteData } from '../../siteData'
import { dateW, renderBasic } from '../common/basic'
import { icon } from '../common/icons'
import { todayTag } from '../common/page'
import type { RenderOptions } from '../types'
import css from './style.css?raw'

export const render = (d: SiteData, opts: RenderOptions) =>
  renderBasic(d, opts, {
    css,
    themeColor: '#efe4cc',
    headerTop: '<span class="postmark" aria-hidden="true"><b>TRIP</b><small>POST</small></span>',
    flight: (f, data) => {
      const carrier = [data.onlyFlights ? '' : f.modeLabel, f.airline, f.flightNo].filter(Boolean).join(' ')
      return `<div class="tk-main"><small>${esc(data.onlyFlights ? 'AIR TICKET' : 'TICKET')}${when(f.leg, () => ` ・ ${esc(f.leg)}`)}</small>
        <b class="code">${esc(f.from)} → ${esc(f.to)}</b>
        <span class="num">${esc(dateW(f.date, f.weekdayShort))}　${esc(carrier)}</span></div>
      <div class="tk-stub num"><small>${esc(f.departWord)}</small><b>${esc(f.departTime)}</b>${when(f.arriveTime, () => `<small>→ ${esc(f.arriveTime)}${f.nextDay ? ' +1' : ''}</small>`)}</div>`
    },
    dayHead: (day, data) => `${when(!data.singleDay, () => `<b class="day-n num">Day ${day.n}</b>`)}
      <span class="num date">${esc(dateW(day.date, day.weekdayShort))}</span>${todayTag}
      ${when(day.departTime, () => `<span class="num dep">${esc(day.departTime)} 出門</span>`)}`,
    hotel: (h) => {
      const stay = [h.checkIn && `${h.checkIn} 入住`, h.checkOut && `${h.checkOut} 退房`].filter(Boolean).join(' – ')
      return `<small class="hk">HOTEL${when(h.city, () => ` ・ ${esc(h.city)}`)}</small><h3>${esc(h.name)}</h3>
    ${when(stay, () => `<p class="num">${esc(stay)}</p>`)}
    ${when(h.address, () => `<p>${esc(h.address)}</p>`)}
    ${when(h.phone, () => `<p class="num">${esc(h.phone)}</p>`)}
    ${when(h.note, () => paragraphs(h.note))}
    <p class="actions no-print">
      ${when(h.name || h.address, () => `<a href="${esc(h.mapUrl)}" target="_blank" rel="noopener">${icon('pin')}地圖</a>`)}
      ${when(h.phone, () => `<a href="tel:${esc(h.phone.replace(/[^\d+]/g, ''))}">${icon('phone')}撥打電話</a>`)}
    </p>`
    },
  })
