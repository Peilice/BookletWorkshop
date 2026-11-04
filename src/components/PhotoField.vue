<script setup lang="ts">
// 一張選填的照片：選檔或拖進來，縮小壓縮後存成 data URL，可以換一張或移除
import { ref } from 'vue'
import type { PhotoKind } from '../model/photo'
import { compressPhoto } from '../utils/photo'

const props = defineProps<{
  modelValue: string
  kind: PhotoKind
  label: string // 給螢幕閱讀器和按鈕用，例如「景點 1 照片」或「封面」
  empty?: string // 還沒有照片時，框裡的說明
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const input = ref<HTMLInputElement>()
const busy = ref(false)
const over = ref(false)
const error = ref('')

async function load(file: File | undefined) {
  if (!file) return
  error.value = ''
  busy.value = true
  try {
    emit('update:modelValue', await compressPhoto(file, props.kind))
  } catch (e) {
    error.value = e instanceof Error ? e.message : '無法處理這張圖片。'
  } finally {
    busy.value = false
  }
}

function onPick(e: Event) {
  const el = e.target as HTMLInputElement
  void load(el.files?.[0])
  el.value = '' // 讓同一個檔案移除後還能再選
}

function onDrop(e: DragEvent) {
  over.value = false
  void load(e.dataTransfer?.files[0])
}
</script>

<template>
  <div class="photo-field" :class="{ over, has: modelValue }" @dragover.prevent="over = true" @dragleave="over = false" @drop.prevent="onDrop">
    <input ref="input" type="file" accept="image/*" class="sr-only" tabindex="-1" :aria-label="label" @change="onPick" />
    <template v-if="modelValue">
      <img :src="modelValue" alt="" class="thumb" />
      <div class="actions">
        <span class="name">{{ label }}</span>
        <button type="button" class="icon" :disabled="busy" @click="input?.click()">換一張</button>
        <button type="button" class="icon danger" :aria-label="`移除${label}`" @click="emit('update:modelValue', '')">移除</button>
      </div>
    </template>
    <button v-else type="button" class="drop" :disabled="busy" @click="input?.click()">
      <span class="plus" aria-hidden="true">＋</span>
      <span>{{ busy ? '處理中⋯' : label }}</span>
      <small>{{ empty ?? '選填，點一下選照片，或把照片拖進來' }}</small>
    </button>
    <p v-if="error" class="hint warn" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.photo-field {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.drop {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1.5px dashed var(--ink-soft);
  background: transparent;
  color: var(--ink-soft);
  font-size: 15px;
  text-align: left;
}

.drop small {
  font-size: 13px;
}

.drop:hover:not(:disabled),
.over .drop {
  border-color: var(--ink);
  color: var(--ink);
  background: transparent;
}

.plus {
  font-size: 20px;
  line-height: 1;
}

.thumb {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border: 1.5px solid var(--ink);
}

.over .thumb {
  outline: 3px dashed var(--ink);
}

.actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.name {
  font-size: 14px;
  color: var(--ink-soft);
  margin-right: 6px;
}
</style>
