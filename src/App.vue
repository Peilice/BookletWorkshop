<script setup lang="ts">
// 左邊是工作台（內容 → 風格 → 外觀），右邊是深色桌面上的成品預覽；頂列一顆「輸出手冊」選格式
import { computed, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import ChecklistPanel from './components/ChecklistPanel.vue'
import DaysPanel from './components/DaysPanel.vue'
import FlightsPanel from './components/FlightsPanel.vue'
import FoodsPanel from './components/FoodsPanel.vue'
import HotelsPanel from './components/HotelsPanel.vue'
import InfosPanel from './components/InfosPanel.vue'
import PreviewDesk from './components/PreviewDesk.vue'
import StylePanel from './components/StylePanel.vue'
import StylePicker from './components/StylePicker.vue'
import { effectivePalette, printPdfFromSettings, siteHtmlFromSettings, siteZipFromSettings } from './site/fromSettings'
import { lowContrastSpots, readableOr } from './model/contrast'
import { bookletFileName } from './model/fileName'
import { SaveFileError } from './model/saveFile'
import type { FormField, TemplateManifest } from './model/booklet'
import { FALLBACK_RULES } from './model/defaults'
import { validateBooklet, type Issue, type TabId } from './model/validate'
import { useBookletStore } from './store/booklet'
import { useFocus, type SectionId, type Step } from './store/focus'
import { useFormFields, useTemplates } from './store/templates'
import { downloadFile } from './utils/download'
import { useSlider } from './utils/motion'

const store = useBookletStore()
const { booklet, settings, hasUnsavedChanges, pendingRestore } = store
const { templates, loadTemplates } = useTemplates()
const { step, section } = useFocus()
onMounted(loadTemplates)

const currentTemplate = computed(
  () => templates.value.find((t) => t.id === settings.value.templateId) ?? templates.value[0],
)

// ---------- 工作台步驟 ----------

const steps: { id: Step; no: string; label: string }[] = [
  { id: 'content', no: '01', label: '內容' },
  { id: 'style', no: '02', label: '風格' },
  { id: 'look', no: '03', label: '外觀' },
]
const nextStep = computed(() => steps[steps.findIndex((s) => s.id === step.value) + 1])

// ---------- 內容區塊：不論哪個風格都可以填，目前風格不顯示的區塊變淡 ----------

const sections: { id: SectionId; label: string; component: Component; count: () => number; field?: FormField }[] = [
  { id: 'flights', label: '航班', component: FlightsPanel, count: () => booklet.value.flights.length },
  { id: 'days', label: '每日行程', component: DaysPanel, count: () => booklet.value.days.length },
  { id: 'foods', label: '美食特產', component: FoodsPanel, count: () => booklet.value.foods.length, field: 'foods' },
  { id: 'hotels', label: '飯店', component: HotelsPanel, count: () => booklet.value.hotels.length },
  { id: 'infos', label: '旅遊資訊', component: InfosPanel, count: () => booklet.value.infos.length, field: 'infos' },
  { id: 'checklist', label: '自訂清單', component: ChecklistPanel, count: () => booklet.value.checklist.length, field: 'checklist' },
]
const { has } = useFormFields()
const unusedSection = (s: (typeof sections)[number]) => !!s.field && !has(s.field)
const currentSection = computed(() => sections.find((s) => s.id === section.value)!)

// 目前步驟、區塊的重點色線滑過去
const stepsBox = ref<HTMLElement>()
const sectionsBox = ref<HTMLElement>()
const stepBar = useSlider(stepsBox, () => [step.value])
const sectionBar = useSlider(sectionsBox, () => [step.value, section.value, ...sections.map((s) => s.count())])

// ---------- 訊息 ----------

const message = ref<{ kind: 'ok' | 'error'; text: string } | null>(null)
function notify(kind: 'ok' | 'error', text: string) {
  message.value = { kind, text }
}

// ---------- 確認對話框（取代瀏覽器內建的 confirm） ----------

const confirmState = ref<{ text: string; ok: string; resolve: (v: boolean) => void } | null>(null)
function askConfirm(text: string, ok: string): Promise<boolean> {
  return new Promise((resolve) => (confirmState.value = { text, ok, resolve }))
}
function closeConfirm(result: boolean) {
  confirmState.value?.resolve(result)
  confirmState.value = null
}

async function confirmDiscard(action: string): Promise<boolean> {
  if (!hasUnsavedChanges.value) return true
  return askConfirm(`目前的內容還沒存檔，${action}後這些內容會不見。確定要繼續嗎？`, `不存檔，直接${action}`)
}

// ---------- 新增、讀檔、存檔 ----------

async function onNew() {
  if (!(await confirmDiscard('新增手冊'))) return
  store.newBooklet()
  step.value = 'content'
  section.value = 'flights'
  message.value = null
}

const fileInput = ref<HTMLInputElement>()
async function onOpenClick() {
  if (!(await confirmDiscard('讀取存檔'))) return
  fileInput.value?.click()
}

async function onFileChosen(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // 讓同一個檔案可以再選一次
  if (!file) return
  try {
    store.loadSaveFile(await file.text()) // 沿用存檔裡記錄的排版風格
    notify('ok', `已讀取「${file.name}」。`)
  } catch (err) {
    notify('error', err instanceof SaveFileError ? err.message : '讀取存檔時發生錯誤。')
  }
}

async function onRevert() {
  const ok = await askConfirm('要放棄所有還沒存檔的變更，回到上次存檔時的內容嗎？', '放棄變更')
  if (!ok) return
  store.revertUnsaved()
  notify('ok', '已回到上次存檔時的內容。')
}

// 存檔後，頂列的「尚未存檔」小圓點換成一個打勾
const justSaved = ref(false)
let savedTimer: ReturnType<typeof setTimeout> | undefined
function onSave() {
  const text = store.exportSaveFile()
  downloadFile(text, bookletFileName(booklet.value, 'json'), 'application/json')
  notify('ok', '已下載存檔。之後可以用「讀取存檔」繼續編輯。')
  justSaved.value = true
  clearTimeout(savedTimer)
  savedTimer = setTimeout(() => (justSaved.value = false), 2000)
}

// ---------- 輸出手冊：一顆按鈕，再選網站／PDF；目前風格沒有的格式不能選 ----------

const outputOpen = ref(false)
const outputBox = ref<HTMLElement>()
const outputs = computed(() => {
  const t = currentTemplate.value
  return [
    { id: 'site' as const, label: '網站', note: '手機用，單一 HTML 檔或可以離線的 zip', ok: !!t?.site },
    { id: 'pdf' as const, label: 'PDF', note: 'A4，可以直接列印', ok: !!t?.site },
  ]
})

function chooseOutput(id: 'site' | 'pdf') {
  outputOpen.value = false
  if (id === 'site') siteChoice.value = true
  else void onGenerateClick(id)
}

// 點選單外面或按 Esc 就收起來
function onDocPointerDown(e: PointerEvent) {
  if (outputOpen.value && !outputBox.value?.contains(e.target as Node)) outputOpen.value = false
}
function onDocKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') outputOpen.value = false
}

