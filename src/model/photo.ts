// 照片的尺寸規則和統計；縮小、壓縮在瀏覽器裡做（utils/photo.ts）。存檔、瀏覽器暫存、單一 HTML 都會帶著照片走，不壓縮會太大

import type { Booklet, Photo } from './booklet'

export type PhotoKind = 'spot' | 'cover' | 'background'

// 最長邊的像素上限：封面、封底要撐滿一整頁，景點照只是頁面裡的一張圖，底圖上面還蓋著半透明的底色
export const MAX_EDGE: Record<PhotoKind, number> = { spot: 1000, cover: 1600, background: 1200 }

/** 超過手冊裡照片的合計大小（字元數，約等於檔案大小）就提醒：瀏覽器暫存只有約 5 MB */
export const PHOTO_BUDGET = 3_500_000

/** 縮到最長邊不超過 max；本來就比較小就不放大 */
export function fitSize(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

/** 手冊裡所有照片，依序是封面、封底、底圖、各景點 */
export function allPhotos(b: Booklet): Photo[] {
  return [b.cover, b.backCover, b.background, ...b.days.flatMap((d) => d.spots.map((s) => s.photo ?? ''))].filter(Boolean)
}

export const photoSize = (b: Booklet): number => allPhotos(b).reduce((sum, p) => sum + p.length, 0)

const DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/

/** 只收圖片的 data URL，其他一律當成沒有照片（存檔是外來內容，不能讓它塞進網址或腳本） */
export const safePhoto = (v: unknown): Photo => (typeof v === 'string' && DATA_URL.test(v) ? v : '')
