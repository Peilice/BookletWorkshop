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

顏色是小記號，不是面積。項目編號、目前分頁底線、Day 切換底線、新增按鈕、焦點框使用 `accent`；「輸出手冊」是整個畫面唯一用 `accent-strong` 填滿的元素。這兩個顏色在執行時由目前範本的配色決定（主色 accent1、強調色 accent5），對比不足 4.5 時退回墨色，所以切換配色時介面上的小記號會跟著換色，預告成品的顏色。frontmatter 中的 `accent`／`accent-strong` 是範本讀不到時的預設值。

密度屬於熟練使用者的工作台：一列一筆、細線分隔、欄位去掉外框只留底線，填起來像在海報上寫字。只支援桌機，版面寬度固定上限。

**Key Characteristics:**
- 暖白紙底、墨色文字，顏色只出現在小記號
- 粗墨線（2px）分區、細線（1px）分列，沒有卡片
- 巨大 Anton 數字標出天數、序號、日期
- 直角按鈕、1.5px 墨框；欄位只有底線
- 重點色跟著範本配色即時改變，對比不足時退回墨色
- 會動的海報：數字翻牌、重點色線滑動、列從墨線下展開；動態短（0.3 秒內），只回應使用者的操作
- 旅行票券的造型：航班是登機證、飯店是行李吊牌、空清單有墨線小插圖；仍然只用墨線，不加顏色面積

## Colors

紙與墨的雙色系統，加上一個由範本配色決定、只用在小記號上的重點色。

### Primary
- **範本主色記號** (`accent`，執行時 = 範本 accent1，對紙色對比不足時改用 `ink`)：項目編號、目前分頁 4px 底線、Day 切換底線、清單分組數量、新增按鈕文字、焦點外框、游標顏色、核取方塊。永遠只是線、數字或小字。
- **範本強調色** (`accent-strong`，執行時 = 範本 accent5，對白字對比不足時改用 `ink`)：只用在「輸出手冊」按鈕的底色，hover 時混入 18% 黑。

### Neutral
- **暖白紙** (`paper`)：頁面底、固定頂列底、對話框底。頁面底和頂列再疊上 `--paper-texture`（很淡的細顆粒＋橫向纖維，`background-attachment: fixed` 讓兩者紋路對齊）；登機證的半圓缺口也用同一層紙紋。浮起來的東西（對話框、輸出選單）和選項卡維持純 `paper`。紙紋只能更淡，不能加深到讓紙看起來發灰。
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
**The 小記號 Rule.** 重點色只能是線、數字、小字或焦點框，不能填滿任何區塊。唯一例外是「輸出手冊」按鈕。
**The 退回墨色 Rule.** 任何由範本配色驅動的介面顏色都要經過對比檢查（4.5:1），不足時退回 `ink`，不可直接套用使用者選的顏色。

## Typography

**Numeral Font:** Anton（自行託管 latin 400），退回 Microsoft JhengHei
**Heading Font:** Noto Sans TC 900（自行託管），退回 Microsoft JhengHei、PingFang TC
**Body Font:** Microsoft JhengHei，退回 PingFang TC、Noto Sans TC
**Label Font:** Barlow Condensed 600／700（自行託管 latin），只用於數字與拉丁字母標籤

**Character:** 窄高、極粗的海報數字配上最重的黑體標題，內文回到系統正黑體保持安靜。數字負責定位，中文標題負責內容，兩者都很大，中間沒有中等重量的過渡。

### Hierarchy
- **Numeral Display**（Anton 400，180px，行高 0.84）：每日行程左欄的天數，全站最大的字，向左偏移 6px 對齊邊線。
- **Numeral Date**（Anton 400，48px，行高 1）：天數下方的日期。
- **Numeral Seq**（Anton 400，40px，行高 0.95，`accent`）：每一列的項目編號；Day 切換列用 30px 同字型。清單分組數量用 22px。
- **Headline Input**（Noto Sans TC 900，32px，行高 1.25）：每日行程總覽欄位，下方 2px 墨線。
- **Headline**（Noto Sans TC 900，32px，行高 1.2）：分頁標題；對話框標題用 24px。
- **Title**（Noto Sans TC 900，22px）：名稱類欄位（景點名稱、餐廳名稱）與清單分組標題。
- **Body**（400，15px，行高 1.55）：內文與一般欄位；多行欄位行高 1.65。
- **Label Field**（700，12px，字距 0.12em，`ink-soft`）：欄位標籤，永遠在欄位上方。
- **Label Numeric**（Barlow Condensed 600，13–18px，等寬數字）：子項目編號、分頁數量、字數統計、色碼。

### Named Rules
**The 數字定位 Rule.** 「第幾」的資訊（天數、序號、日期）用 Anton 或 Barlow Condensed，並開啟 `tabular-nums`；中文內容不使用這兩個字型。
**The 無中間重量 Rule.** 標題一律 900，內文一律 400，按鈕與標籤 700；不使用 500／600 的中文字重。

## Layout

