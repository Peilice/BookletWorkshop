// 票券／護照：交通做成登機證／車票，住宿做成住宿券，每天蓋一個章

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
    themeColor: '#e9e4d6',
    flight: (f, data) => {
      const carrier = [data.onlyFlights ? '' : f.modeLabel, f.airline, f.flightNo].filter(Boolean).join(' ')
      return `<div class="tk-main">
        <small>${esc(data.onlyFlights ? '登機證' : f.modeLabel)}${when(f.leg, () => ` ・ ${esc(f.leg)}`)}</small>
        <b class="code">${esc(f.from)} → ${esc(f.to)}</b>
        <span class="num">${esc(dateW(f.date, f.weekdayShort))}　${esc(carrier)}</span>
      </div>
      <div class="tk-stub num"><small>${esc(f.departWord)}</small><b>${esc(f.departTime)}</b>${when(f.arriveTime, () => `<small>抵達 ${esc(f.arriveTime)}${f.nextDay ? ' +1' : ''}</small>`)}${when(f.duration, () => `<small>${esc(f.duration)}</small>`)}</div>`
    },
    dayHead: (day, data) => `${when(!data.singleDay, () => `<span class="stamp" aria-label="第 ${day.n} 天"><small>DAY</small><b class="num">${day.n}</b></span>`)}
      <span class="num date">${esc(dateW(day.date, day.weekdayShort))}</span>${todayTag}
      ${when(day.departTime, () => `<span class="num dep">${esc(day.departTime)} 出門</span>`)}`,
    hotel: (h) => {
      const stay = [h.checkIn && `${h.checkIn} 入住`, h.checkOut && `${h.checkOut} 退房`].filter(Boolean).join(' – ')
      return `<div class="tk-main"><small>${esc(h.city || '住宿券')}</small><b class="code">${esc(h.name)}</b>
        ${when(stay, () => `<span class="num">${esc(stay)}</span>`)}
        ${when(h.address, () => `<span>${esc(h.address)}</span>`)}
        ${when(h.phone, () => `<span class="num">${esc(h.phone)}</span>`)}
        ${when(h.note, () => paragraphs(h.note))}</div>
      <p class="actions no-print tk-stub">
        ${when(h.name || h.address, () => `<a href="${esc(h.mapUrl)}" target="_blank" rel="noopener">${icon('pin')}地圖</a>`)}
        ${when(h.phone, () => `<a href="tel:${esc(h.phone.replace(/[^\d+]/g, ''))}">${icon('phone')}電話</a>`)}
      </p>`
    },
  })
