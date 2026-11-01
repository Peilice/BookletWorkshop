// 套版後處理：Day 方塊在迴圈裡被複製後，圖形的 id 會重複，Word 可能因此判定檔案損毀。

export function renumberDrawingIds(documentXml: string): string {
  let next = 1000
  return (
    documentXml
      // 浮動物件本身（wp:docPr）和群組裡的每個圖形（wps:cNvPr、wpg:cNvPr、pic:cNvPr）都要唯一
      .replace(/<(wp:docPr|wps:cNvPr|wpg:cNvPr|pic:cNvPr) id="\d+"/g, (_m, tag) => `<${tag} id="${next++}"`)
      // Word 2010 的物件識別碼也會重複，移除後 Word 開檔時會自動重建
      .replace(/ wp14:(anchorId|editId)="[0-9A-Fa-f]+"/g, '')
  )
}
