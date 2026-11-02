<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import ChecklistPanel from './components/ChecklistPanel.vue'
import DaysPanel from './components/DaysPanel.vue'
import FlightsPanel from './components/FlightsPanel.vue'
import FoodsPanel from './components/FoodsPanel.vue'
import HotelsPanel from './components/HotelsPanel.vue'
import InfosPanel from './components/InfosPanel.vue'
import StylePanel from './components/StylePanel.vue'
import TemplatePicker from './components/TemplatePicker.vue'
import { effectivePalette, generateFromSettings } from './docx/fromSettings'
import { printPdfFromSettings, siteHtmlFromSettings, siteZipFromSettings } from './site/fromSettings'
import { lowContrastSpots, readableOr } from './model/contrast'
import { bookletFileName } from './model/fileName'
import { hiddenContent } from './model/hiddenContent'
import { SaveFileError } from './model/saveFile'
import type { FormField, TemplateManifest } from './model/booklet'
import { FALLBACK_RULES } from './model/defaults'
import { validateBooklet, type Issue, type TabId } from './model/validate'
import { useBookletStore } from './store/booklet'
import { useFormFields, useTemplates } from './store/templates'
import { downloadFile } from './utils/download'

const store = useBookletStore()
const { booklet, settings, hasUnsavedChanges, pendingRestore } = store
const { templates } = useTemplates()

// ---------- 畫面：先在起始頁選排版風格，再進入填資料 ----------

const stage = ref<'pick' | 'edit'>('pick')
const pickedTemplate = ref(settings.value.templateId)

function enterEditor() {
  stage.value = 'edit'
  activeTab.value = tabs[0].id
}

function onStart() {
  store.startBooklet(pickedTemplate.value)
  enterEditor()
}

function onRestore() {
  store.restoreAutosave()
  if (stage.value === 'pick') enterEditor()
}

const currentTemplate = computed(
  () => templates.value.find((t) => t.id === settings.value.templateId) ?? templates.value[0],
)

// ---------- 分頁 ----------

const tabs: { id: TabId; label: string; component: Component; count?: () => number }[] = [
  { id: 'flights', label: '航班', component: FlightsPanel, count: () => booklet.value.flights.length },
  { id: 'days', label: '每日行程', component: DaysPanel, count: () => booklet.value.days.length },
  { id: 'foods', label: '美食特產', component: FoodsPanel, count: () => booklet.value.foods.length },
  { id: 'hotels', label: '飯店', component: HotelsPanel, count: () => booklet.value.hotels.length },
  { id: 'infos', label: '旅遊資訊', component: InfosPanel, count: () => booklet.value.infos.length },
  { id: 'checklist', label: '自訂清單', component: ChecklistPanel, count: () => booklet.value.checklist.length },
  { id: 'style', label: '字體與顏色', component: StylePanel },
]
// 網站範本沒有字體可選，這一頁改放手冊名稱和配色
const styleLabel = computed(() => (currentTemplate.value?.fontRoles.length ? '字體與顏色' : '名稱與配色'))
const tabLabel = (t: (typeof tabs)[number]) => (t.id === 'style' ? styleLabel.value : t.label)
// 美食特產、旅遊資訊、自訂清單：範本沒用到就不顯示（資料仍保留在存檔裡）
const { has } = useFormFields()
const optionalTabs: TabId[] = ['foods', 'infos', 'checklist']
const visibleTabs = computed(() => tabs.filter((t) => !optionalTabs.includes(t.id) || has(t.id as FormField)))
const activeTab = ref(tabs[0].id)
const activePanel = computed(() => tabs.find((t) => t.id === activeTab.value)!.component)
// 換範本後目前分頁不見了，回到第一個分頁
watch(visibleTabs, (v) => {
  if (!v.some((t) => t.id === activeTab.value)) activeTab.value = v[0].id
})

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

// ---------- 新增、讀檔、存檔、產生 Word ----------

