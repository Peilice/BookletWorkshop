<script setup lang="ts">
// 拋棄式原型：左邊是工作台（內容 → 風格 → 外觀），右邊是深色桌面上的紙張（真正的網站版輸出）
import { computed, onMounted, ref, watch } from 'vue'
import { CHECKLIST_CATEGORIES, type Booklet, type ChecklistCategory, type FormField, type PaletteColors, type TemplateManifest } from '../model/booklet'
import { newDay, newFlight, newFoodItem, newFoodPlace, newHotel, newInfo, newSpot } from '../model/defaults'
import { osakaKyoto } from '../model/sample'
import { readableOr } from '../model/contrast'
import { renderSite, siteTemplate } from '../site/build'
import { toSiteData } from '../site/siteData'
import { useTemplates } from '../store/templates'
import EmptyArt from '../components/EmptyArt.vue'
import { keyOf, useSlider } from '../utils/motion'

const { templates, loadTemplates } = useTemplates()

const booklet = ref<Booklet>(structuredClone(osakaKyoto))
const templateId = ref('season')
const palette = ref<PaletteColors | null>(null)
const font = ref('') // 空字串：用風格預設字型
type Step = 'content' | 'style' | 'look'
const step = ref<Step>('content')

const manifest = computed<TemplateManifest | undefined>(() => templates.value.find((t) => t.id === templateId.value))
const effective = computed(() => palette.value ?? manifest.value?.presets[0].colors)
// 先填內容、後選風格：表單不再依風格隱藏，只標出目前風格用不到的欄位
const unused = (f: FormField) => !!manifest.value && !manifest.value.formFields.includes(f)

// ---------- 共用精選字型（Word 和網站都能用的免費字型） ----------
const FONTS = [
  { family: '', label: '風格預設', note: '每個風格自己挑的字型' },
  { family: 'Noto Sans TC', label: '思源黑體', note: '清楚好讀' },
  { family: 'Noto Serif TC', label: '思源宋體', note: '典雅、像書' },
  { family: 'LXGW WenKai TC', label: '霞鶩文楷', note: '手寫感' },
  { family: 'Iansui', label: '芫荽', note: '溫和圓潤' },
  { family: 'Huninn', label: '粉圓', note: '可愛、輕鬆' },
]
const fontUrl = (family: string, weights = '400;700') =>
  `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weights}&display=swap`

// 原型：字型用 Google Fonts 連結，不像正式版那樣內嵌；選了共用字型就強制覆蓋風格字型
function fontCss(m: TemplateManifest, override: string): string {
  const own = siteTemplate(m.site!).fonts.map((f) => `@import url('${fontUrl(f.family, f.weights.join(';'))}');`)
  if (!override) return own.join('\n')
  return [...own, `@import url('${fontUrl(override)}');`, `body, body * { font-family: '${override}', sans-serif !important; }`].join('\n')
}

function build(m: TemplateManifest, colors: PaletteColors, override: string, print = false): string {
  const html = renderSite(m.site!, toSiteData(booklet.value, m, colors), { fontCss: fontCss(m, override), print })
  // 預覽裡不改網址的 #（分頁腳本會用 replaceState 記錄目前分頁）
  return html.replace('<head>', '<head><script>history.replaceState = function () {}<\/script>')
}

// ---------- 內容區塊 ----------
type SectionId = 'flights' | 'days' | 'hotels' | 'foods' | 'infos' | 'checklist'
const sections = computed(() => [
  { id: 'flights' as const, label: '航班', count: booklet.value.flights.length, field: null },
  { id: 'days' as const, label: '每日行程', count: booklet.value.days.length, field: null },
  { id: 'hotels' as const, label: '飯店', count: booklet.value.hotels.length, field: null },
  { id: 'foods' as const, label: '美食特產', count: booklet.value.foods.length, field: 'foods' as const },
  { id: 'infos' as const, label: '旅遊資訊', count: booklet.value.infos.length, field: 'infos' as const },
  { id: 'checklist' as const, label: '自訂清單', count: booklet.value.checklist.length, field: 'checklist' as const },
])
const section = ref<SectionId>('days')
const currentSection = computed(() => sections.value.find((s) => s.id === section.value)!)
const sectionUnused = computed(() => !!currentSection.value.field && unused(currentSection.value.field))

const dayIndex = ref(0)
const day = computed(() => booklet.value.days[dayIndex.value])
const weekday = (iso: string) => (iso ? '日一二三四五六'[new Date(iso).getDay()] : '')

function addDay() {
  booklet.value.days.push(newDay(booklet.value.days.at(-1)))
  dayIndex.value = booklet.value.days.length - 1
}
const checklistOf = (c: ChecklistCategory) => booklet.value.checklist.filter((i) => i.category === c)
function removeChecklist(item: Booklet['checklist'][number]) {
  booklet.value.checklist.splice(booklet.value.checklist.indexOf(item), 1)
}

