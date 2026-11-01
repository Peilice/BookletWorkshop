<script setup lang="ts">
// 一筆資料的「上移／下移／刪除」按鈕，直接修改傳進來的陣列
const props = defineProps<{
  list: unknown[]
  index: number
  label: string // 給螢幕閱讀器用，例如「第 2 天」
}>()

function move(offset: number) {
  const to = props.index + offset
  const [item] = props.list.splice(props.index, 1)
  props.list.splice(to, 0, item)
}
</script>

<template>
  <div class="item-actions">
    <button type="button" class="icon" :disabled="index === 0" :aria-label="`${label}上移`" title="上移" @click="move(-1)">
      ↑
    </button>
    <button
      type="button"
      class="icon"
      :disabled="index === list.length - 1"
      :aria-label="`${label}下移`"
      title="下移"
      @click="move(1)"
    >
      ↓
    </button>
    <button type="button" class="icon danger" :aria-label="`刪除${label}`" @click="list.splice(index, 1)">刪除</button>
  </div>
</template>

<style scoped>
.item-actions {
  display: flex;
  gap: 4px;
}
</style>
