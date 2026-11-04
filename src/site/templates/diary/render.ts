// 手帳拼貼：點點方格紙、紙膠帶、便利貼，手寫感字型

import type { SiteData } from '../../siteData'
import { basicText, renderBasic } from '../common/basic'
import type { RenderOptions } from '../types'
import css from './style.css?raw'

export const render = (d: SiteData, opts: RenderOptions) => renderBasic(d, opts, { css, themeColor: '#fffdf5' })

export const bodyText = (d: SiteData) => basicText(d)