// ---------- 動態：滑動的重點色線（正式版同一套） ----------
const stepsBox = ref<HTMLElement>()
const sectionsBox = ref<HTMLElement>()
const daysBox = ref<HTMLElement>()
const stepBar = useSlider(stepsBox, () => [step.value])
const sectionBar = useSlider(sectionsBox, () => [step.value, section.value])
const dayBar = useSlider(daysBox, () => [step.value, section.value, dayIndex.value, booklet.value.days.length])

// 存檔狀態（原型只示意，不會真的下載）
const dirty = ref(false)
const justSaved = ref(false)
watch(booklet, () => (dirty.value = true), { deep: true })
function save() {
  dirty.value = false
  justSaved.value = true
  setTimeout(() => (justSaved.value = false), 1800)
}

// 每個網站範本裡，各區塊對應的位置（#id）；空字串代表這個風格不顯示
const ANCHORS: Record<string, Record<SectionId, string>> = {
  classic: { flights: 'flights', days: 'days', hotels: 'hotels', foods: 'foods', infos: 'info', checklist: 'checklist' },
  season: { flights: 'flights', days: 'day-N', hotels: 'stay', foods: 'info', infos: 'info', checklist: 'info' },
  wafu: { flights: 'travel', days: 'overview', hotels: 'travel', foods: '', infos: '', checklist: '' },
}
const anchor = computed(() => {
  if (step.value !== 'content') return ''
  const a = ANCHORS[manifest.value?.site ?? '']?.[section.value] ?? ''
  return a.replace('N', String(dayIndex.value + 1))
})

// ---------- 預覽 ----------
type View = 'phone' | 'a4'
const view = ref<View>('phone')
const previewHtml = ref('')
const frame = ref<HTMLIFrameElement>()
let keepScroll = 0
let jumpOnLoad = true
let timer: ReturnType<typeof setTimeout> | undefined

function refresh() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    const m = manifest.value
    if (!m?.site || !effective.value) return
    try {
      keepScroll = frame.value?.contentWindow?.scrollY ?? 0
    } catch {
      keepScroll = 0
    }
    previewHtml.value = build(m, effective.value, font.value, view.value === 'a4')
  }, 250)
}

/** 預覽跳到正在填的區塊；只改資料時留在原本捲到的位置 */
function jump(keep: boolean) {
  const win = frame.value?.contentWindow
  if (!win) return
  try {
    const a = anchor.value
    const doc = win.document
    const click = (sel: string) => doc.querySelector<HTMLElement>(sel)?.click()
    // 有分頁的風格（和風沉穩）點它自己的分頁和日期按鈕；其他風格捲到那一段
    const day = /^day-(\d+)$/.exec(a)
    if (day) {
      click('.tab[data-tab="trip"]')
      doc.querySelectorAll<HTMLElement>('.daybtn')[Number(day[1]) - 1]?.click()
    } else if (a && doc.querySelector(`.tab[data-tab="${a}"]`)) {
      click(`.tab[data-tab="${a}"]`)
    } else if (a && !keep) {
      doc.getElementById(a)?.scrollIntoView()
    }
    if (keep) win.scrollTo(0, keepScroll)
  } catch {
    // 忽略
  }
}
function onFrameLoad() {
  jump(!jumpOnLoad)
  jumpOnLoad = false
}
watch([booklet, palette, font], refresh, { deep: true })
watch([templateId, view], () => {
  jumpOnLoad = true
  refresh()
})
watch(anchor, () => jump(false))

// ---------- 風格縮圖：用目前的資料和各風格的預設配色 ----------
const thumbs = ref<Record<string, string>>({})
let thumbTimer: ReturnType<typeof setTimeout> | undefined
watch(
  [booklet, templates],
  () => {
    clearTimeout(thumbTimer)
    thumbTimer = setTimeout(() => {
      thumbs.value = Object.fromEntries(
        templates.value.filter((t) => t.site).map((t) => [t.id, build(t, t.presets[0].colors, '')]),
      )
    }, 800)
  },
  { deep: true, immediate: true },
)

onMounted(async () => {
  await loadTemplates()
  refresh()
})

// ---------- 工作台步驟 ----------
const steps: { id: Step; no: string; label: string }[] = [
  { id: 'content', no: '01', label: '內容' },
  { id: 'style', no: '02', label: '風格' },
  { id: 'look', no: '03', label: '外觀' },
]
const nextStep = computed(() => steps[steps.findIndex((s) => s.id === step.value) + 1])

function pickTemplate(id: string) {
  templateId.value = id
  palette.value = null // 換風格時配色換成新風格的預設
}
// 這個風格用不到的區塊（有資料的才提醒）
const hiddenByStyle = (t: TemplateManifest) =>
  sections.value.filter((s) => s.field && s.count && !t.formFields.includes(s.field)).map((s) => s.label)

function setRole(slots: string[], color: string) {
  const base = { ...(effective.value as PaletteColors) }
  for (const s of slots) (base as Record<string, string>)[s] = color
  palette.value = base
}
const isPreset = (colors: PaletteColors) => JSON.stringify(colors) === JSON.stringify(effective.value)

// 工作台的小記號跟著目前配色，對比不足時退回墨色
const accent = computed(() => readableOr(effective.value?.accent1 ?? '#5F6B57', '#FAF9F5', '#1E1D1A'))

