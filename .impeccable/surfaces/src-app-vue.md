---
version: 1
slug: "src-app-vue"
primary_target: "src/App.vue"
related_targets: ["src/styles.css","src/components"]
---

# 旅遊手冊工坊：編輯畫面

## Scope

整個網站只有一個畫面（App.vue 與各分頁元件）：頂部檔案操作、七個表單分頁、確認與產生前檢查對話框。Mode: Operate。

## Audience and task

Alice 本人在電腦上分好幾次填寫旅遊資料，最後選範本／配色／字體產生 Word。熟練使用者，重視填寫順手、存檔可靠。

## Constraints

- 只支援桌機瀏覽器；不做手機版。
- 不加大面積色塊（使用者明確要求）。
- 介面文字繁體中文；網站名稱「旅遊手冊工坊」。
- 保留所有現有功能、文字、鍵盤操作與 aria 結構。

## Direction contract

THESIS: 旅行海報的排版紀律放進表單工具：巨大的 Anton 數字標出「第幾天、第幾筆」，粗墨線分區，欄位去掉外框只留底線。拒絕的預設：圓角白卡片堆疊在灰底上、膠囊分頁、色塊頂列。

OWN-WORLD: 暖白紙底 #FAF9F5、墨色 #1E1D1A、細分隔線 #D9D6CD；Anton 數字、Barlow Condensed 標籤數字、系統正黑體內文。直角按鈕、1.5px 墨框；主要動作墨底白字，「產生 Word」用範本強調色。顏色只出現在小記號：項目編號、目前分頁底線、Day 切換底線、新增按鈕、焦點。配色取自目前選的範本配色（主色 accent1、強調色 accent5），對比不足時退回墨色。

STORY: 打開就知道現在在哪個分頁、第幾天；填欄位像在海報上寫字；切換配色時整個介面的小記號立即換色，預告成品的顏色；按「產生 Word」拿到手冊。

FIRST VIEWPORT: 頂列第一行左側站名，右側未存檔狀態、新增／讀取／存檔、產生 Word；第二行七個分頁，下緣 2px 墨線，整個頂列固定在畫面上方。每日行程分頁：左欄 340px，DAY 小字、Anton 240px 天數、Anton 日期、星期與日期欄位、Day 編號切換列；右欄總覽大字欄位，下方景點列，每列 Anton 編號（強調色）＋名稱＋內容，細線分隔。

FORM: G2 墨色巨字（使用者在第二、三輪比較中指定；未執行 concept-seed，方向由使用者釘選）。Signature move：巨大 Anton 序號（Day 數字、項目編號）+ 配色即時染色小記號。

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- 網站名稱是否加英文字樣（目前維持中文）。
