<script setup lang="ts">
import { computed, shallowRef, watchEffect } from 'vue'
import type { Day } from '../model/booklet'
import { newDay, newSpot } from '../model/defaults'
import { useBookletStore } from '../store/booklet'
import { useFormFields } from '../store/templates'
import { autoOverview, contentLength } from '../model/validate'
import { weekday } from '../transform/templateData'
import Icon from './Icon.vue'
import ItemActions from './ItemActions.vue'

const { booklet } = useBookletStore()
const { rules, has } = useFormFields()
const overviewLimit = computed(() => rules.value.overviewLimit)
const spotLimit = computed(() => rules.value.spotContentLimit)

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

const overviewText = computed(() => (activeDay.value ? activeDay.value.overview || autoOverview(activeDay.value.spots) : ''))

function addDay() {
  const days = booklet.value.days
  days.push(newDay(days.at(-1)))
  activeDay.value = days.at(-1)
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 分頁上的短日期，例如「11/3 一」 */
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return m && d ? `${m}/${d} ${weekday(iso)}` : '未填日期'
}

/** 大字日期，例如「12.02」 */
function posterDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return m && d ? `${pad(m)}.${pad(d)}` : '--.--'
}
</script>

<template>
  <section>
    <div class="panel-intro">
      <h2>每日行程</h2>
      <p class="hint">天數依排列順序自動編號，星期依日期自動計算。</p>
    </div>

    <template v-if="booklet.days.length === 0">
      <p class="empty">還沒有行程。新增第一天後，日期會自動接著往後排。</p>
      <button type="button" class="add" @click="addDay"><Icon name="plus" />新增一天</button>
    </template>

    <div v-else class="day-layout">
      <!-- 左欄：巨大的天數與日期，下方切換天數 -->
      <div class="day-poster">
        <template v-if="activeDay && activeIndex >= 0">
          <span class="day-label" aria-hidden="true">DAY</span>
          <span class="day-no" aria-hidden="true">{{ pad(activeIndex + 1) }}</span>
          <span class="day-date" aria-hidden="true">{{ posterDate(activeDay.date) }}</span>
          <span class="day-weekday">{{ weekday(activeDay.date) || '請填日期' }}</span>
        </template>

        <nav class="day-tabs" role="tablist" aria-label="每日行程">
          <button
            v-for="(d, i) in booklet.days"
            :id="`day-tab-${i}`"
            :key="i"
            type="button"
            role="tab"
            :aria-selected="i === activeIndex"
            :aria-label="`Day ${i + 1}，${shortDate(d.date)}`"
            :title="shortDate(d.date)"
            aria-controls="day-panel"
            :class="{ active: i === activeIndex }"
            @click="activeDay = d"
          >
            {{ pad(i + 1) }}
          </button>
        </nav>
        <button type="button" class="add" @click="addDay"><Icon name="plus" />新增一天</button>

        <div v-if="activeDay && activeIndex >= 0" class="day-meta">
          <label class="field date-field">
            <span>日期</span>
            <input v-model="activeDay.date" type="date" :aria-label="`Day ${activeIndex + 1} 日期`" />
          </label>
          <ItemActions :list="booklet.days" :index="activeIndex" :label="`Day ${activeIndex + 1}`" />
        </div>
      </div>

      <!-- 右欄：總覽與景點 -->
      <div
        v-if="activeDay && activeIndex >= 0"
        id="day-panel"
        role="tabpanel"
        :aria-labelledby="`day-tab-${activeIndex}`"
        class="day-form"
      >
        <div v-if="has('dayTheme') || has('departTime')" class="theme-row">
          <label v-if="has('dayTheme')" class="field">
            <span>主題</span>
            <input v-model="activeDay.theme" placeholder="例：高山老街、飛驒古川" />
          </label>
          <label v-if="has('departTime')" class="field">
            <span>出門時間（選填）</span>
            <input v-model="activeDay.departTime" type="time" />
          </label>
        </div>

        <label class="field">
          <span class="overview-label">
            每日行程總覽（選填，沒填時自動用景點串起來）
            <span v-if="overviewLimit" class="overview-count" :class="{ over: overviewText.length > overviewLimit }">
              {{ pad(overviewText.length) }} / {{ overviewLimit }}
            </span>
          </span>
          <input v-model="activeDay.overview" class="overview-input" :placeholder="autoOverview(activeDay.spots)" />
        </label>
        <p v-if="overviewLimit && overviewText.length > overviewLimit" class="hint warn">
          總覽有 {{ overviewText.length }} 個字，建議在 {{ overviewLimit }} 字以內，太長可能會超出 Day 方塊。
        </p>

        <div class="spots">
          <p v-if="activeDay.spots.length === 0" class="hint spots-empty">這一天還沒有景點。</p>
          <div v-for="(s, j) in activeDay.spots" :key="j" class="row-item spot">
            <span class="seq" aria-hidden="true">{{ j + 1 }}</span>
            <div class="row-body">
              <label class="field"><span class="sr-only">景點 {{ j + 1 }}</span><input v-model="s.name" class="title-input" placeholder="景點名稱" /></label>
              <label class="field"><span class="sr-only">景點內容</span><textarea v-model="s.content" rows="2" placeholder="景點內容" /></label>
              <p v-if="spotLimit && contentLength(s.content) > spotLimit" class="hint warn">
                內容有 {{ contentLength(s.content) }} 個字，超過 {{ spotLimit }} 字會接到下一頁。
              </p>
            </div>
            <ItemActions :list="activeDay.spots" :index="j" :label="`景點 ${j + 1}`" />
          </div>
        </div>

        <div>
          <button type="button" class="add" @click="activeDay.spots.push(newSpot())"><Icon name="plus" />新增景點</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.day-layout {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 0 48px;
  border-top: 2px solid var(--ink);
  padding-top: 18px;
  align-items: start;
}