// ---------- 輸出（原型只示意，不會真的產生） ----------
const outputOpen = ref(false)
const outputs = computed(() => [
  { id: 'docx', label: 'Word', note: '可以在 Word 裡再修改', ok: !!manifest.value?.file },
  { id: 'site', label: '網站', note: '手機用，單一檔案或可離線的 zip', ok: !!manifest.value?.site },
  { id: 'pdf', label: 'PDF', note: 'A4，可以直接列印', ok: !!manifest.value?.site },
])
const toast = ref('')
function output(label: string) {
  outputOpen.value = false
  toast.value = `原型不會真的產生檔案；正式版這裡會產生「${label}」。`
  setTimeout(() => (toast.value = ''), 3000)
}
</script>

<template>
  <div class="proto" :style="{ '--accent': accent }">
    <header class="bar">
      <h1>旅遊手冊工坊</h1>
      <span class="proto-tag">原型</span>
      <input v-model="booklet.title" class="trip" aria-label="手冊名稱" />
      <span class="spacer" />
      <span v-if="dirty" key="dirty" class="save-state" role="status"><i class="dot" />尚未存檔</span>
      <span v-else-if="justSaved" key="saved" class="save-state ok" role="status">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 8.5l3.2 3L13 4.5" />
          </svg>
          已存檔
        </span>
      <button type="button">讀取存檔</button>
      <button type="button" class="primary" @click="save">存檔</button>
      <div class="output">
        <button type="button" class="generate" :aria-expanded="outputOpen" @click="outputOpen = !outputOpen">
          輸出手冊 ▾
        </button>
        <div v-if="outputOpen" class="output-menu" role="menu">
          <button
            v-for="o in outputs"
            :key="o.id"
            type="button"
            role="menuitem"
            :disabled="!o.ok"
            @click="output(o.label)"
          >
            <strong>{{ o.label }}</strong>
            <span>{{ o.ok ? o.note : `「${manifest?.name}」沒有 ${o.label} 版` }}</span>
          </button>
        </div>
      </div>
    </header>

    <div class="split">
      <!-- 工作台 -->
      <section class="bench" aria-label="工作台">
        <nav ref="stepsBox" class="steps" role="tablist">
          <span class="slider" :style="stepBar" aria-hidden="true" />
          <button
            v-for="s in steps"
            :key="s.id"
            type="button"
            role="tab"
            :aria-selected="step === s.id"
            :class="{ active: step === s.id }"
            @click="step = s.id"
          >
            <span class="no">{{ s.no }}</span>{{ s.label }}
          </button>
          <span class="spacer" />
          <button v-if="nextStep" type="button" class="add next" @click="step = nextStep.id">
            下一步：{{ nextStep.label }} →
          </button>
        </nav>

        <!-- 01 內容 -->
        <div v-if="step === 'content'" class="content">
          <nav ref="sectionsBox" class="sections" aria-label="內容區塊">
            <span class="slider" :style="sectionBar" aria-hidden="true" />
            <button
              v-for="s in sections"
              :key="s.id"
              type="button"
              :class="{ active: section === s.id, dim: s.field && unused(s.field) }"
              @click="section = s.id"
            >
              <span>{{ s.label }}</span>
            </button>
            <p v-if="sections.some((s) => s.field && unused(s.field))" class="hint sections-note">淡色的區塊：目前的風格「{{ manifest?.name }}」不會顯示，但資料會保留。</p>
          </nav>

          <div class="pane">
            <div class="pane-head">
              <h2>{{ currentSection.label }}</h2>
              <span v-if="sectionUnused" class="unused-tag">「{{ manifest?.name }}」不顯示這個區塊</span>
            </div>

            <!-- 航班 -->
            <template v-if="section === 'flights'">
              <TransitionGroup tag="ol" class="rows" name="row">
                <li v-for="(f, i) in booklet.flights" :key="keyOf(f)" class="row pass">
                  <span class="seq">{{ i + 1 }}</span>
                  <div class="grid4">
                    <p class="route">
                      <span>{{ f.from || '出發地' }}</span>
                      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M2 8h12M10.5 4.5 14 8l-3.5 3.5M5 8 3.5 5M5 8l-1.5 3" />
                      </svg>
                      <span>{{ f.to || '目的地' }}</span>
                      <b class="flight-no">{{ f.flightNo }}</b>
                    </p>
                    <label class="field"><span>日期</span><input v-model="f.date" type="date" /></label>
                    <label class="field">
                      <span>航空公司<em v-if="unused('airline')">不顯示</em></span>
                      <input v-model="f.airline" />
                    </label>
                    <label class="field">
                      <span>班機<em v-if="unused('flightNo')">不顯示</em></span>
                      <input v-model="f.flightNo" />
                    </label>
                    <span />
                    <label class="field"><span>出發地</span><input v-model="f.from" /></label>
                    <label class="field"><span>起飛</span><input v-model="f.departTime" type="time" /></label>
                    <label class="field"><span>目的地</span><input v-model="f.to" /></label>
                    <label class="field"><span>抵達</span><input v-model="f.arriveTime" type="time" /></label>
                  </div>
                  <button type="button" class="icon danger" @click="booklet.flights.splice(i, 1)">刪除</button>
                </li>
              </TransitionGroup>
              <EmptyArt v-if="!booklet.flights.length" kind="flight">
                還沒有航班。訂好機票後，把班機和時間填進來。
              </EmptyArt>
              <button type="button" class="add" @click="booklet.flights.push(newFlight())">＋ 新增航班</button>
            </template>

            <!-- 每日行程 -->
            <template v-else-if="section === 'days'">
              <div ref="daysBox" class="days">
                <span class="slider" :style="dayBar" aria-hidden="true" />
                <button
                  v-for="(_, i) in booklet.days"
                  :key="i"
                  type="button"
                  :class="{ active: i === dayIndex }"
                  @click="dayIndex = i"
                >
                  {{ String(i + 1).padStart(2, '0') }}
                </button>
                <button type="button" class="add" @click="addDay">＋ 新增一天</button>
              </div>
              <template v-if="day">
                <div class="day-head">
                  <span :key="dayIndex" class="day-no flip"><small>DAY</small>{{ dayIndex + 1 }}</span>
                  <span :key="day.date" class="day-date flip">{{ day.date.slice(5).replace('-', '/') }}<small>（{{ weekday(day.date) }}）</small></span>
                  <label class="field day-field"><span>日期</span><input v-model="day.date" type="date" /></label>
                </div>
                <label class="field">
                  <span>這一天的總覽</span>
                  <input v-model="day.overview" class="overview" placeholder="空白時自動用景點串起來" />
                </label>
                <label v-if="!unused('dayTheme')" class="field">
                  <span>主題</span>
                  <input v-model="day.theme" />
                </label>
                <TransitionGroup :key="dayIndex" tag="ol" class="rows" name="row">
                  <li v-for="(s, i) in day.spots" :key="keyOf(s)" class="row">
                    <span class="seq">{{ i + 1 }}</span>
                    <div>
                      <input v-model="s.name" class="name" aria-label="景點名稱" placeholder="景點名稱" />
                      <textarea v-model="s.content" rows="2" aria-label="景點介紹" placeholder="景點介紹" />
                    </div>
                    <button type="button" class="icon danger" @click="day.spots.splice(i, 1)">刪除</button>
                  </li>
                </TransitionGroup>
                <EmptyArt v-if="!day.spots.length" kind="spot">
                  這一天還沒有景點。先寫下最想去的一個地方。
                </EmptyArt>
                <button type="button" class="add" @click="day.spots.push(newSpot())">＋ 新增景點</button>
              </template>
            </template>

            <!-- 飯店 -->
            <template v-else-if="section === 'hotels'">
              <TransitionGroup tag="ol" class="rows" name="row">
                <li v-for="(h, i) in booklet.hotels" :key="keyOf(h)" class="row tag">
                  <span class="seq">{{ i + 1 }}</span>
                  <div class="grid2">
                    <input v-model="h.name" class="name span2" aria-label="飯店名稱" placeholder="飯店名稱" />
                    <label class="field span2"><span>地址</span><input v-model="h.address" /></label>
                    <label class="field">
                      <span>電話<em v-if="unused('hotelPhone')">不顯示</em></span>
                      <input v-model="h.phone" />
                    </label>
                    <label class="field">
                      <span>城市<em v-if="unused('hotelCity')">不顯示</em></span>
                      <input v-model="h.city" />
                    </label>
                    <label class="field">
                      <span>入住<em v-if="unused('hotelStay')">不顯示</em></span>
                      <input v-model="h.checkIn" type="date" />
                    </label>
                    <label class="field">
                      <span>退房<em v-if="unused('hotelStay')">不顯示</em></span>
                      <input v-model="h.checkOut" type="date" />
                    </label>
                  </div>
                  <button type="button" class="icon danger" @click="booklet.hotels.splice(i, 1)">刪除</button>
                </li>
              </TransitionGroup>
              <EmptyArt v-if="!booklet.hotels.length" kind="hotel">
                還沒有飯店。訂好房間後填進來，手冊裡會附上地址和電話。
              </EmptyArt>
              <button type="button" class="add" @click="booklet.hotels.push(newHotel())">＋ 新增飯店</button>
              <label class="field">
                <span>住宿備註<em v-if="unused('hotelNote')">不顯示</em></span>
                <textarea v-model="booklet.hotelNote" rows="2" />
              </label>
            </template>

            <!-- 美食特產 -->
            <template v-else-if="section === 'foods'">
              <TransitionGroup tag="ol" class="rows" name="row">
                <li v-for="(p, i) in booklet.foods" :key="keyOf(p)" class="row">
                  <span class="seq">{{ i + 1 }}</span>
                  <div>
                    <input v-model="p.place" class="name" aria-label="地點" placeholder="地點，例如：大阪" />
                    <TransitionGroup tag="ol" class="subs" name="row">
                      <li v-for="(it, j) in p.items" :key="keyOf(it)">
                        <span class="sub-seq">{{ j + 1 }}</span>
                        <input v-model="it.name" aria-label="名稱" placeholder="名稱" />
                        <input v-model="it.description" aria-label="說明" placeholder="說明" />
                        <button type="button" class="icon danger" @click="p.items.splice(j, 1)">刪除</button>
                      </li>
                    </TransitionGroup>
                    <button type="button" class="add" @click="p.items.push(newFoodItem())">＋ 新增一項</button>
                  </div>
                  <button type="button" class="icon danger" @click="booklet.foods.splice(i, 1)">刪除</button>
                </li>
              </TransitionGroup>
              <EmptyArt v-if="!booklet.foods.length" kind="food">
                還沒有美食。按地點分，記下想吃的和想帶回家的。
              </EmptyArt>
              <button type="button" class="add" @click="booklet.foods.push(newFoodPlace())">＋ 新增地點</button>
            </template>

            <!-- 旅遊資訊 -->
            <template v-else-if="section === 'infos'">
              <TransitionGroup tag="ol" class="rows" name="row">
                <li v-for="(it, i) in booklet.infos" :key="keyOf(it)" class="row">
                  <span class="seq">{{ i + 1 }}</span>
                  <div>
                    <input v-model="it.title" class="name" aria-label="標題" placeholder="標題，例如：交通" />
                    <textarea v-model="it.content" rows="2" aria-label="內容" placeholder="內容" />
                  </div>
                  <button type="button" class="icon danger" @click="booklet.infos.splice(i, 1)">刪除</button>
                </li>
              </TransitionGroup>
              <EmptyArt v-if="!booklet.infos.length" kind="info">
                還沒有旅遊資訊。交通、換錢、網路這類小事都可以寫在這裡。
              </EmptyArt>
              <button type="button" class="add" @click="booklet.infos.push(newInfo())">＋ 新增資訊</button>
            </template>

            <!-- 自訂清單 -->
            <template v-else-if="section === 'checklist'">
              <div class="checklist">
                <div v-for="c in CHECKLIST_CATEGORIES" :key="c.key" class="group">
                  <h3>{{ c.label }}<span class="count">{{ checklistOf(c.key).length }}</span></h3>
                  <TransitionGroup tag="ul" name="row">
                    <li v-for="it in checklistOf(c.key)" :key="keyOf(it)">
                      <input v-model="it.item" aria-label="項目" />
                      <button type="button" class="icon danger" @click="removeChecklist(it)">刪除</button>
                    </li>
                  </TransitionGroup>
                  <button type="button" class="add" @click="booklet.checklist.push({ category: c.key, item: '' })">＋ 新增</button>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 02 風格 -->
        <div v-else-if="step === 'style'" class="pane">
          <p class="hint">縮圖用你的資料畫出來；換風格時資料全部保留。</p>
          <div class="styles">
            <button
              v-for="t in templates"
              :key="t.id"
              type="button"
              class="style-card"
              :class="{ selected: t.id === templateId }"
              :aria-pressed="t.id === templateId"
              @click="pickTemplate(t.id)"
            >
              <span class="thumb">
                <iframe v-if="thumbs[t.id]" :srcdoc="thumbs[t.id]" tabindex="-1" aria-hidden="true" scrolling="no" />
              </span>
              <strong>{{ t.name }}</strong>
              <span class="badges">
                <span :class="{ off: !t.file }">Word</span>
                <span :class="{ off: !t.site }">網站</span>
                <span :class="{ off: !t.site }">PDF</span>
              </span>
              <span v-if="hiddenByStyle(t).length" class="hint warn">不會顯示：{{ hiddenByStyle(t).join('、') }}</span>
            </button>
          </div>
        </div>

        <!-- 03 外觀 -->
        <div v-else-if="step === 'look' && manifest" class="pane">
          <h3 class="sub">配色</h3>
          <div class="presets">
            <button
              v-for="p in manifest.presets"
              :key="p.name"
              type="button"
              class="preset"
              :class="{ selected: isPreset(p.colors) }"
              @click="palette = { ...p.colors }"
            >
              <span class="swatches">
                <span v-for="(c, k) in p.colors" :key="k" :style="{ background: c }" />
              </span>
              {{ p.name }}
            </button>
          </div>
          <div class="roles">
            <label v-for="r in manifest.colorRoles" :key="r.label" class="role">
              <input
                type="color"
                :value="effective?.[r.slots[0]]"
                @input="setRole(r.slots, ($event.target as HTMLInputElement).value)"
              />
              <span>{{ r.label }}</span>
            </label>
          </div>

          <h3 class="sub">字型</h3>
          <p class="hint">這些字型 Word 和網站都能用，朋友的電腦沒裝也會顯示一樣的字。</p>
          <div class="fonts">
            <label v-for="f in FONTS" :key="f.label" class="font" :class="{ selected: font === f.family }">
              <input v-model="font" type="radio" name="font" :value="f.family" />
              <link v-if="f.family" rel="stylesheet" :href="fontUrl(f.family)" />
              <span class="font-sample" :style="f.family ? { fontFamily: `'${f.family}'` } : {}">伏見稻荷大社</span>
              <span class="font-name">{{ f.label }}<small>{{ f.note }}</small></span>
            </label>
          </div>
          <p class="hint">Word 另外可以輸入電腦上任何字體的名稱（朋友打開時可能沒有這個字體）。</p>
        </div>
      </section>

      <!-- 深色桌面上的紙張 -->
      <section class="desk" aria-label="成品預覽">
        <div class="desk-bar">
          <span class="desk-title">成品預覽<small>{{ manifest?.name }}</small></span>
          <span class="spacer" />
          <div class="seg" role="group" aria-label="預覽尺寸">
            <button type="button" :class="{ active: view === 'phone' }" @click="view = 'phone'">手機</button>
            <button type="button" :class="{ active: view === 'a4' }" @click="view = 'a4'">A4</button>
          </div>
        </div>
        <p v-if="step === 'content' && sectionUnused" class="desk-warn">
          「{{ manifest?.name }}」不會顯示{{ currentSection.label }}
        </p>
        <div class="desk-surface">
          <div class="sheet" :class="view">
            <iframe ref="frame" :srcdoc="previewHtml" title="成品預覽" @load="onFrameLoad" />
          </div>
        </div>
        <p class="desk-note">輸出後就是這個樣子，可以直接捲動、點選</p>
      </section>
    </div>

    <p v-if="toast" class="toast" role="status">{{ toast }}</p>
  </div>
