<script setup lang="ts">
// 介面用的小圖示：16px、線寬一致，顏色跟著文字
defineProps<{ name: 'up' | 'down' | 'plus' }>()
</script>

<template>
  <svg
    class="icon-svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-if="name === 'up'" d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
    <path v-else-if="name === 'down'" d="M8 3v10M3.5 8.5 8 13l4.5-4.5" />
    <path v-else d="M8 3v10M3 8h10" />
  </svg>
</template>

<style scoped>
.icon-svg {
  flex: none;
}
</style>
