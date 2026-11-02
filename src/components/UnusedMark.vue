<script setup lang="ts">
// 欄位標籤後的小提醒：目前的排版風格不顯示這個欄位（資料仍會保留，換風格就會出現）
import type { FormField } from '../model/booklet'
import { useFormFields } from '../store/templates'

defineProps<{ field: FormField }>()
const { has } = useFormFields()
</script>

<template>
  <em v-if="!has(field)" class="unused" title="目前的排版風格不顯示這一欄，資料會保留">不顯示</em>
</template>