</template>

<style scoped>
.proto {
  --bar-h: 64px;
  --desk: #2b2a27;
  --desk-2: #3a3833;
  --desk-ink: #cfcabd;
  --phone-scale: 0.82;
  --a4-scale: 0.45;
  min-width: 1100px;
}

/* ---------- 頂列 ---------- */
.bar {
  position: sticky;
  top: 0;
  z-index: 5;
  height: var(--bar-h);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  background: var(--paper);
  border-bottom: 2px solid var(--ink);
}
.bar h1 {
  font-size: 20px;
}
.proto-tag {
  font-family: var(--font-label);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.12em;
  padding: 1px 6px;
  border: 1.5px dashed var(--ink-soft);
  color: var(--ink-soft);
}
.trip {
  width: 260px;
  margin-left: 16px;
  font-family: var(--font-heading);
  font-weight: 900;
  font-size: 17px;
}
.output {
  position: relative;
}
.output-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  width: 280px;
  background: var(--paper);
  border: 2px solid var(--ink);
  box-shadow: 0 18px 44px rgb(30 29 26 / 28%);
  display: grid;
}
.output-menu button {
  border: 0;
  border-bottom: 1px solid var(--hair);
  text-align: left;
  display: grid;
  gap: 2px;
  padding: 10px 14px;
}
.output-menu button span {
  font-weight: 400;
  font-size: 13px;
  color: var(--ink-soft);
}
.output-menu button:hover:not(:disabled) span {
  color: var(--paper);
}

