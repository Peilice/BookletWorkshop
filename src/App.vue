<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Component } from 'vue'
import ChecklistPanel from './components/ChecklistPanel.vue'
import DaysPanel from './components/DaysPanel.vue'
import FlightsPanel from './components/FlightsPanel.vue'
import FoodsPanel from './components/FoodsPanel.vue'
import HotelsPanel from './components/HotelsPanel.vue'
import InfosPanel from './components/InfosPanel.vue'
import { generateFromSettings } from './docx/fromSettings'
import { bookletFileName } from './model/fileName'
import { SaveFileError } from './model/saveFile'
import { useBookletStore } from './store/booklet'
import { downloadFile } from './utils/download'

const store = useBookletStore()
const { booklet, settings, hasUnsavedChanges, pendingRestore } = store

// ---------- 分頁 ----------

const tabs: { id: string; label: string; component: Component; count: () => number }[] = [
  { id: 'flights', label: '航班', component: FlightsPanel, count: () => booklet.value.flights.length },
  { id: 'days', label: '每日行程', component: DaysPanel, count: () => booklet.value.days.length },
  { id: 'foods', label: '美食特產', component: FoodsPanel, count: () => booklet.value.foods.length },
  { id: 'hotels', label: '飯店', component: HotelsPanel, count: () => booklet.value.hotels.length },
  { id: 'infos', label: '旅遊資訊', component: InfosPanel, count: () => booklet.value.infos.length },
  { id: 'checklist', label: '自訂清單', component: ChecklistPanel, count: () => booklet.value.checklist.length },
]
const activeTab = ref(tabs[0].id)
const activePanel = computed(() => tabs.find((t) => t.id === activeTab.value)!.component)

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
  activeTab.value = tabs[0].id
  notify('ok', '已開始一份新的手冊。')
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
    store.loadSaveFile(await file.text())
    notify('ok', `已讀取「${file.name}」。`)
  } catch (err) {
    notify('error', err instanceof SaveFileError ? err.message : '讀取存檔時發生錯誤。')
  }
}

function onSave() {
  const text = store.exportSaveFile()
  downloadFile(text, bookletFileName(booklet.value, 'json'), 'application/json')
  notify('ok', '已下載存檔。之後可以用「讀取存檔」繼續編輯。')
}

const generating = ref(false)
async function onGenerate() {
  generating.value = true
  try {
    const docx = await generateFromSettings(booklet.value, settings.value)
    downloadFile(
      docx as BlobPart,
      bookletFileName(booklet.value, 'docx'),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
    notify('ok', '已產生 Word。需要 PDF 時，請在 Word 裡「另存為 PDF」。')
  } catch (err) {
    notify('error', `產生 Word 失敗：${err instanceof Error ? err.message : String(err)}`)
  } finally {
    generating.value = false
  }
}

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
      <h1>旅遊手冊工坊</h1>
      <span v-if="hasUnsavedChanges" class="status">有變更尚未存檔</span>
      <span class="spacer" />
      <button type="button" @click="onNew">新增手冊</button>
      <button type="button" @click="onOpenClick">讀取存檔</button>
      <button type="button" @click="onSave">存檔</button>
      <button type="button" class="primary" :disabled="generating" @click="onGenerate">
        {{ generating ? '產生中…' : '產生 Word' }}
      </button>
      <input ref="fileInput" type="file" accept=".json,application/json" hidden @change="onFileChosen" />
    </div>
  </header>

  <main class="layout">
    <div v-if="pendingRestore" class="banner warn" role="status">
      <span>找到上次編輯到一半的內容（{{ restoreTime }}），要恢復嗎？</span>
      <span class="spacer" />
      <button type="button" class="primary" @click="store.restoreAutosave()">恢復</button>
      <button type="button" @click="store.discardAutosave()">捨棄</button>
    </div>

    <div v-if="message" class="banner" :class="message.kind" :role="message.kind === 'error' ? 'alert' : 'status'">
      <span>{{ message.text }}</span>
      <span class="spacer" />
      <button type="button" class="icon" aria-label="關閉訊息" @click="message = null">✕</button>
    </div>

    <nav class="tabs" role="tablist" aria-label="手冊內容">
      <button
        v-for="t in tabs"
        :id="`tab-${t.id}`"
        :key="t.id"
        type="button"
        role="tab"
        :aria-selected="activeTab === t.id"
        :aria-controls="`panel-${t.id}`"
        :class="{ active: activeTab === t.id }"
        @click="activeTab = t.id"
      >
        {{ t.label }}
        <span class="count">{{ t.count() }}</span>
      </button>
    </nav>

    <div :id="`panel-${activeTab}`" role="tabpanel" :aria-labelledby="`tab-${activeTab}`" class="panel">
      <component :is="activePanel" />
    </div>
  </main>

  <div v-if="confirmState" class="overlay">
    <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-text">
      <p id="confirm-text">{{ confirmState.text }}</p>
      <div class="dialog-actions">
        <button type="button" @click="closeConfirm(false)">取消</button>
        <button type="button" class="primary" @click="closeConfirm(true)">{{ confirmState.ok }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.topbar {
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar-inner,
.layout {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}

.topbar-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 60px;
}

.topbar h1 {
  font-size: 20px;
  color: var(--c-primary);
  margin-right: 8px;
}

.status {
  font-size: 13px;
  color: #8a5a00;
}

.spacer {
  flex: 1;
}

.layout {
  padding-top: 20px;
  padding-bottom: 60px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius);
  border: 1px solid var(--c-border);
  background: var(--c-surface);
}

.banner.warn {
  background: var(--c-warn-bg);
  border-color: var(--c-warn-border);
}

.banner.ok {
  background: var(--c-ok-bg);
  border-color: var(--c-ok-border);
}

.banner.error {
  background: #fbe9ec;
  border-color: var(--c-danger);
  color: var(--c-danger);
}

.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--c-border);
}

.tabs button {
  border: none;
  border-bottom: 3px solid transparent;
  border-radius: 0;
  background: transparent;
  padding: 10px 16px;
  color: var(--c-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.tabs button:hover {
  color: var(--c-text);
}

.tabs button.active {
  color: var(--c-primary);
  border-bottom-color: var(--c-primary);
  font-weight: 700;
}

.count {
  font-size: 12px;
  min-width: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--c-primary-soft);
  color: var(--c-primary);
  font-weight: 400;
}

.panel {
  padding-top: 8px;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 35%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.dialog {
  background: var(--c-surface);
  border-radius: var(--radius);
  padding: 20px 24px;
  max-width: 440px;
  box-shadow: 0 8px 30px rgb(0 0 0 / 20%);
}

.dialog p {
  margin: 0 0 16px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
