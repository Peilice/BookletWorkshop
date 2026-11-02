---
name: 旅遊手冊工坊
description: 把旅行海報的排版紀律放進表單工具：暖白紙底、墨線分區、巨大 Anton 數字。
colors:
  accent: "#5f6b57"
  accent-strong: "#bc003f"
  paper: "#faf9f5"
  paper-2: "#f1efe8"
  ink: "#1e1d1a"
  ink-hover: "#3a3833"
  ink-soft: "#6b685f"
  placeholder: "#716d64"
  hair: "#d9d6cd"
  field-line: "#a9a59a"
  danger: "#a3233a"
  warn: "#8a5a00"
  warn-bg: "#fbf3dc"
  ok: "#2f6b3c"
  ok-bg: "#e9f2e6"
typography:
  numeral-display:
    fontFamily: "Anton, Microsoft JhengHei, sans-serif"
    fontSize: "220px"
    fontWeight: 400
    lineHeight: 0.84
  numeral-date:
    fontFamily: "Anton, Microsoft JhengHei, sans-serif"
    fontSize: "48px"
    fontWeight: 400
    lineHeight: 1
  numeral-seq:
    fontFamily: "Anton, Microsoft JhengHei, sans-serif"
    fontSize: "40px"
    fontWeight: 400
    lineHeight: 0.95
  headline-input:
    fontFamily: "Noto Sans TC, Microsoft JhengHei, PingFang TC, sans-serif"
    fontSize: "40px"
    fontWeight: 900
    lineHeight: 1.25
  headline:
    fontFamily: "Noto Sans TC, Microsoft JhengHei, PingFang TC, sans-serif"
    fontSize: "32px"
    fontWeight: 900
    lineHeight: 1.2
  title:
    fontFamily: "Noto Sans TC, Microsoft JhengHei, PingFang TC, sans-serif"
    fontSize: "22px"
    fontWeight: 900
  body:
    fontFamily: "Microsoft JhengHei, PingFang TC, Noto Sans TC, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label-numeric:
    fontFamily: "Barlow Condensed, Microsoft JhengHei, sans-serif"
    fontSize: "18px"
    fontWeight: 600
  label-field:
    fontFamily: "Microsoft JhengHei, PingFang TC, Noto Sans TC, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.12em"
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "14px"
  row-gap: "20px"
  row: "22px"
  gutter: "32px"
  column: "48px"
components:
  button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "6px 14px"
  button-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "6px 14px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-generate:
    backgroundColor: "{colors.accent-strong}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
    padding: "6px 14px"
  button-add:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    padding: "6px 0"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    padding: "4px 7px"
  button-icon-hover:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "6px 2px"
  tab:
    textColor: "{colors.ink-soft}"
    padding: "10px 0 12px"
  tab-active:
    textColor: "{colors.ink}"
  dialog:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "24px 28px"
    width: "460px"
---

# Design System: 旅遊手冊工坊

## Overview

**Creative North Star: "墨色巨字"**

這是一張印在暖白紙上的旅行海報，只是每一格都能填寫。介面幾乎只用墨色與紙色兩種顏色，分區靠粗墨線（2px）而不是卡片或色塊；層級靠字的大小與重量，而不是底色。最大的聲音交給 Anton 數字：第幾天、第幾筆、日期都用窄高的海報數字寫出來，讓人一眼知道自己在哪裡。

顏色是小記號，不是面積。項目編號、目前分頁底線、Day 切換底線、新增按鈕、焦點框使用 `accent`；「產生 Word」是整個畫面唯一用 `accent-strong` 填滿的元素。這兩個顏色在執行時由目前範本的配色決定（主色 accent1、強調色 accent5），對比不足 4.5 時退回墨色，所以切換配色時介面上的小記號會跟著換色，預告成品的顏色。frontmatter 中的 `accent`／`accent-strong` 是範本讀不到時的預設值。

密度屬於熟練使用者的工作台：一列一筆、細線分隔、欄位去掉外框只留底線，填起來像在海報上寫字。只支援桌機，版面寬度固定上限。

**Key Characteristics:**
- 暖白紙底、墨色文字，顏色只出現在小記號
- 粗墨線（2px）分區、細線（1px）分列，沒有卡片
- 巨大 Anton 數字標出天數、序號、日期
- 直角按鈕、1.5px 墨框；欄位只有底線
- 重點色跟著範本配色即時改變，對比不足時退回墨色

## Colors

紙與墨的雙色系統，加上一個由範本配色決定、只用在小記號上的重點色。

### Primary
- **範本主色記號** (`accent`，執行時 = 範本 accent1，對紙色對比不足時改用 `ink`)：項目編號、目前分頁 4px 底線、Day 切換底線、清單分組數量、新增按鈕文字、焦點外框、游標顏色、核取方塊。永遠只是線、數字或小字。
- **範本強調色** (`accent-strong`，執行時 = 範本 accent5，對白字對比不足時改用 `ink`)：只用在「產生 Word」按鈕的底色，hover 時混入 18% 黑。