/* ---------- 兩欄：工作台（主角）＋窄的深色桌面 ---------- */
.split {
  display: grid;
  grid-template-columns: 1fr 400px;
  min-height: calc(100vh - var(--bar-h));
}

.bench {
  padding: 20px 32px 64px;
  min-width: 0;
}
.steps {
  display: flex;
  align-items: center;
  gap: 24px;
  border-bottom: 2px solid var(--ink);
  margin-bottom: 24px;
}
.steps button[role='tab'] {
  border: 0;
  padding: 8px 0 10px;
  font-size: 16px;
  color: var(--ink-soft);
}
.steps button[role='tab']:hover:not(:disabled) {
  background: none;
  color: var(--ink);
}
.steps button.active {
  color: var(--ink);
  box-shadow: inset 0 -4px 0 var(--accent);
}
.steps .no {
  font-family: var(--font-numeral);
  font-weight: 400;
  margin-right: 6px;
  color: var(--accent);
}
.next {
  font-size: 14px;
}
.pane {
  display: grid;
  gap: 16px;
  align-content: start;
  min-width: 0;
}
.sub {
  font-size: 18px;
  margin-top: 10px;
}

/* 內容：左邊區塊清單＋右邊表單 */
.content {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 36px;
}
.sections {
  display: grid;
  align-content: start;
  border-top: 2px solid var(--ink);
  position: sticky;
  top: calc(var(--bar-h) + 20px);
}
.sections button {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border: 0;
  border-bottom: 1px solid var(--hair);
  padding: 10px 2px 10px 12px;
  text-align: left;
  color: var(--ink);
  box-shadow: none;
}
.sections button:hover:not(:disabled) {
  background: var(--paper-2);
  color: var(--ink);
}
.sections button.active {
  box-shadow: inset 4px 0 0 var(--accent);
}
.sections button.dim span:first-child {
  color: var(--placeholder);
  font-weight: 400;
}
.count {
  font-family: var(--font-label);
  font-weight: 600;
  font-size: 16px;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
  margin-left: 6px;
}
.sections-note {
  margin-top: 10px;
  font-size: 12px;
}
.pane-head {
  display: flex;
  align-items: baseline;
  gap: 14px;
}
.pane-head h2 {
  font-size: 28px;
}
.unused-tag {
  font-size: 13px;
  font-weight: 700;
  color: var(--warn);
  background: var(--warn-bg);
  padding: 2px 8px;
}
.field em {
  font-style: normal;
  font-weight: 400;
  letter-spacing: 0;
  color: var(--warn);
  margin-left: 6px;
}

