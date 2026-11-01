<script setup lang="ts">
import { computed, shallowRef, watchEffect } from 'vue'
import type { Day } from '../model/booklet'
import { newDay, newSpot } from '../model/defaults'
import { useBookletStore } from '../store/booklet'
import { autoOverview, OVERVIEW_LIMIT } from '../model/validate'
import { weekday } from '../transform/templateData'
import ItemActions from './ItemActions.vue'

const { booklet } = useBookletStore()

// 用物件本身記住目前分頁，上移／下移後分頁會跟著那一天走
const activeDay = shallowRef<Day>()
let lastIndex = 0

// 目前那天被刪掉或換了一本手冊時，改選原本位置附近的那一天
watchEffect(() => {
  const days = booklet.value.days
  const i = activeDay.value ? days.indexOf(activeDay.value) : -1
  if (i >= 0) lastIndex = i
  else activeDay.value = days[Math.min(lastIndex, days.length - 1)]
})

const activeIndex = computed(() => (activeDay.value ? booklet.value.days.indexOf(activeDay.value) : -1))

function addDay() {
  const days = booklet.value.days
  days.push(newDay(days.at(-1)))
  activeDay.value = days.at(-1)
}

/** 分頁上的短日期，例如「11/3 一」 */
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return m && d ? `${m}/${d} ${weekday(iso)}` : '未填日期'
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

      <nav v-else class="day-tabs" role="tablist" aria-label="每日行程">
        <button
          v-for="(d, i) in booklet.days"
          :id="`day-tab-${i}`"
          :key="i"
          type="button"
          role="tab"
          :aria-selected="i === activeIndex"
          aria-controls="day-panel"
          :class="{ active: i === activeIndex }"
          @click="activeDay = d"
        >
          <strong>Day {{ i + 1 }}</strong>
          <span class="tab-date">{{ shortDate(d.date) }}</span>
        </button>
        <button type="button" class="add" @click="addDay">＋ 新增一天</button>
      </nav>

      <div
        v-if="activeDay && activeIndex >= 0"
        id="day-panel"
        role="tabpanel"
        :aria-labelledby="`day-tab-${activeIndex}`"
        class="card"
      >
        <div class="card-head">
          <h3>Day {{ activeIndex + 1 }}</h3>
          <input v-model="activeDay.date" type="date" class="date" :aria-label="`Day ${activeIndex + 1} 日期`" />
          <span class="hint">{{ weekday(activeDay.date) }}</span>
          <span class="spacer" />
          <ItemActions :list="booklet.days" :index="activeIndex" :label="`Day ${activeIndex + 1}`" />
        </div>

        <label class="field">
          <span>每日行程總覽（選填，沒填時自動用景點串起來）</span>
          <input v-model="activeDay.overview" :placeholder="autoOverview(activeDay.spots)" />
        </label>
        <p
          v-if="(activeDay.overview || autoOverview(activeDay.spots)).length > OVERVIEW_LIMIT"
          class="hint warn"
        >
          總覽有 {{ (activeDay.overview || autoOverview(activeDay.spots)).length }} 個字，建議在
          {{ OVERVIEW_LIMIT }} 字以內，太長可能會超出 Day 方塊。
        </p>

        <div v-for="(s, j) in activeDay.spots" :key="j" class="sub-item">
          <div class="card-head">
            <label class="field grow"><span>景點 {{ j + 1 }}</span><input v-model="s.name" /></label>
            <ItemActions :list="activeDay.spots" :index="j" :label="`景點 ${j + 1}`" />
          </div>
          <label class="field"><span>景點內容</span><textarea v-model="s.content" rows="3" /></label>
        </div>

        <div>
          <button type="button" class="add" @click="activeDay.spots.push(newSpot())">＋ 新增景點</button>
        </div>
      </div>

      <div v-if="booklet.days.length === 0">
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

/* 每天一個分頁，用膠囊樣式和上方的大分頁區分 */
.day-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.day-tabs button[role='tab'] {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.3;
  padding: 6px 14px;
  color: var(--c-muted);
}

.day-tabs button[role='tab'] strong {
  color: var(--c-text);
}

.day-tabs button.active {
  background: var(--c-primary);
  border-color: var(--c-primary);
  color: #fff;
}

.day-tabs button.active strong {
  color: #fff;
}

.tab-date {
  font-size: 12px;
}
</style>
