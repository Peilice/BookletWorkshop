<script setup lang="ts">
// 清單空的時候：墨線小插圖＋一句白話，放在清單的 2px 墨線下面
defineProps<{ kind: 'flight' | 'spot' | 'hotel' | 'food' | 'info' }>()
</script>

<template>
  <div class="empty-art">
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <!-- 登機證 -->
      <template v-if="kind === 'flight'">
        <path d="M6 18h52v10a4 4 0 0 0 0 8v10H6V36a4 4 0 0 0 0-8z" />
        <path d="M44 20v24" stroke-dasharray="2 3.5" />
        <path d="M13 26h22M13 32h14M13 38h18" />
        <path d="M30 8l20-3-9 9-3-4z" />
      </template>
      <!-- 地圖釘＋虛線路線 -->
      <template v-else-if="kind === 'spot'">
        <path d="M46 26c0 9-10 18-10 18s-10-9-10-18a10 10 0 0 1 20 0z" />
        <circle cx="36" cy="26" r="3.5" />
        <path d="M12 54c8-1 12-6 20-8" stroke-dasharray="2 3.5" />
        <path d="M6 50l4 4M10 50l-4 4" />
      </template>
      <!-- 房間鑰匙＋吊牌 -->
      <template v-else-if="kind === 'hotel'">
        <circle cx="18" cy="22" r="8" />
        <circle cx="18" cy="22" r="2.5" />
        <path d="M24 28l22 22M40 44l-4 4M45 49l-4 4" />
        <path d="M40 8h16v20H40z" />
        <circle cx="48" cy="13" r="1.5" />
        <path d="M44 20h8M44 24h6" />
        <path d="M24 16c6-5 12-6 16-3" />
      </template>
      <!-- 碗＋筷子＋熱氣 -->
      <template v-else-if="kind === 'food'">
        <path d="M8 32h48c0 12-10 20-24 20S8 44 8 32z" />
        <path d="M24 56h16" />
        <path d="M20 26c-3-4 3-6 0-10M30 26c-3-4 3-6 0-10" />
        <path d="M54 6L38 28M58 9L42 29" />
      </template>
      <!-- 路標 -->
      <template v-else>
        <path d="M32 6v50M22 56h20" />
        <path d="M14 12h30l6 5-6 5H14z" />
        <path d="M50 28H20l-6 5 6 5h30z" />
      </template>
    </svg>
    <p><slot /></p>
  </div>
</template>

<style scoped>
.empty-art {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 0 24px 8px;
  color: var(--ink);
}
.empty-art p {
  margin: 0;
  max-width: 28em;
  color: var(--ink-soft);
}
</style>
