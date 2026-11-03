// 使用者自己的 Anthropic API key：只存在這台電腦的瀏覽器，不寫進手冊存檔

import { ref, watch } from 'vue'

const KEY = 'booklet-workshop:anthropic-key'

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

const apiKey = ref(read())

watch(apiKey, (v) => {
  try {
    if (v) localStorage.setItem(KEY, v)
    else localStorage.removeItem(KEY)
  } catch {
    // 瀏覽器禁止儲存時只在這次開啟期間有效
  }
})

// 沒設定 key 時按「AI 寫介紹」，打開設定區請使用者填
const keyPanelOpen = ref(false)

export function useAiKey() {
  return { apiKey, keyPanelOpen }
}
