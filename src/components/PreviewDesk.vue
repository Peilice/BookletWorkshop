<script setup lang="ts">
// 深色桌面上的成品：用真正的網站範本畫出目前的手冊，跟著正在填的區塊跳過去
import { computed, ref, watch } from 'vue'
import { effectivePalette } from '../site/fromSettings'
import type { FormField, TemplateManifest } from '../model/booklet'
import { isBlankBooklet, previewBooklet, renderPreview } from '../site/preview'
import { useBookletStore } from '../store/booklet'
import { useFocus, type SectionId } from '../store/focus'
import { useTemplates } from '../store/templates'

const { booklet, settings } = useBookletStore()
const { templates } = useTemplates()
const { step, section, dayIndex } = useFocus()

const manifest = computed<TemplateManifest | undefined>(
  () => templates.value.find((t) => t.id === settings.value.templateId) ?? templates.value[0],
)
const blank = computed(() => isBlankBooklet(booklet.value))

// 只有部分風格會顯示的區塊
const SECTION_FIELD: Partial<Record<SectionId, FormField>> = { foods: 'foods', infos: 'infos', checklist: 'checklist' }
const SECTION_LABEL: Record<SectionId, string> = {
  flights: '交通',
  days: '每日行程',
  foods: '美食特產',
  hotels: '住宿',
  infos: '旅遊資訊',
  checklist: '行前清單',
}
const sectionHidden = computed(() => {
  const f = SECTION_FIELD[section.value]
  return step.value === 'content' && !!f && !!manifest.value && !manifest.value.formFields.includes(f)
})

// 每個網站範本裡，各區塊對應的位置（#id）；day-N 是第 N 天，空字串代表這個風格不顯示
const ANCHORS: Record<string, Record<SectionId, string>> = {
  classic: { flights: 'flights', days: 'day-N', hotels: 'hotels', foods: 'foods', infos: 'info', checklist: 'checklist' },
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
const html = ref('')
const frame = ref<HTMLIFrameElement>()
let keepScroll = 0
let jumpOnLoad = true
let timer: ReturnType<typeof setTimeout> | undefined

function refresh() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    const m = manifest.value
    if (!m?.site) {
      html.value = ''
      return
    }
    try {
      keepScroll = frame.value?.contentWindow?.scrollY ?? 0
    } catch {
      keepScroll = 0
    }
    html.value = renderPreview(previewBooklet(booklet.value), m, effectivePalette(m, settings.value), view.value === 'a4')
  }, 250)
}

/** 跳到正在填的區塊；只改資料時留在原本捲到的位置 */
function jump(keep: boolean) {
  const win = frame.value?.contentWindow
  if (!win) return
  try {
    const doc = win.document
    const a = anchor.value
    const click = (sel: string) => doc.querySelector<HTMLElement>(sel)?.click()
    const day = /^day-(\d+)$/.exec(a)
    // 有分頁的風格（和風沉穩）點它自己的分頁和日期按鈕；其他風格捲到那一段
    if (day && doc.querySelector('.daybtn')) {
      click('.tab[data-tab="trip"]')
      const btn = doc.querySelectorAll<HTMLElement>('.daybtn')[Number(day[1]) - 1]
      if (btn) btn.click()
      else jumpOnLoad = true
    } else if (a && doc.querySelector(`.tab[data-tab="${a}"]`)) {
      click(`.tab[data-tab="${a}"]`)
    } else if (a && !keep) {
      const target = doc.getElementById(a)
      // 剛新增的那一天還沒畫出來：等預覽重新載入後再跳
      // 範本是平滑捲動，剛載入時字型一換版面就會被打斷，所以直接跳過去
      if (target) target.scrollIntoView({ behavior: 'instant' })
      else jumpOnLoad = true
    }
    if (keep) win.scrollTo({ top: keepScroll, behavior: 'instant' })
  } catch {
    // 預覽還沒準備好時忽略
  }
}

function onLoad() {
  jump(!jumpOnLoad)
  jumpOnLoad = false
}

watch([booklet, settings], refresh, { deep: true })
watch([() => manifest.value?.id, view], () => {
  jumpOnLoad = true
  refresh()
}, { immediate: true })
watch(anchor, () => jump(false))
</script>

<template>
  <section class="desk" aria-label="成品預覽">
    <div class="desk-bar">
      <span class="desk-title">成品預覽<small>{{ manifest?.name }}</small></span>
      <span class="spacer" />
      <div v-if="manifest?.site" class="seg" role="group" aria-label="預覽尺寸">
        <button type="button" :class="{ active: view === 'phone' }" :aria-pressed="view === 'phone'" @click="view = 'phone'">手機</button>
        <button type="button" :class="{ active: view === 'a4' }" :aria-pressed="view === 'a4'" @click="view = 'a4'">A4</button>
      </div>
    </div>
    <p v-if="blank" class="desk-warn">還沒有填內容，先用範例行程示意</p>
    <p v-else-if="sectionHidden" class="desk-warn">「{{ manifest?.name }}」不會顯示{{ SECTION_LABEL[section] }}</p>
    <div class="desk-surface">
      <div v-if="manifest?.site" class="sheet" :class="view">
        <iframe ref="frame" :srcdoc="html" title="成品預覽" @load="onLoad" />
      </div>
      <p v-else-if="manifest" class="desk-empty">「{{ manifest.name }}」沒有可以在這裡預覽的網站版。</p>
    </div>
    <p class="desk-note">{{ view === 'phone' ? '網站輸出後就是這個樣子，可以直接捲動、點選' : '產生 PDF 時的 A4 版面，可以捲動看後面幾頁' }}</p>
  </section>
</template>

<style scoped>
.desk {
  --desk: #2b2a27;
  --desk-2: #3a3833;
  --desk-ink: #cfcabd;
  --phone-scale: 0.82;
  --a4-scale: 0.45;
  position: sticky;
  top: var(--bar-h);
  height: calc(100vh - var(--bar-h));
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  /* 切割墊：20px 細格，每 5 格一條粗線 */
  background-color: var(--desk);
  background-image:
    linear-gradient(rgb(207 202 189 / 14%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(207 202 189 / 14%) 1px, transparent 1px),
    linear-gradient(rgb(207 202 189 / 6%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(207 202 189 / 6%) 1px, transparent 1px);
  background-size:
    100px 100px,
    100px 100px,
    20px 20px,
    20px 20px;
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

.seg button:focus-visible {
  outline-color: #f4f1ea;
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
  flex: none;
  overflow: hidden;
  background: #fff;
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

.desk-empty {
  margin: 40px 0 0;
  font-size: 14px;
  text-align: center;
}

.desk-note {
  margin: 0;
  padding: 0 20px 14px;
  font-size: 12px;
  text-align: center;
}
</style>