// ---------- 產生前檢查（規格書 4.6）：有問題時先列出來，使用者可以回去修改或仍然產生 ----------

const checkIssues = ref<Issue[] | null>(null)
const ISSUE_LABEL: Record<TabId, string> = {
  ...(Object.fromEntries(sections.map((s) => [s.id, s.label])) as Record<SectionId, string>),
  style: '外觀',
}
const issueGroups = computed(() =>
  (Object.keys(ISSUE_LABEL) as TabId[])
    .map((tab) => ({ tab, items: (checkIssues.value ?? []).filter((i) => i.tab === tab).map((i) => i.text) }))
    .filter((g) => g.items.length),
)

async function collectIssues(): Promise<Issue[]> {
  let manifest: TemplateManifest | null = null
  try {
    manifest = await useTemplates().getManifest(settings.value.templateId)
  } catch {
    // 範本讀不到時，產生那一步會顯示錯誤
  }
  const issues = validateBooklet(booklet.value, manifest ?? FALLBACK_RULES)
  if (manifest) {
    for (const s of lowContrastSpots(manifest, effectivePalette(manifest, settings.value))) {
      issues.push({ tab: 'style', text: `${s.where}可能看不清楚，建議選深一點的顏色` })
    }
  }
  return issues
}

// 產出：網站（單一 HTML 或 zip）、PDF；先檢查，有問題時列出來
type OutputKind = 'html' | 'zip' | 'pdf'
const OUTPUT_LABEL: Record<OutputKind, string> = {
  html: '下載網站',
  zip: '下載網站',
  pdf: '產生 PDF',
}
const pendingOutput = ref<OutputKind>('html')

