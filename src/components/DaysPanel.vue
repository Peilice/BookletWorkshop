<script setup lang="ts">
import { newDay, newSpot } from '../model/defaults'
import { useBookletStore } from '../store/booklet'
import { weekday } from '../transform/templateData'
import ItemActions from './ItemActions.vue'

const { booklet } = useBookletStore()

// Day 方塊空間有限（規格書 4.1）
const OVERVIEW_LIMIT = 40

function autoOverview(spots: { name: string }[]): string {
  return spots
    .map((s) => s.name.trim())
    .filter(Boolean)
    .join(' → ')
}

function addDay() {
  booklet.value.days.push(newDay(booklet.value.days.at(-1)))
}
</script>

<template>
  <section>
    <div class="panel-intro">
      <h2>每日行程</h2>
      <p class="hint">天數依排列順序自動編號，星期依日期自動計算。</p>
    </div>

    <div class="stack">
      <p v-if="booklet.days.length === 0" class="empty">還沒有行程。</p>

      <div v-for="(d, i) in booklet.days" :key="i" class="card">
        <div class="card-head">
          <h3>Day {{ i + 1 }}</h3>
          <input v-model="d.date" type="date" class="date" :aria-label="`Day ${i + 1} 日期`" />
          <span class="hint">{{ weekday(d.date) }}</span>
          <span class="spacer" />
          <ItemActions :list="booklet.days" :index="i" :label="`Day ${i + 1}`" />
        </div>

        <label class="field">
          <span>每日行程總覽（選填，沒填時自動用景點串起來）</span>
          <input v-model="d.overview" :placeholder="autoOverview(d.spots)" />
        </label>
        <p v-if="(d.overview || autoOverview(d.spots)).length > OVERVIEW_LIMIT" class="hint warn">
          總覽有 {{ (d.overview || autoOverview(d.spots)).length }} 個字，建議在 {{ OVERVIEW_LIMIT }} 字以內，太長可能會超出 Day 方塊。
        </p>

        <div v-for="(s, j) in d.spots" :key="j" class="sub-item">
          <div class="card-head">
            <label class="field grow"><span>景點 {{ j + 1 }}</span><input v-model="s.name" /></label>
            <ItemActions :list="d.spots" :index="j" :label="`景點 ${j + 1}`" />
          </div>
          <label class="field"><span>景點內容</span><textarea v-model="s.content" rows="3" /></label>
        </div>

        <div>
          <button type="button" class="add" @click="d.spots.push(newSpot())">＋ 新增景點</button>
        </div>
      </div>

      <div>
        <button type="button" class="add" @click="addDay">＋ 新增一天</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.date {
  width: 170px;
}

.field.grow {
  flex: 1;
}

.card-head:has(.field.grow) {
  align-items: flex-end;
}
</style>