### Neutral
- **暖白紙** (`paper`)：頁面底、固定頂列底、對話框底。
- **淡紙** (`paper-2`)：一般提示列底、圖示按鈕 hover 底。唯一的中性面積色，只用在小區塊。
- **墨** (`ink`)：文字、按鈕框、主要按鈕底、2px 分區線、選取框。
- **墨（hover）** (`ink-hover`)：主要按鈕 hover。
- **淡墨** (`ink-soft`)：欄位標籤、提示文字、未選分頁、子項目編號、圖示按鈕。
- **提示字** (`placeholder`)：欄位 placeholder。
- **細線** (`hair`)：列與列之間 1px 分隔、未選選項框。
- **欄位底線** (`field-line`)：輸入欄位靜止時的 1.5px 底線、捲軸。

### 狀態色
- **危險** (`danger`)：刪除按鈕 hover、錯誤提示文字。
- **警告** (`warn` / `warn-bg`)：未存檔狀態點、字數超過、配色警告。
- **完成** (`ok` / `ok-bg`)：成功提示列。

### Named Rules
**The 小記號 Rule.** 重點色只能是線、數字、小字或焦點框，不能填滿任何區塊。唯一例外是「產生 Word」按鈕。
**The 退回墨色 Rule.** 任何由範本配色驅動的介面顏色都要經過對比檢查（4.5:1），不足時退回 `ink`，不可直接套用使用者選的顏色。

## Typography

**Numeral Font:** Anton（自行託管 latin 400），退回 Microsoft JhengHei
**Heading Font:** Noto Sans TC 900（自行託管），退回 Microsoft JhengHei、PingFang TC
**Body Font:** Microsoft JhengHei，退回 PingFang TC、Noto Sans TC
**Label Font:** Barlow Condensed 600／700（自行託管 latin），只用於數字與拉丁字母標籤

**Character:** 窄高、極粗的海報數字配上最重的黑體標題，內文回到系統正黑體保持安靜。數字負責定位，中文標題負責內容，兩者都很大，中間沒有中等重量的過渡。

### Hierarchy
- **Numeral Display**（Anton 400，220px，行高 0.84）：每日行程左欄的天數，全站最大的字，向左偏移 6px 對齊邊線。
- **Numeral Date**（Anton 400，48px，行高 1）：天數下方的日期。
- **Numeral Seq**（Anton 400，40px，行高 0.95，`accent`）：每一列的項目編號；Day 切換列用 30px 同字型。清單分組數量用 22px。
- **Headline Input**（Noto Sans TC 900，40px，行高 1.25）：每日行程總覽欄位，下方 2px 墨線。
- **Headline**（Noto Sans TC 900，32px，行高 1.2）：分頁標題；對話框標題用 24px。
- **Title**（Noto Sans TC 900，22px）：名稱類欄位（景點名稱、餐廳名稱）與清單分組標題。
- **Body**（400，15px，行高 1.55）：內文與一般欄位；多行欄位行高 1.65。
- **Label Field**（700，12px，字距 0.12em，`ink-soft`）：欄位標籤，永遠在欄位上方。
- **Label Numeric**（Barlow Condensed 600，13–18px，等寬數字）：子項目編號、分頁數量、字數統計、色碼。

### Named Rules
**The 數字定位 Rule.** 「第幾」的資訊（天數、序號、日期）用 Anton 或 Barlow Condensed，並開啟 `tabular-nums`；中文內容不使用這兩個字型。
**The 無中間重量 Rule.** 標題一律 900，內文一律 400，按鈕與標籤 700；不使用 500／600 的中文字重。

## Layout

單欄固定寬度工作台：內容上限 1240px，左右留白 32px，置中。頂列固定在畫面上方，第一行 64px 高放站名與檔案操作，第二行是分頁，下緣 2px 墨線。

清單以「列」為單位：三欄網格（編號欄 72px、內容、操作），列內上下 22px、欄距 20px，列與列之間 1px 細線，整組上緣 2px 墨線。子項目同樣三欄（40px 編號），上下 14px。新增按鈕對齊內容欄（從編號欄後開始）。

每日行程是兩欄：左欄 340px 的「海報欄」（天數、日期、星期、日期欄位、Day 切換），右欄放總覽與景點列，欄距 48px。清單分頁用兩欄網格，欄距 48px、列距 40px。只做桌機，沒有響應式斷點。

## Elevation & Depth

整體是平的。深度靠墨線粗細（2px 分區、1.5px 欄位與按鈕、1px 細線）與紙色層次（`paper` 與 `paper-2`）表達，不靠陰影。唯一的陰影屬於浮在遮罩上的對話框。

