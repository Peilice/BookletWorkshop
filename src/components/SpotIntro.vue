<script setup lang="ts">
// 景點內容下方：複製提示詞貼到自己慣用的 AI，或用自己的 API key 一鍵產生介紹
import { computed, ref } from 'vue'
import type { Day, Spot } from '../model/booklet'
import { dayPlace, spotPrompt } from '../model/spotIntro'
import { useAiKey } from '../store/aiKey'
import { useBookletStore } from '../store/booklet'
import { useFormFields } from '../store/templates'
import { IntroError, writeIntro } from '../utils/claude'

const props = defineProps<{ spot: Spot; day: Day }>()

const { booklet } = useBookletStore()
const { rules } = useFormFields()
const { apiKey, keyPanelOpen } = useAiKey()

const prompt = computed(() =>
  spotPrompt({
    name: props.spot.name,
    place: dayPlace(booklet.value, props.day),
    title: booklet.value.title,
    limit: rules.value.spotContentLimit,
  }),
)
const hasName = computed(() => props.spot.name.trim() !== '')

const copied = ref(false)
const busy = ref(false)
const error = ref('')
// 景點內容已經有字時，AI 寫的先放這裡，由使用者決定要不要換
const suggestion = ref('')

async function copyPrompt() {
  error.value = ''
  try {
    await navigator.clipboard.writeText(prompt.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    error.value = '瀏覽器不讓網站複製，請改用 AI 寫介紹，或自己輸入。'
  }
}

async function generate() {
  if (!apiKey.value) {
    keyPanelOpen.value = true
    return
  }
  busy.value = true
  error.value = ''
  suggestion.value = ''
  try {
    const text = await writeIntro(apiKey.value, prompt.value)
    if (props.spot.content.trim()) suggestion.value = text
    else props.spot.content = text
  } catch (e) {
    error.value = e instanceof IntroError ? e.message : '產生失敗，請稍後再試。'
  } finally {
    busy.value = false
  }
}

function useSuggestion() {
  props.spot.content = suggestion.value
  suggestion.value = ''
}
</script>

<template>
  <div class="spot-intro">
    <div class="tools">
      <button type="button" class="icon" :disabled="!hasName" :title="hasName ? '複製後貼到 ChatGPT、Claude 等 AI' : '先填景點名稱'" @click="copyPrompt">
        {{ copied ? '已複製提示詞' : '複製提示詞' }}
      </button>
      <button type="button" class="icon" :disabled="!hasName || busy" :title="hasName ? '用自己的 API key 產生介紹' : '先填景點名稱'" @click="generate">
        {{ busy ? 'AI 寫介紹中…' : 'AI 寫介紹' }}
      </button>
      <span class="note">AI 寫的內容可能有錯，請自己看過再用</span>
    </div>
    <p v-if="error" class="hint warn" role="alert">{{ error }}</p>
    <div v-if="suggestion" class="suggestion">
      <p>{{ suggestion }}</p>
      <div class="tools">
        <button type="button" class="icon" @click="useSuggestion">換成這段</button>
        <button type="button" class="icon" @click="suggestion = ''">不要</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.spot-intro {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tools {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0 4px;
  margin-left: -7px;
}

.note {
  font-size: 12px;
  color: var(--ink-soft);
  margin-left: 6px;
}

.suggestion {
  border-left: 3px solid var(--accent);
  padding: 4px 0 2px 12px;
  background: var(--paper-2);
}

.suggestion p {
  margin: 0;
  white-space: pre-wrap;
}

.suggestion .tools {
  margin-left: -7px;
}
</style>