async function onGenerateClick(kind: OutputKind) {
  siteChoice.value = false
  pendingOutput.value = kind
  const issues = await collectIssues()
  if (issues.length) checkIssues.value = issues
  else await generate(kind)
}

function goToIssue(tab: TabId) {
  checkIssues.value = null
  if (tab === 'style') {
    step.value = 'look'
  } else {
    step.value = 'content'
    section.value = tab
  }
}

async function generateAnyway() {
  checkIssues.value = null
  await generate(pendingOutput.value)
}

// 下載網站：先選單一 HTML 檔或 zip
const siteChoice = ref(false)

const FONT_FALLBACK = '字型下載失敗（可能沒有網路），先用電腦內建的字型代替。'

const generating = ref<OutputKind | null>(null)
async function generate(kind: OutputKind) {
  generating.value = kind
  try {
    const b = booklet.value
    const s = settings.value
    if (kind === 'html') {
      const { output, fontError } = await siteHtmlFromSettings(b, s)
      downloadFile(output, bookletFileName(b, 'html'), 'text/html')
      notify(fontError ? 'error' : 'ok', fontError ? `已下載網站。${FONT_FALLBACK}` : '已下載網站。用瀏覽器打開這個 .html 檔就能看，也可以直接傳到手機。')
    } else if (kind === 'zip') {
      const { output, fontError } = await siteZipFromSettings(b, s)
      downloadFile(output as BlobPart, bookletFileName(b, 'zip'), 'application/zip')
      notify(fontError ? 'error' : 'ok', fontError ? `已下載網站 zip。${FONT_FALLBACK}` : '已下載網站 zip。解壓縮後整個資料夾上傳到 GitHub Pages 或 Netlify，就能離線瀏覽、加到手機主畫面。')
    } else {
      const { fontError } = await printPdfFromSettings(b, s)
      notify(fontError ? 'error' : 'ok', fontError ? `已叫出列印視窗。${FONT_FALLBACK}` : '在列印視窗的「目的地」選「另存為 PDF」，紙張會是 A4；建議取消勾選「頁首和頁尾」。')
    }
  } catch (err) {
    notify('error', `${OUTPUT_LABEL[kind]}失敗：${err instanceof Error ? err.message : String(err)}`)
  } finally {
    generating.value = null
  }
}

// ---------- 介面重點色跟著目前的範本配色 ----------
// 主色當小記號（編號、目前分頁），強調色當「輸出手冊」的底色；顏色太淺看不清楚時改用墨色

const PAPER = '#FAF9F5'
const INK = '#1E1D1A'

watch(
  settings,
  async (s) => {
    try {
      const palette = effectivePalette(await useTemplates().getManifest(s.templateId), s)
      const root = document.documentElement.style
      root.setProperty('--accent', readableOr(palette.accent1, PAPER, INK))
      root.setProperty('--accent-strong', readableOr(palette.accent5, '#FFFFFF', INK))
    } catch {
      // 範本讀不到時維持預設顏色
    }
  },
  { deep: true, immediate: true },
)

// ---------- 自動暫存的恢復提示 ----------

const restoreTime = computed(() =>
  pendingRestore.value ? new Date(pendingRestore.value.savedAt).toLocaleString('zh-TW') : '',
)

// ---------- 離開網頁前提醒 ----------

function onBeforeUnload(e: BeforeUnloadEvent) {
  if (!hasUnsavedChanges.value) return
  e.preventDefault()
  e.returnValue = ''
}
onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
  document.addEventListener('pointerdown', onDocPointerDown)
  document.addEventListener('keydown', onDocKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
  document.removeEventListener('pointerdown', onDocPointerDown)
  document.removeEventListener('keydown', onDocKeydown)
})
</script>

