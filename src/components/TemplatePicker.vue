<script setup lang="ts">
// 排版風格（範本）卡片，起始頁和「換排版風格」對話框共用
import { onMounted } from 'vue'
import { useTemplates } from '../store/templates'

defineProps<{ name: string }>()
const selected = defineModel<string>({ required: true })

const { templates, loadError, loadTemplates } = useTemplates()
onMounted(loadTemplates)
</script>

<template>
  <p v-if="loadError" class="hint warn" role="alert">{{ loadError }}</p>
  <div class="choices" role="radiogroup" aria-label="排版風格">
    <label v-for="t in templates" :key="t.id" class="choice" :class="{ selected: selected === t.id }">
      <input v-model="selected" type="radio" :name="name" :value="t.id" />
      <span class="choice-body">
        <strong>{{ t.name }}</strong>
        <span class="hint">{{ t.description }}</span>
      </span>
    </label>
  </div>
</template>
