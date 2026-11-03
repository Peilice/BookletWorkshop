<script setup lang="ts">
// 進階：填自己的 Anthropic API key，景點、美食特產就能一鍵產生介紹
import { nextTick, ref, watch } from 'vue'
import { useAiKey } from '../store/aiKey'

const { apiKey, keyPanelOpen } = useAiKey()
const draft = ref('')
const input = ref<HTMLInputElement>()

// 按「AI 寫介紹」才打開時，直接把游標放進欄位
watch(keyPanelOpen, async (open) => {
  if (!open || apiKey.value) return
  await nextTick()
  input.value?.focus()
})

function save() {
  apiKey.value = draft.value.trim()
  draft.value = ''
}
</script>

<template>
  <details class="ai-key" :open="keyPanelOpen" @toggle="keyPanelOpen = ($event.target as HTMLDetailsElement).open">
    <summary>AI 寫介紹的設定（{{ apiKey ? '已設定 API key' : '還沒設定' }}）</summary>
    <p class="hint">
      沒有 API key 也可以按「複製提示詞」，貼到自己慣用的 AI。有 Anthropic API key 的話填在這裡，就能直接產生，費用算在你的帳號。
      key 只存在這台電腦的瀏覽器，不會寫進手冊存檔；產生時只會把名稱、地點和手冊名稱送給 Anthropic。
    </p>
    <div v-if="apiKey" class="row">
      <span class="hint">已設定（…{{ apiKey.slice(-4) }}）</span>
      <button type="button" class="icon danger" @click="apiKey = ''">清除 API key</button>
    </div>
    <form v-else class="row" @submit.prevent="save">
      <label class="field grow">
        <span>Anthropic API key</span>
        <input ref="input" v-model="draft" type="password" autocomplete="off" placeholder="sk-ant-…" />
      </label>
      <button type="submit" :disabled="!draft.trim()">儲存</button>
    </form>
  </details>
</template>

<style scoped>
.ai-key {
  border-top: 1px solid var(--hair);
  padding-top: 10px;
  margin-top: 8px;
}

summary {
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-soft);
}

.ai-key[open] summary {
  margin-bottom: 6px;
}

.ai-key .hint {
  max-width: 60ch;
}

.row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-top: 8px;
  max-width: 520px;
}
</style>