### Shadow Vocabulary
- **對話框浮起** (`box-shadow: 0 18px 44px rgb(30 29 26 / 28%)`)：只用在確認與產生前檢查對話框，搭配 40% 墨色遮罩。

### Named Rules
**The 線即層級 Rule.** 要分出一個區域時先加墨線，不加底色、不加陰影。

## Shapes

全直角（0px）。按鈕、欄位、選項框、色塊樣本、對話框都沒有圓角。唯一的圓形是頂列「尚未存檔」的 7px 狀態點。框線只有三種粗細：2px（分區、對話框、總覽欄底線）、1.5px（按鈕、欄位底線、選項框、核取方格）、1px（列分隔）。

## Components

### Buttons
直角、墨框、反白回應。
- **Shape:** 直角（0px），1.5px 墨框，字重 700，內距 6px 14px。
- **Default:** 透明底、墨字；hover 反轉為墨底紙字（0.15s ease-out）。
- **Primary:** 墨底紙字，hover 改用 `ink-hover`。
- **Generate:** 「產生 Word」專用，`accent-strong` 底白字，顏色切換 0.3s；全畫面只有這一顆。
- **Add:** 無框，`accent` 文字前帶 16px 加號圖示，hover 出現 1.5px 底線（偏移 5px）。
- **Icon:** 無框，13px、`ink-soft`，用於上移／下移／刪除；hover 為 `paper-2` 底；刪除 hover 轉 `danger`。
- **Disabled:** 透明度 0.35。
- **Focus:** 全站 2px `accent` 外框，偏移 2px。

### Inputs / Fields
- **Style:** 無外框、無底色，只有 1.5px `field-line` 底線，內距 6px 2px；多行欄位隨內容長高（至少兩行）。
- **Hover:** 底線轉為墨色。
- **Focus:** 底線轉 `accent`，再加 1.5px 同色下陰影，成為 3px 底線；不顯示外框。
- **Label:** 標籤在上、欄位在下，間距 2px。
- **名稱類欄位:** 22px 900 的 Noto Sans TC，像海報標題。

### Navigation
- **主分頁:** 2px 墨線上的純文字分頁，16px、間距 28px；未選為 `ink-soft`，目前分頁為墨色並在墨線上壓一條 4px `accent` 底線。分頁名後接 Barlow Condensed 數量。「範本與樣式」靠右。
- **Day 切換:** Anton 30px 的兩位數字，目前那天 4px `accent` 底線。

### Rows（列）
清單的基本單位：Anton 編號（`accent`）、內容、操作按鈕三欄，1px 細線分隔，整組頂端 2px 墨線。空狀態同樣以 2px 墨線起頭，36px 上下留白。

### Choice（範本／配色選項）
1.5px `hair` 框、紙色底、內距 14px 16px；hover 框轉 `ink-soft`；選中時墨框加 1px 內框（合計 2.5px 感）。配色樣本為無間距並排的 24px 方塊。

### Banners & Dialogs
- **Banner:** 無框，10px 14px 內距、14px 字，依狀態使用 `paper-2`／`warn-bg`／`ok-bg` 底。
- **Dialog:** 紙色底、2px 墨框、直角、內距 24px 28px，最寬 460px（產生前檢查 580px），帶唯一的陰影。

### Day Poster（每日行程海報欄，signature）
左欄 340px：Barlow Condensed 700 的「DAY」字樣（20px、字距 0.5em）緊貼 220px Anton 天數，下接 48px Anton 日期、17px 星期，再以 1px 細線隔開日期欄位與 Day 切換列。「DAY」只屬於這個數字組合，是數字的單位而非標題上方的小標。

### Icons
自製 16px SVG，線寬 1.75、圓端，顏色跟隨文字（`currentColor`）。目前只有上、下、加三個。

## Do's and Don'ts

### Do:
- **Do** 用 2px 墨線分區、1px `hair` 分列，讓每個區域從一條墨線開始。
- **Do** 把「第幾」的資訊寫成 Anton 數字並開啟 `tabular-nums`；項目編號用 `accent`。
- **Do** 讓所有範本驅動的顏色經過 `readableOr` 對比檢查（4.5:1），不足時退回 `ink`。
- **Do** 保持按鈕與欄位直角（0px）、1.5px 線寬。
- **Do** 新圖示照 Icon.vue 的規格：16px、線寬 1.75、`currentColor`。

### Don't:
- **Don't** 用重點色填滿區塊；`accent-strong` 底色只屬於「產生 Word」。
- **Don't** 用圓角白卡片堆在灰底上、膠囊形分頁或色塊頂列。
- **Don't** 給欄位加四邊外框；欄位只有底線。
- **Don't** 在對話框以外使用陰影。
- **Don't** 在中文標題上方加小字標（eyebrow）；「DAY」字樣只能和天數數字一起出現。
- **Don't** 用文字符號或表情符號當圖示。