/* 列 */
.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 2px solid var(--ink);
}
.row {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid var(--hair);
  align-items: start;
}
.row .seq {
  font-family: var(--font-numeral);
  font-size: 34px;
  line-height: 1;
  color: var(--accent);
}
.name {
  width: 100%;
  font-family: var(--font-heading);
  font-weight: 900;
  font-size: 20px;
}
.row textarea {
  width: 100%;
  margin-top: 6px;
}
.grid4 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px 18px;
}
.grid2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 18px;
}
.span2 {
  grid-column: span 2;
}
.subs {
  list-style: none;
  margin: 10px 0 4px;
  padding: 0;
}
.subs li {
  display: grid;
  grid-template-columns: 28px 1fr 2fr auto;
  gap: 12px;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--hair);
}
.sub-seq {
  font-family: var(--font-label);
  font-weight: 600;
  color: var(--ink-soft);
}

/* 每日行程 */
.days {
  display: flex;
  align-items: center;
  gap: 16px;
}
.days button:not(.add) {
  border: 0;
  padding: 0 0 2px;
  font-family: var(--font-numeral);
  font-weight: 400;
  font-size: 26px;
  color: var(--ink-soft);
}
.days button:not(.add):hover:not(:disabled) {
  background: none;
  color: var(--ink);
}
.days button.active {
  color: var(--ink);
  box-shadow: inset 0 -4px 0 var(--accent);
}
.day-head {
  display: flex;
  align-items: flex-end;
  gap: 18px;
  border-top: 2px solid var(--ink);
  padding-top: 8px;
}
.day-no {
  font-family: var(--font-numeral);
  font-size: 140px;
  line-height: 0.84;
  display: flex;
  align-items: flex-start;
}
.day-no small {
  font-family: var(--font-label);
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.4em;
  writing-mode: vertical-rl;
  margin-right: 4px;
}
.day-date {
  font-family: var(--font-numeral);
  font-size: 44px;
  line-height: 1;
}
.day-date small {
  font-family: var(--font-sans);
  font-size: 16px;
}
.day-field {
  margin-left: auto;
}
.overview {
  font-family: var(--font-heading);
  font-weight: 900;
  font-size: 26px;
  border-bottom-width: 2px;
}