左右兩欄：左邊是工作台（寬度隨視窗，左右留白 32px），右邊是固定 400px 的深色桌面，放成品預覽（`PreviewDesk.vue`）。頂列 64px 固定在畫面上方，放站名、手冊名稱、檔案操作和「輸出手冊」，下緣 2px 墨線。整個畫面最窄 1180px。

工作台分三步（01 內容、02 風格、03 外觀），是 2px 墨線上的文字分頁。內容步驟左邊是 136px 的區塊清單（直的，重點色線在左邊），右邊是表單。

深色桌面（`#2b2a27`）是唯一的深色面積，底上是切割墊格線（20px 細格 6%、每 100px 一條 14% 的粗線，顏色取 `#cfcabd`），只用來放「紙張」：成品預覽和風格縮圖。工作台本身維持紙墨，讓人不會把表單誤認成成品。

清單以「列」為單位：三欄網格（編號欄 72px、內容、操作），列內上下 22px、欄距 20px，列與列之間 1px 細線，整組上緣 2px 墨線。子項目同樣三欄（40px 編號），上下 14px。新增按鈕對齊內容欄（從編號欄後開始）。

每日行程是兩欄：左欄 260px 的「海報欄」（天數、日期、星期、日期欄位、Day 切換），右欄放總覽與景點列，欄距 40px。清單分頁用兩欄網格，欄距 48px、列距 40px。只做桌機，沒有響應式斷點。

## Elevation & Depth

整體是平的。深度靠墨線粗細（2px 分區、1.5px 欄位與按鈕、1px 細線）與紙色層次（`paper` 與 `paper-2`）表達，不靠陰影。紙紋和切割墊只是材質，不用來分區或表示層級。唯一的陰影屬於浮在遮罩上的對話框。

### Shadow Vocabulary
- **對話框浮起** (`box-shadow: 0 18px 44px rgb(30 29 26 / 28%)`)：只用在確認與產生前檢查對話框，搭配 40% 墨色遮罩。

### Named Rules
**The 線即層級 Rule.** 要分出一個區域時先加墨線，不加底色、不加陰影。

## Motion

工作台的活潑感來自動態和手感，而不是顏色：右邊的成品才是有顏色的主角，工作台不能被誤認成成品。所有動態都只回應使用者的操作（換分頁、換天、新增、刪除、存檔），不自己播放、不循環。共用的樣式在 `styles.css`，`keyOf`、`useSlider` 在 `src/utils/motion.ts`。

- **滑動的重點色線** (`.slider` + `useSlider`，0.28s `cubic-bezier(0.3, 0.9, 0.3, 1)`)：主分頁、Day 切換的 4px `accent` 線，換選項時從舊位置滑到新位置，不是直接跳過去。主分頁的線壓在 2px 墨線上（`--slider-drop: 2px`）。
- **翻牌數字** (`.flip`，0.26s ease-out)：Day 海報欄的天數和日期用 `:key` 換新元素，從上方翻下來（`rotateX(-90deg)` → 0）。只有進場、沒有離場，數字快速連續變化也不會出錯。
- **列的進出** (`<TransitionGroup name="row">`)：新增的列從上緣往下展開（`clip-path`，0.32s），Anton 編號隨後彈出蓋上（延遲 0.15s）；刪除的列往左滑 24px 並淡出（0.2s），下面的列遞補；上移／下移時列滑到新位置（0.28s）。列一定要用 `keyOf(item)` 當 key，不可用索引，否則動畫會落在錯的那一列。滑走中的列不能再按。
- **存檔回饋**：存檔後頂列的「有變更尚未存檔」換成 `ok` 色的「已存檔」，彈出（0.3s）並一筆畫出打勾，2 秒後消失。
- **減少動態**：`prefers-reduced-motion: reduce` 時所有 transition、animation 關閉，畫面直接到最終狀態。

### Named Rules
**The 只回應操作 Rule.** 動態只在使用者做了什麼之後出現，0.35 秒內結束；不做進場表演、載入動畫或循環動畫。
**The 不用 out-in Rule.** 數字換新用 `:key` 加 CSS animation，不用 `<Transition mode="out-in">`；後者在數字快速連續變化時會讓 Vue 出錯。

## Shapes

全直角（0px）。按鈕、欄位、選項框、色塊樣本、對話框都沒有圓角。圓形只有三處：頂列「尚未存檔」的 7px 狀態點、登機證撕線上下的 12px 半圓缺口、行李吊牌的 12px 打孔，後兩者都只是墨線的一部分。框線只有三種粗細：2px（分區、對話框、總覽欄底線）、1.5px（按鈕、欄位底線、選項框、核取方格）、1px（列分隔）。

## Components

