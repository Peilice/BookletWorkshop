// 讀圖片檔、縮小壓縮成可以存進手冊的照片（只能在瀏覽器裡做）

import type { Photo } from '../model/booklet'
import { fitSize, MAX_EDGE, type PhotoKind } from '../model/photo'

const QUALITY = 0.78

export class PhotoError extends Error {}

/** 縮小、轉成 JPEG 的 data URL；透明的部分鋪白底 */
export async function compressPhoto(file: File, kind: PhotoKind): Promise<Photo> {
  if (!file.type.startsWith('image/')) throw new PhotoError('這不是圖片檔，請選 JPG、PNG 或 WebP。')
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new PhotoError('這張圖片無法讀取，請換一張（HEIC 請先轉成 JPG）。')
  }
  const { width, height } = fitSize(bitmap.width, bitmap.height, MAX_EDGE[kind])
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new PhotoError('無法處理這張圖片。')
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', QUALITY)
}