/* 自訂清單 */
.checklist {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 32px 40px;
}
.group {
  border-top: 2px solid var(--ink);
  padding-top: 8px;
}
.group h3 {
  font-size: 18px;
  margin-bottom: 4px;
}
.group ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.group li {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid var(--hair);
}
.group li input {
  flex: 1;
}

/* 風格 */
.styles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 20px;
}
.style-card {
  display: grid;
  gap: 8px;
  padding: 10px;
  text-align: left;
  border: 1.5px solid var(--hair);
  background: var(--paper);
  color: var(--ink);
  align-content: start;
}
.style-card:hover:not(:disabled) {
  background: var(--paper);
  color: var(--ink);
  border-color: var(--ink-soft);
}
.style-card.selected {
  border-color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--ink);
}
/* 縮圖也是「紙張」：放在同樣的深色桌面上 */
.thumb {
  display: block;
  height: 300px;
  overflow: hidden;
  background: var(--desk);
  position: relative;
}
.thumb iframe {
  position: absolute;
  left: 50%;
  top: 14px;
  width: 390px;
  height: 900px;
  border: 0;
  transform: translateX(-50%) scale(0.5);
  transform-origin: top center;
  pointer-events: none;
  background: #fff;
}
.badges {
  display: flex;
  gap: 6px;
  font-size: 12px;
}
.badges span {
  border: 1px solid var(--ink-soft);
  padding: 0 6px;
}
.badges .off {
  border-style: dashed;
  color: var(--placeholder);
  text-decoration: line-through;
}
.style-card .hint.warn {
  font-size: 12px;
  font-weight: 400;
}

/* 外觀 */
.presets {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}
.preset {
  display: grid;
  gap: 6px;
  text-align: left;
  border: 1.5px solid var(--hair);
  background: var(--paper);
  color: var(--ink);
  padding: 10px 12px;
}
.preset:hover:not(:disabled) {
  background: var(--paper);
  color: var(--ink);
  border-color: var(--ink-soft);
}
.preset.selected {
  border-color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--ink);
}
.swatches {
  display: flex;
}
.swatches span {
  width: 22px;
  height: 22px;
}
.roles {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.role {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}
.role input {
  width: 36px;
  height: 28px;
  padding: 0;
  border: 1.5px solid var(--ink);
  background: none;
}
.fonts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}
.font {
  position: relative;
  display: grid;
  gap: 2px;
  padding: 10px 12px;
  border: 1.5px solid var(--hair);
  cursor: pointer;
}
.font:hover {
  border-color: var(--ink-soft);
}
.font.selected {
  border-color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--ink);
}
.font input {
  position: absolute;
  opacity: 0;
}
.font-sample {
  font-size: 22px;
}
.font-name {
  font-size: 13px;
  font-weight: 700;
}
.font-name small {
  font-weight: 400;
  color: var(--ink-soft);
  margin-left: 6px;
}