### Buttons
直角、墨框、反白回應。
- **Shape:** 直角（0px），1.5px 墨框，字重 700，內距 6px 14px。
- **Default:** 透明底、墨字；hover 反轉為墨底紙字（0.15s ease-out）。
- **Primary:** 墨底紙字，hover 改用 `ink-hover`。
- **Generate:** 「輸出手冊」專用，`accent-strong` 底白字，顏色切換 0.3s；全畫面只有這一顆。
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
- **工作台步驟:** 2px 墨線上的純文字分頁，16px、間距 28px，前面是 Barlow Condensed 的 `accent` 編號（01、02、03）；目前步驟在墨線上壓一條 4px `accent` 底線，換步驟時滑過去。右邊是「下一步」。
- **內容區塊:** 直的清單，一列一個區塊，名稱後接 Barlow Condensed 數量；目前區塊左邊一條 4px `accent` 直線，換區塊時滑過去。目前風格不顯示的區塊名稱變淡，表單上方加一行 `warn-bg` 提示；不顯示的欄位在標籤後加 `warn` 色的「不顯示」。
- **Day 切換:** Anton 30px 的兩位數字，目前那天 4px `accent` 底線，換天時滑過去。

### Rows（列）
清單的基本單位：Anton 編號（`accent`）、內容、操作按鈕三欄，1px 細線分隔，整組頂端 2px 墨線。新增、刪除、上移／下移的動態見 Motion。

### Ticket Rows（旅行票券造型）
用墨線把列畫成旅行時拿在手上的東西，讓人一眼認出是哪一類資料；不加顏色面積、不加陰影。
- **登機證（航班）:** 內容最上面一行是 22px 900 的「起飛地 → 抵達地」，中間是 `accent` 的 route 圖示，右邊是 Barlow Condensed 700 的班機號碼（`ink-soft`）。操作按鈕前一條 1.5px `field-line` 虛線撕線，上下各一個 12px 半圓缺口，撕線貫穿整列高度。
- **行李吊牌（飯店）:** 編號欄上方一個 12px `ink-soft` 圓形打孔，編號欄右側 1.5px `hair` 虛線。

### Empty State（空清單）
清單的 2px 墨線下面，放一張 64px 的墨線小插圖（`EmptyArt.vue`，線寬 1.75，`currentColor`）和一句 `ink-soft` 白話，告訴使用者這裡可以填什麼。插圖一類一張：航班是登機證、景點是地圖釘、飯店是鑰匙、美食是碗筷、旅遊資訊是路標。句子用使用者的話，例如「還沒有航班。訂好機票後，把班機和時間填進來。」

### Choice（範本／配色選項）
1.5px `hair` 框、紙色底、內距 14px 16px；hover 框轉 `ink-soft`；選中時墨框加 1px 內框（合計 2.5px 感）。配色樣本為無間距並排的 24px 方塊。

### Banners & Dialogs
- **Banner:** 無框，10px 14px 內距、14px 字，依狀態使用 `paper-2`／`warn-bg`／`ok-bg` 底。
- **Dialog:** 紙色底、2px 墨框、直角、內距 24px 28px，最寬 460px（產生前檢查 580px），帶唯一的陰影。

### Day Poster（每日行程海報欄，signature）
左欄 260px：Barlow Condensed 700 的「DAY」字樣（20px、字距 0.5em）緊貼 180px Anton 天數，下接 48px Anton 日期、17px 星期，再以 1px 細線隔開日期欄位與 Day 切換列。換天或改日期時，天數和日期翻牌換新。「DAY」只屬於這個數字組合，是數字的單位而非標題上方的小標。

### Icons
自製 16px SVG，線寬 1.75、圓端，顏色跟隨文字（`currentColor`）。目前有上、下、加、route（航線箭頭）四個。空清單的插圖是 64px，同樣線寬 1.75。

## Do's and Don'ts

### Do:
- **Do** 用 2px 墨線分區、1px `hair` 分列，讓每個區域從一條墨線開始。
- **Do** 把「第幾」的資訊寫成 Anton 數字並開啟 `tabular-nums`；項目編號用 `accent`。
- **Do** 讓所有範本驅動的顏色經過 `readableOr` 對比檢查（4.5:1），不足時退回 `ink`。
- **Do** 保持按鈕與欄位直角（0px）、1.5px 線寬。
- **Do** 新圖示照 Icon.vue 的規格：16px、線寬 1.75、`currentColor`。
- **Do** 清單用 `<TransitionGroup name="row">` 並以 `keyOf(item)` 當 key；新的空清單放 `EmptyArt` 插圖和一句白話。
- **Do** 讓活潑感來自動態和墨線造型（登機證、吊牌、插圖），工作台的顏色仍只有小記號。

### Don't:
- **Don't** 用重點色填滿區塊；`accent-strong` 底色只屬於「輸出手冊」。
- **Don't** 用圓角白卡片堆在灰底上、膠囊形分頁或色塊頂列。
- **Don't** 給欄位加四邊外框；欄位只有底線。
- **Don't** 在對話框以外使用陰影。
- **Don't** 在中文標題上方加小字標（eyebrow）；「DAY」字樣只能和天數數字一起出現。
- **Don't** 用文字符號或表情符號當圖示。
- **Don't** 做超過 0.35 秒、自己播放或循環的動畫；也不要用 `<Transition mode="out-in">` 換數字。
- **Don't** 用重點色疊印、色塊編號或螢光筆底線來「活潑」工作台（試過的「套色印刷」方案，會讓工作台看起來像成品）。