/* ---------- 左欄 ---------- */

.day-poster {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.day-label {
  font-family: var(--font-label);
  font-weight: 700;
  font-size: 20px;
  letter-spacing: 0.5em;
}

.day-no {
  font-family: var(--font-numeral);
  font-size: 220px;
  line-height: 0.84;
  margin-left: -6px;
  font-variant-numeric: tabular-nums;
}

.day-date {
  font-family: var(--font-numeral);
  font-size: 48px;
  line-height: 1;
  margin-top: 10px;
  font-variant-numeric: tabular-nums;
}

.day-weekday {
  font-size: 17px;
  font-weight: 700;
  color: var(--ink-soft);
  margin-top: 4px;
}

.day-meta {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-top: 22px;
  padding-top: 14px;
  border-top: 1px solid var(--hair);
  width: 100%;
}

.date-field {
  width: 170px;
}

/* 天數切換：Anton 數字，目前那天下方一條重點色 */
.day-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 18px;
  margin-top: 8px;
  width: 100%;
}

.day-tabs button {
  border: 0;
  padding: 0 0 2px;
  font-family: var(--font-numeral);
  font-weight: 400;
  font-size: 30px;
  line-height: 1.15;
  color: var(--ink-soft);
  border-bottom: 4px solid transparent;
  font-variant-numeric: tabular-nums;
}

.day-tabs button:hover:not(:disabled) {
  background: transparent;
  color: var(--ink);
}

.day-tabs button.active {
  color: var(--ink);
  border-bottom-color: var(--accent);
}

.day-poster > .add {
  margin-top: 8px;
}

/* ---------- 右欄 ---------- */

.day-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 26px;
}

.spot .row-body {
  gap: 6px;
}

.theme-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140px;
  gap: 16px;
}

.overview-label {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.overview-count {
  font-family: var(--font-label);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;
}

.overview-count.over {
  color: var(--warn);
}

.overview-input {
  font-family: var(--font-heading);
  font-size: 40px;
  font-weight: 900;
  line-height: 1.25;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--ink);
}

.spots {
  margin-top: 14px;
}

.spot {
  --seq-col: 48px;
  border-bottom: 0;
  border-top: 1px solid var(--hair);
}

.spots-empty {
  padding: 18px 0;
  border-top: 1px solid var(--hair);
}
</style>