/* ---------- 深色桌面：成品一眼就和工具分開 ---------- */
.desk {
  position: sticky;
  top: var(--bar-h);
  height: calc(100vh - var(--bar-h));
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  background: var(--desk);
  color: var(--desk-ink);
}
.desk-bar {
  display: flex;
  align-items: center;
  padding: 14px 20px 10px;
}
.desk-title {
  font-family: var(--font-heading);
  font-weight: 900;
  font-size: 15px;
  color: #f4f1ea;
}
.desk-title small {
  font-family: var(--font-sans);
  font-weight: 400;
  margin-left: 10px;
  color: var(--desk-ink);
}
.seg {
  display: flex;
}
.seg button {
  padding: 3px 12px;
  font-size: 13px;
  border-color: var(--desk-ink);
  color: var(--desk-ink);
}
.seg button:hover:not(:disabled) {
  background: var(--desk-2);
  color: #fff;
}
.seg button + button {
  border-left: 0;
}
.seg button.active {
  background: #f4f1ea;
  border-color: #f4f1ea;
  color: var(--ink);
}
.desk-warn {
  margin: 0 20px 8px;
  padding: 6px 10px;
  font-size: 13px;
  background: var(--desk-2);
  color: #f1d58a;
}
.desk-surface {
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 6px 20px 16px;
}
.sheet {
  background: #fff;
  flex: none;
  overflow: hidden;
  box-shadow: 0 20px 50px rgb(0 0 0 / 45%);
}
.sheet iframe {
  display: block;
  border: 0;
  transform-origin: top left;
}
/* 手機：390 寬縮小顯示 */
.sheet.phone {
  width: calc(390px * var(--phone-scale) + 16px);
  height: calc(760px * var(--phone-scale) + 16px);
  border: 8px solid #111;
  border-radius: 30px;
}
.sheet.phone iframe {
  width: 390px;
  height: 760px;
  transform: scale(var(--phone-scale));
}
/* A4：794×1123 縮小顯示 */
.sheet.a4 {
  width: calc(794px * var(--a4-scale));
  height: calc(1123px * var(--a4-scale));
}
.sheet.a4 iframe {
  width: 794px;
  height: 1123px;
  transform: scale(var(--a4-scale));
}
.desk-note {
  margin: 0;
  padding: 0 20px 14px;
  font-size: 12px;
  text-align: center;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  margin: 0;
  padding: 10px 16px;
  background: var(--ink);
  color: var(--paper);
  font-size: 14px;
}

/* ---------- 存檔狀態（各方案共用） ---------- */
.save-state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ink-soft);
}
.save-state .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--warn);
}
.save-state.ok {
  color: var(--ok);
  font-weight: 700;
}

/* ---------- 動態（.slider、.flip、列的進出在 styles.css） ---------- */
.steps,
.days,
.subs {
  position: relative;
}
/* 區塊清單的線在左邊、直的 */
.sections .slider {
  top: var(--y);
  width: 4px;
  height: var(--h);
  transition-property: top, height, background-color;
}
.steps button.active,
.days button.active,
.sections button.active {
  box-shadow: none;
}

/* 存檔：小圓點換成打勾，勾一筆畫出來 */
.save-state {
  animation: pop 0.3s cubic-bezier(0.3, 1.6, 0.5, 1);
}
@keyframes pop {
  from {
    transform: scale(0.6);
    opacity: 0;
  }
}
.save-state.ok path {
  stroke-dasharray: 16;
  stroke-dashoffset: 16;
  animation: draw 0.35s 0.1s ease-out forwards;
}
@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}

/* ---------- 旅行票券 ---------- */
/* 航班：登機證，右邊撕線＋上下缺口 */
.row.pass {
  padding-right: 0;
}
.pass > .icon {
  position: relative;
  align-self: stretch;
  margin: -18px 0;
  padding: 18px 10px 18px 18px;
  border-left: 1.5px dashed var(--field-line);
}
.pass > .icon::before,
.pass > .icon::after {
  content: '';
  position: absolute;
  left: -7.5px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1.5px solid var(--field-line);
  background: var(--paper);
}
.pass > .icon::before {
  top: -6px;
  clip-path: inset(50% 0 0 0);
}
.pass > .icon::after {
  bottom: -6px;
  clip-path: inset(0 0 50% 0);
}
.route {
  grid-column: 1 / -1;
  margin: 0 0 2px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-heading);
  font-weight: 900;
  font-size: 20px;
}
.route svg {
  color: var(--accent);
}
.flight-no {
  margin-left: auto;
  font-family: var(--font-label);
  font-weight: 700;
  font-size: 20px;
  letter-spacing: 0.08em;
  color: var(--ink-soft);
}
/* 飯店：行李吊牌，編號上方打一個孔 */
.row.tag .seq {
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 8px;
  padding-right: 14px;
  border-right: 1.5px dashed var(--hair);
  align-self: stretch;
}
.row.tag .seq::before {
  content: '';
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1.5px solid var(--ink-soft);
}
</style>
