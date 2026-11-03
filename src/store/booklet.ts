// 目前編輯中的手冊：表單狀態、存檔／讀檔、瀏覽器自動暫存（規格書 4.2）

import { computed, ref, watch } from 'vue'
import type { Booklet, Settings } from '../model/booklet'
import { defaultSettings, emptyBooklet, TRIP_TYPES, type TripType } from '../model/defaults'
import { createSaveFile, parseSaveFile, type SaveFile } from '../model/saveFile'

const AUTOSAVE_KEY = 'booklet-workshop:autosave'
const AUTOSAVE_DELAY = 500

const booklet = ref<Booklet>(emptyBooklet())
const settings = ref<Settings>(defaultSettings())

const snapshot = () => JSON.stringify({ booklet: booklet.value, settings: settings.value })
const emptySnapshot = JSON.stringify({ booklet: emptyBooklet(), settings: defaultSettings() })
// 剛選好範本、還沒填任何東西：不論哪個範本、哪種旅行類型都不需要暫存
const isBlank = () =>
  TRIP_TYPES.some((t) => JSON.stringify(booklet.value) === JSON.stringify(emptyBooklet(t.id))) &&
  !settings.value.palette

// 最後一次「存檔／讀取存檔／新增手冊」時的內容；和目前內容不同就代表有變更還沒存成檔案
const fileSnapshot = ref(snapshot())
// JSON.stringify 會讀到每個欄位，computed 因此能追蹤到深層變更
const hasUnsavedChanges = computed(() => snapshot() !== fileSnapshot.value)

// ---------- 自動暫存 ----------
// 瀏覽器禁止儲存時（例如部分無痕模式）讀寫會丟出例外，一律忽略，不影響其他功能

function readAutosave(): SaveFile | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY)
    if (!raw) return null
    parseSaveFile(raw) // 內容壞掉就當作沒有暫存
    return JSON.parse(raw) as SaveFile
  } catch {
    return null
  }
}

function writeAutosave() {
  try {
    if (isBlank()) localStorage.removeItem(AUTOSAVE_KEY)
    else localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(createSaveFile(booklet.value, settings.value)))
  } catch {
    // 忽略
  }
}

/** 打開網站時找到的上次暫存；使用者決定恢復或捨棄之前，不覆寫暫存 */
const pendingRestore = ref<SaveFile | null>(readAutosave())

let timer: ReturnType<typeof setTimeout> | undefined
watch(
  [booklet, settings],
  () => {
    if (pendingRestore.value) return
    clearTimeout(timer)
    timer = setTimeout(writeAutosave, AUTOSAVE_DELAY)
  },
  { deep: true },
)

function apply(b: Booklet, s: Settings) {
  booklet.value = b
  settings.value = s
}

function restoreAutosave() {
  const file = pendingRestore.value
  pendingRestore.value = null
  if (!file) return
  const { booklet: b, settings: s } = parseSaveFile(JSON.stringify(file))
  apply(b, s)
  // 暫存的內容還沒存成檔案：快照維持空白手冊，讓「離開前提醒」繼續有效
  fileSnapshot.value = emptySnapshot
}

function discardAutosave() {
  pendingRestore.value = null
  writeAutosave()
}

// ---------- 新增、讀檔、存檔 ----------

function newBooklet(type: TripType) {
  pendingRestore.value = null
  apply(emptyBooklet(type), defaultSettings())
  fileSnapshot.value = snapshot()
}

/** 換範本：填好的資料全部保留（新範本用不到的欄位只是不顯示）；配色回到新範本的預設 */
function changeTemplate(templateId: string) {
  settings.value = { templateId, palette: null }
}

/** 讀取存檔；格式不對時丟出 SaveFileError（訊息可直接顯示給使用者） */
function loadSaveFile(text: string) {
  const { booklet: b, settings: s } = parseSaveFile(text)
  pendingRestore.value = null
  apply(b, s)
  fileSnapshot.value = snapshot()
}

/** 放棄還沒存檔的變更，回到最後一次「存檔／讀取存檔／新增手冊」時的內容 */
function revertUnsaved() {
  const { booklet: b, settings: s } = JSON.parse(fileSnapshot.value) as { booklet: Booklet; settings: Settings }
  apply(b, s)
}

/** 產生存檔內容，並記錄為「已存檔」 */
function exportSaveFile(): string {
  const text = JSON.stringify(createSaveFile(booklet.value, settings.value), null, 2)
  fileSnapshot.value = snapshot()
  return text
}

export function useBookletStore() {
  return {
    booklet,
    settings,
    hasUnsavedChanges,
    pendingRestore,
    restoreAutosave,
    discardAutosave,
    newBooklet,
    changeTemplate,
    loadSaveFile,
    revertUnsaved,
    exportSaveFile,
  }
}
