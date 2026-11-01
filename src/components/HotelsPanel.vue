<script setup lang="ts">
import { newHotel } from '../model/defaults'
import { useBookletStore } from '../store/booklet'
import ItemActions from './ItemActions.vue'

const { booklet } = useBookletStore()
</script>

<template>
  <section>
    <div class="panel-intro">
      <h2>飯店</h2>
      <p class="hint">房號一律留空，到當地再手寫。沒有填任何飯店時，手冊裡不會出現「飯店資訊」。</p>
    </div>

    <div class="stack">
      <p v-if="booklet.hotels.length === 0" class="empty">還沒有飯店。</p>

      <div v-for="(h, i) in booklet.hotels" :key="i" class="card">
        <div class="card-head">
          <h3>飯店 {{ i + 1 }}</h3>
          <span class="spacer" />
          <ItemActions :list="booklet.hotels" :index="i" :label="`飯店 ${i + 1}`" />
        </div>
        <label class="field"><span>飯店名稱</span><input v-model="h.name" /></label>
        <div class="two-col">
          <label class="field"><span>地址</span><input v-model="h.address" /></label>
          <label class="field"><span>電話</span><input v-model="h.phone" /></label>
        </div>
      </div>

      <div>
        <button type="button" class="add" @click="booklet.hotels.push(newHotel())">＋ 新增飯店</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.two-col {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 8px;
}
</style>
