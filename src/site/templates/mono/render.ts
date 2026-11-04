// 極簡黑白：只有黑、灰和一條細線，單欄、表格式排版，不用網路字型。適合列印成 A4 帶著走

import { renderBasic } from '../common/basic'
import type { SiteData } from '../../siteData'
import type { RenderOptions } from '../types'
import css from './style.css?raw'

export const render = (d: SiteData, opts: RenderOptions) => renderBasic(d, opts, { css })