async function onNew() {
  if (!(await confirmDiscard('新增手冊'))) return
  store.newBooklet()
  pickedTemplate.value = settings.value.templateId
  message.value = null
  stage.value = 'pick'
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
    if (stage.value === 'pick') enterEditor()
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

function onSave() {
  const text = store.exportSaveFile()
  downloadFile(text, bookletFileName(booklet.value, 'json'), 'application/json')
  notify('ok', '已下載存檔。之後可以用「讀取存檔」繼續編輯。')
}

// ---------- 換排版風格：資料全部保留，新風格用不到的欄位只是不顯示 ----------

const switchTarget = ref<string | null>(null)
const switchManifest = computed(() => templates.value.find((t) => t.id === switchTarget.value))
const switchHidden = computed(() => (switchManifest.value ? hiddenContent(booklet.value, switchManifest.value) : []))
const switchChanged = computed(() => switchTarget.value !== settings.value.templateId)

function openSwitch() {
  switchTarget.value = settings.value.templateId
}

function confirmSwitch() {
  const m = switchManifest.value
  switchTarget.value = null
  if (!m || m.id === settings.value.templateId) return
  store.changeTemplate(m.id)
  notify('ok', `已換成「${m.name}」排版風格。`)
}

// ---------- 產生前檢查（規格書 4.6）：有問題時先列出來，使用者可以回去修改或仍然產生 ----------

const checkIssues = ref<Issue[] | null>(null)
const issueGroups = computed(() =>
  tabs
    .map((t) => ({ tab: t, items: (checkIssues.value ?? []).filter((i) => i.tab === t.id).map((i) => i.text) }))
    .filter((g) => g.items.length),
)

async function collectIssues(): Promise<Issue[]> {
  let manifest: TemplateManifest | null = null
  try {
    manifest = await useTemplates().getManifest(settings.value.templateId)
  } catch {
    // 範本讀不到時，產生 Word 那一步會顯示錯誤
  }
  const issues = validateBooklet(booklet.value, manifest ?? FALLBACK_RULES)
  if (manifest) {
    for (const s of lowContrastSpots(manifest, effectivePalette(manifest, settings.value))) {
      issues.push({ tab: 'style', text: `${s.where}可能看不清楚，建議選深一點的顏色` })
    }
  }
  return issues
}

// 產出：Word、網站（單一 HTML 或 zip）、PDF；先檢查，有問題時列出來
type OutputKind = 'docx' | 'html' | 'zip' | 'pdf'
const OUTPUT_LABEL: Record<OutputKind, string> = {
  docx: '產生 Word',
  html: '下載網站',
  zip: '下載網站',
  pdf: '產生 PDF',
}
const pendingOutput = ref<OutputKind>('docx')

async function onGenerateClick(kind: OutputKind) {
  siteChoice.value = false
  pendingOutput.value = kind
  const issues = await collectIssues()
  if (issues.length) checkIssues.value = issues
  else await generate(kind)
}

function goToIssue(tab: TabId) {
  checkIssues.value = null
  activeTab.value = tab
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
    if (kind === 'docx') {
      const docx = await generateFromSettings(b, s)
      downloadFile(
        docx as BlobPart,
        bookletFileName(b, 'docx'),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      )
      notify('ok', '已產生 Word。需要 PDF 時，請在 Word 裡「另存為 PDF」。')
    } else if (kind === 'html') {
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
// 主色當小記號（編號、目前分頁），強調色當「產生 Word」的底色；顏色太淺看不清楚時改用墨色

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
onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
</script>

<template>
  <header class="topbar">
    <div class="topbar-inner">
      <div class="top-row">
        <h1>旅遊手冊工坊</h1>
        <template v-if="stage === 'edit'">
          <span v-if="currentTemplate" class="current-style">
            <span class="hint">排版風格</span>
            <strong>{{ currentTemplate.name }}</strong>
          </span>
          <button type="button" class="add" @click="openSwitch">換排版風格</button>
          <span class="spacer" />
          <span v-if="hasUnsavedChanges" class="status">有變更尚未存檔</span>
          <button v-if="hasUnsavedChanges" type="button" @click="onRevert">放棄變更</button>
          <button type="button" @click="onNew">新增手冊</button>
          <button type="button" @click="onOpenClick">讀取存檔</button>
          <button type="button" class="primary" @click="onSave">存檔</button>
          <button
            v-if="currentTemplate?.file"
            type="button"
            class="generate"
            :disabled="!!generating"
            @click="onGenerateClick('docx')"
          >
            {{ generating === 'docx' ? '產生中…' : '產生 Word' }}
          </button>
          <template v-if="currentTemplate?.site">
            <button type="button" class="generate" :disabled="!!generating" @click="siteChoice = true">
              {{ generating === 'html' || generating === 'zip' ? '產生中…' : '下載網站' }}
            </button>
            <button type="button" class="generate" :disabled="!!generating" @click="onGenerateClick('pdf')">
              {{ generating === 'pdf' ? '準備中…' : '產生 PDF' }}
            </button>
          </template>
        </template>
        <input ref="fileInput" type="file" accept=".json,application/json" hidden @change="onFileChosen" />
      </div>

      <nav v-if="stage === 'edit'" class="tabs" role="tablist" aria-label="手冊內容">
        <button
          v-for="t in visibleTabs"
          :id="`tab-${t.id}`"
          :key="t.id"
          type="button"
          role="tab"
          :aria-selected="activeTab === t.id"
          :aria-controls="`panel-${t.id}`"
          :class="{ active: activeTab === t.id }"
          @click="activeTab = t.id"
        >
          {{ tabLabel(t) }}
          <sup v-if="t.count" class="count">{{ t.count() }}</sup>
        </button>
      </nav>
    </div>
  </header>

  <main class="layout">
    <div v-if="pendingRestore" class="banner warn" role="status">
      <span>找到上次編輯到一半的內容（{{ restoreTime }}），要恢復嗎？</span>
      <span class="spacer" />
      <button type="button" class="primary" @click="onRestore">恢復</button>
      <button type="button" @click="store.discardAutosave()">捨棄</button>
    </div>

    <div v-if="message" class="banner" :class="message.kind" :role="message.kind === 'error' ? 'alert' : 'status'">
      <span>{{ message.text }}</span>
      <span class="spacer" />
      <button type="button" class="icon" aria-label="關閉訊息" @click="message = null">關閉</button>
    </div>

    <section v-if="stage === 'pick'" class="start">
      <div class="panel-intro">
        <h2>選擇排版風格</h2>
        <p class="hint">選好之後開始填資料。之後隨時可以換風格，已經填好的資料都會保留。</p>
      </div>
      <TemplatePicker v-model="pickedTemplate" name="start-template" />
      <div class="start-actions">
        <button type="button" class="primary" @click="onStart">開始填寫</button>
        <span class="hint">已經有存檔？</span>
        <button type="button" @click="onOpenClick">讀取存檔</button>
      </div>
    </section>

    <div v-else :id="`panel-${activeTab}`" role="tabpanel" :aria-labelledby="`tab-${activeTab}`">
      <component :is="activePanel" />
    </div>
  </main>

  <div v-if="switchTarget" class="overlay">
    <div class="dialog switch-dialog" role="dialog" aria-modal="true" aria-labelledby="switch-title">
      <h2 id="switch-title">換排版風格</h2>
      <TemplatePicker v-model="switchTarget" name="switch-template" />
      <div v-if="switchChanged && switchManifest" class="switch-note">
        <template v-if="switchHidden.length">
          <p>換成「{{ switchManifest.name }}」後，下面這些內容不會顯示，也不會出現在產生的手冊裡：</p>
          <ul>
            <li v-for="h in switchHidden" :key="h.label">{{ h.label }}（{{ h.count }} 筆）</li>
          </ul>
          <p class="hint">資料仍然保留在存檔裡，換回原本的風格就會再出現。</p>
        </template>
        <p v-else>已經填好的內容在「{{ switchManifest.name }}」都會顯示。</p>
        <p class="hint">配色會換成新風格的預設配色；字體設定會保留。</p>
      </div>
      <div class="dialog-actions">
        <button type="button" @click="switchTarget = null">取消</button>
        <button type="button" class="primary" :disabled="!switchChanged" @click="confirmSwitch">
          {{ switchChanged && switchManifest ? `換成「${switchManifest.name}」` : '換排版風格' }}
        </button>
      </div>
    </div>
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
        <section v-for="g in issueGroups" :key="g.tab.id" class="issue-group">
          <div class="issue-head">
            <h3>{{ tabLabel(g.tab) }}</h3>
            <button type="button" class="add" @click="goToIssue(g.tab.id)">前往修改</button>
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
.topbar {
  background: var(--paper);
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar-inner,
.layout {
  max-width: var(--page-width);
  margin: 0 auto;
  padding: 0 var(--gutter);
}

.top-row {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 64px;
}

.top-row h1 {
  font-size: 20px;
  letter-spacing: 0.08em;
}

.current-style {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  margin-left: 20px;
  padding-left: 20px;
  border-left: 1px solid var(--hair);
}

.current-style strong {
  font-size: 15px;
}

.start-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
}

.start-actions .hint {
  margin-left: 16px;
}

.switch-dialog {
  max-width: 640px;
  width: 100%;
}

.switch-dialog h2 {
  font-size: 24px;
  margin-bottom: 14px;
}

.switch-dialog .choices {
  margin-bottom: 18px;
}

.switch-note {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: var(--paper-2);
}

.dialog .switch-note p {
  margin: 0 0 6px;
}

.switch-note ul {
  margin: 0 0 8px;
  padding-left: 20px;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--warn);
  margin-right: 8px;
}

.status::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

/* 主分頁：粗墨線上的文字分頁，目前分頁下方一條重點色 */
.tabs {
  display: flex;
  gap: 28px;
  border-bottom: 2px solid var(--ink);
}

.tabs button {
  position: relative;
  border: 0;
  padding: 10px 0 12px;
  font-size: 16px;
  color: var(--ink-soft);
}

.tabs button:hover:not(:disabled) {
  background: transparent;
  color: var(--ink);
}

.tabs button:last-child {
  margin-left: auto;
}

.tabs button.active {
  color: var(--ink);
}

.tabs button.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 4px;
  background: var(--accent);
  transition: background-color 0.3s ease-out;
}

.count {
  font-family: var(--font-label);
  font-weight: 600;
  font-size: 13px;
  margin-left: 3px;
  font-variant-numeric: tabular-nums;
}

.tabs button.active .count {
  color: var(--accent);
}

.layout {
  padding-bottom: 96px;
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