<template>
  <header class="topbar">
    <h1>旅遊手冊工坊</h1>
    <input v-model="booklet.title" class="trip" aria-label="手冊名稱" placeholder="手冊名稱，例如：熊本・阿蘇 2026.11" />
    <span class="spacer" />
    <span v-if="hasUnsavedChanges" class="status">有變更尚未存檔</span>
    <span v-else-if="justSaved" class="status saved">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 8.5l3.2 3L13 4.5" />
      </svg>
      已存檔
    </span>
    <button v-if="hasUnsavedChanges" type="button" @click="onRevert">放棄變更</button>
    <button type="button" @click="onNew">新增手冊</button>
    <button type="button" @click="onOpenClick">讀取存檔</button>
    <button type="button" class="primary" @click="onSave">存檔</button>
    <div ref="outputBox" class="output">
      <button
        type="button"
        class="generate"
        aria-haspopup="menu"
        :aria-expanded="outputOpen"
        :disabled="!!generating"
        @click="outputOpen = !outputOpen"
      >
        {{ generating ? '產生中…' : '輸出手冊' }}
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      <div v-if="outputOpen" class="output-menu" role="menu">
        <button
          v-for="o in outputs"
          :key="o.id"
          type="button"
          role="menuitem"
          :disabled="!o.ok"
          @click="chooseOutput(o.id)"
        >
          <strong>{{ o.label }}</strong>
          <span>{{ o.ok ? o.note : `「${currentTemplate?.name}」沒有 ${o.label} 版，可以在「風格」換一個` }}</span>
        </button>
      </div>
    </div>
    <input ref="fileInput" type="file" accept=".json,application/json" hidden @change="onFileChosen" />
  </header>

  <div class="split">
    <!-- 工作台 -->
    <main class="bench">
      <div v-if="pendingRestore" class="banner warn" role="status">
        <span>找到上次編輯到一半的內容（{{ restoreTime }}），要恢復嗎？</span>
        <span class="spacer" />
        <button type="button" class="primary" @click="store.restoreAutosave()">恢復</button>
        <button type="button" @click="store.discardAutosave()">捨棄</button>
      </div>

      <div v-if="message" class="banner" :class="message.kind" :role="message.kind === 'error' ? 'alert' : 'status'">
        <span>{{ message.text }}</span>
        <span class="spacer" />
        <button type="button" class="icon" aria-label="關閉訊息" @click="message = null">關閉</button>
      </div>

      <nav ref="stepsBox" class="steps" role="tablist" aria-label="工作台步驟">
        <span class="slider" :style="stepBar" aria-hidden="true" />
        <button
          v-for="s in steps"
          :id="`step-${s.id}`"
          :key="s.id"
          type="button"
          role="tab"
          :aria-selected="step === s.id"
          aria-controls="step-panel"
          :class="{ active: step === s.id }"
          @click="step = s.id"
        >
          <span class="no">{{ s.no }}</span>{{ s.label }}
        </button>
        <span class="spacer" />
        <button v-if="nextStep" type="button" class="add" @click="step = nextStep.id">下一步：{{ nextStep.label }}</button>
      </nav>

      <div id="step-panel" role="tabpanel" :aria-labelledby="`step-${step}`">
        <!-- 01 內容 -->
        <div v-if="step === 'content'" class="content">
          <div class="sections-col">
            <nav ref="sectionsBox" class="sections" role="tablist" aria-orientation="vertical" aria-label="內容區塊">
              <span class="slider" :style="sectionBar" aria-hidden="true" />
              <button
                v-for="s in sections"
                :id="`section-${s.id}`"
                :key="s.id"
                type="button"
                role="tab"
                :aria-selected="section === s.id"
                :aria-controls="`panel-${s.id}`"
                :class="{ active: section === s.id, dim: unusedSection(s) }"
                @click="section = s.id"
              >
                <span>{{ s.label }}</span>
                <span class="count">{{ s.count() }}</span>
              </button>
            </nav>
            <p v-if="sections.some(unusedSection)" class="hint sections-note">
              淡色的區塊「{{ currentTemplate?.name }}」不會顯示，資料仍會保留。
            </p>
          </div>

          <div :id="`panel-${section}`" role="tabpanel" :aria-labelledby="`section-${section}`" class="section-panel">
            <p v-if="unusedSection(currentSection)" class="banner warn unused-banner">
              目前的排版風格「{{ currentTemplate?.name }}」不會顯示{{ currentSection.label }}；可以先填著，換成有這個區塊的風格就會出現。
            </p>
            <component :is="currentSection.component" />
          </div>
        </div>

        <!-- 02 風格 -->
        <StylePicker v-else-if="step === 'style'" />

        <!-- 03 外觀 -->
        <StylePanel v-else />
      </div>
    </main>

    <!-- 深色桌面上的成品 -->
    <PreviewDesk />
  </div>

  <div v-if="siteChoice" class="overlay">
    <div class="dialog site-dialog" role="dialog" aria-modal="true" aria-labelledby="site-title">
      <h2 id="site-title">下載網站</h2>
      <div class="site-options">
        <button type="button" class="site-option" @click="onGenerateClick('html')">
          <strong>單一 HTML 檔</strong>
          <span class="hint">一個 .html 檔，用瀏覽器打開就能看，也可以直接傳給旅伴。</span>
        </button>
        <button type="button" class="site-option" @click="onGenerateClick('zip')">
          <strong>上架用 zip</strong>
          <span class="hint">整個資料夾上傳到 GitHub Pages 或 Netlify 後，可以離線瀏覽、加到手機主畫面。</span>
        </button>
      </div>
      <div class="dialog-actions">
        <button type="button" @click="siteChoice = false">取消</button>
      </div>
    </div>
  </div>

  <div v-if="confirmState" class="overlay">
    <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-text">
      <p id="confirm-text">{{ confirmState.text }}</p>
      <div class="dialog-actions">
        <button type="button" @click="closeConfirm(false)">取消</button>
        <button type="button" class="primary" @click="closeConfirm(true)">{{ confirmState.ok }}</button>
      </div>
    </div>
  </div>

  <div v-if="checkIssues" class="overlay">
    <div class="dialog check-dialog" role="alertdialog" aria-modal="true" aria-labelledby="check-title">
      <h2 id="check-title">產生前檢查</h2>
      <p>有 {{ checkIssues.length }} 個地方可能還沒填好，還是可以直接{{ OUTPUT_LABEL[pendingOutput] }}。</p>
      <div class="issue-list">
        <section v-for="g in issueGroups" :key="g.tab" class="issue-group">
          <div class="issue-head">
            <h3>{{ ISSUE_LABEL[g.tab] }}</h3>
            <button type="button" class="add" @click="goToIssue(g.tab)">前往修改</button>
          </div>
          <ul>
            <li v-for="(text, i) in g.items" :key="i">{{ text }}</li>
          </ul>
        </section>
      </div>
      <div class="dialog-actions">
        <button type="button" @click="checkIssues = null">回去修改</button>
        <button type="button" class="generate" @click="generateAnyway">仍然{{ OUTPUT_LABEL[pendingOutput] }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ---------- 頂列 ---------- */

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--bar-h);
  padding: 0 var(--gutter);
  background: var(--paper-texture) fixed, var(--paper);
  border-bottom: 2px solid var(--ink);
}

