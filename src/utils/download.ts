/** 把資料存成檔案下載到使用者電腦 */
export function downloadFile(data: BlobPart, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  // 延後釋放，避免部分瀏覽器還沒開始下載就被取消
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
