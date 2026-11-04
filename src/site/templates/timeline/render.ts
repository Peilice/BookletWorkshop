// 時間軸：單欄垂直時間線，左邊時間、右邊景點卡片

import type { SiteData } from '../../siteData'
import { renderBasic } from '../common/basic'
import type { RenderOptions } from '../types'
import css from './style.css?raw'

export const render = (d: SiteData, opts: RenderOptions) => renderBasic(d, opts, { css })