.topbar h1 {
  font-size: 20px;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.trip {
  width: 300px;
  margin-left: 20px;
  font-family: var(--font-heading);
  font-weight: 900;
  font-size: 17px;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--warn);
  margin-right: 8px;
  white-space: nowrap;
}

.status::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.status.saved {
  color: var(--ok);
  font-weight: 700;
  animation: pop 0.3s cubic-bezier(0.3, 1.6, 0.5, 1);
}

.status.saved::before {
  display: none;
}

/* 打勾一筆畫出來 */
.status.saved path {
  stroke-dasharray: 16;
  stroke-dashoffset: 16;
  animation: draw 0.35s 0.1s ease-out forwards;
}

@keyframes pop {
  from {
    transform: scale(0.6);
    opacity: 0;
  }
}

@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}

.topbar button {
  white-space: nowrap;
}

.output {
  position: relative;
}

.output .generate {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.output-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  width: 300px;
  display: grid;
  background: var(--paper);
  border: 2px solid var(--ink);
  box-shadow: 0 18px 44px rgb(30 29 26 / 28%);
}

.output-menu button {
  display: grid;
  gap: 2px;
  padding: 10px 14px;
  border: 0;
  border-bottom: 1px solid var(--hair);
  text-align: left;
  white-space: normal;
}

.output-menu button:last-child {
  border-bottom: 0;
}

