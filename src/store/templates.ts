// 讀取網站內建的範本清單與設定檔（public/templates/）

import { ref } from 'vue'
import type { TemplateManifest } from '../model/booklet'

const base = `${import.meta.env.BASE_URL}templates/`

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`無法讀取範本（${res.status}）`)
  return res.json() as Promise<T>
}

const templates = ref<TemplateManifest[]>([])
const loadError = ref('')
let loading: Promise<void> | null = null

function loadTemplates(): Promise<void> {
  loading ??= (async () => {
    try {
      const ids = await fetchJson<string[]>(`${base}index.json`)
      templates.value = await Promise.all(ids.map((id) => fetchJson<TemplateManifest>(`${base}${id}.json`)))
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : String(e)
      loading = null // 下次再試
    }
  })()
  return loading
}

/** 取得範本設定檔；找不到時（例如存檔裡的範本已下架）用第一份範本 */
async function getManifest(id: string): Promise<TemplateManifest> {
  await loadTemplates()
  const found = templates.value.find((t) => t.id === id) ?? templates.value[0]
  if (!found) throw new Error(loadError.value || '找不到範本')
  return found
}

async function getTemplateFile(manifest: TemplateManifest): Promise<ArrayBuffer> {
  const res = await fetch(`${base}${manifest.file}`)
  if (!res.ok) throw new Error(`無法讀取範本（${res.status}）`)
  return res.arrayBuffer()
}

export function useTemplates() {
  return { templates, loadError, loadTemplates, getManifest, getTemplateFile }
}