.output-menu button span {
  font-weight: 400;
  font-size: 13px;
  color: var(--ink-soft);
}

.output-menu button:hover:not(:disabled) span {
  color: var(--paper);
}

/* ---------- 兩欄：工作台＋右邊的深色桌面 ---------- */

.split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  min-height: calc(100vh - var(--bar-h));
}

.bench {
  min-width: 0;
  padding: 8px var(--gutter) 96px;
}

.steps {
  position: relative;
  display: flex;
  align-items: center;
  gap: 28px;
  margin-top: 12px;
  border-bottom: 2px solid var(--ink);
}

.steps button[role='tab'] {
  border: 0;
  padding: 10px 0 12px;
  font-size: 16px;
  color: var(--ink-soft);
}

.steps button[role='tab']:hover:not(:disabled) {
  background: transparent;
  color: var(--ink);
}

.steps button.active {
  color: var(--ink);
}

.steps .no {
  font-family: var(--font-label);
  font-weight: 700;
  margin-right: 6px;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.steps .slider {
  --slider-drop: 2px;
}

/* 內容：左邊區塊清單、右邊表單 */
.content {
  display: grid;
  grid-template-columns: 136px minmax(0, 1fr);
  gap: 32px;
}

.sections-col {
  position: sticky;
  top: calc(var(--bar-h) + 22px);
  align-self: start;
  padding-top: 22px;
}

.sections {
  position: relative;
  display: grid;
  border-top: 2px solid var(--ink);
}

.sections button {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 10px 2px 10px 14px;
  border: 0;
  border-bottom: 1px solid var(--hair);
  text-align: left;
  color: var(--ink-soft);
}

.sections button:hover:not(:disabled) {
  background: var(--paper-2);
  color: var(--ink);
}

.sections button.active {
  color: var(--ink);
}

.sections button.dim span:first-child {
  color: var(--placeholder);
  font-weight: 400;
}

/* 區塊清單的重點色線在左邊、直的 */
.sections .slider {
  top: var(--y);
  width: 4px;
  height: var(--h);
  transition-property: top, height, background-color;
}

.count {
  font-family: var(--font-label);
  font-weight: 600;
  font-size: 15px;
  margin-left: 6px;
  font-variant-numeric: tabular-nums;
}

.sections button.active .count {
  color: var(--accent);
}

.sections-note {
  margin-top: 10px;
  font-size: 12px;
}

.unused-banner {
  margin-top: 22px;
}

.banner {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 10px 14px;
  font-size: 14px;
  background: var(--paper-2);
}

.banner.warn {
  background: var(--warn-bg);
  color: var(--warn);
}

.banner.ok {
  background: var(--ok-bg);
  color: var(--ok);
}

.banner.error {
  background: #f8e6e9;
  color: var(--danger);
}

.banner .icon {
  color: inherit;
}

/* ---------- 對話框 ---------- */

.overlay {
  position: fixed;
  inset: 0;
  background: rgb(30 29 26 / 40%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.dialog {
  background: var(--paper);
  border: 2px solid var(--ink);
  padding: 24px 28px;
  max-width: 460px;
  box-shadow: 0 18px 44px rgb(30 29 26 / 28%);
}

.dialog p {
  margin: 0 0 20px;
}

.site-dialog {
  max-width: 560px;
  width: 100%;
}

.site-dialog h2 {
  font-size: 24px;
  margin-bottom: 14px;
}

.site-options {
  display: grid;
  gap: 10px;
  margin-bottom: 20px;
}

.site-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  height: auto;
  padding: 14px 16px;
  text-align: left;
}

.site-option strong {
  font-size: 16px;
}

.check-dialog {
  max-width: 580px;
  width: 100%;
}

.check-dialog h2 {
  font-size: 24px;
  margin-bottom: 6px;
}

.issue-list {
  max-height: 50vh;
  overflow-y: auto;
  margin-bottom: 20px;
  border-top: 2px solid var(--ink);
}

.issue-group {
  padding: 12px 0;
  border-bottom: 1px solid var(--hair);
}

.issue-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.issue-head h3 {
  font-size: 15px;
}

.issue-group ul {
  margin: 4px 0 0;
  padding-left: 20px;
  color: var(--ink-soft);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
