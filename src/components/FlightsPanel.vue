<script setup lang="ts">
import { newFlight } from '../model/defaults'
import { useBookletStore } from '../store/booklet'
import { keyOf } from '../utils/motion'
import EmptyArt from './EmptyArt.vue'
import Icon from './Icon.vue'
import ItemActions from './ItemActions.vue'
import UnusedMark from './UnusedMark.vue'

const { booklet } = useBookletStore()
</script>

<template>
  <section>
    <div class="panel-intro">
      <h2>航班</h2>
      <p class="hint">沒有填任何航班時，手冊裡不會出現「航班資訊」。日期在手冊上會縮成「12/1」。</p>
    </div>

    <TransitionGroup tag="div" name="row" class="rows">
      <!-- 一筆航班像一張登機證：上方是航線，右邊撕線後是操作按鈕 -->
      <div v-for="(f, i) in booklet.flights" :key="keyOf(f)" class="row-item pass">
        <span class="seq" aria-hidden="true">{{ i + 1 }}</span>
        <div class="row-body">
          <p class="route" aria-hidden="true">
            <span>{{ f.from || '起飛地' }}</span>
            <Icon name="route" />
            <span>{{ f.to || '抵達地' }}</span>
            <b v-if="f.flightNo" class="flight-no">{{ f.flightNo }}</b>
          </p>
          <div class="flight-grid">
            <label class="field"><span>日期</span><input v-model="f.date" type="date" /></label>
            <label class="field wide"><span>航空公司<UnusedMark field="airline" /></span><input v-model="f.airline" /></label>
            <label class="field"><span>班機<UnusedMark field="flightNo" /></span><input v-model="f.flightNo" class="strong" placeholder="例：CI152" /></label>
            <label class="field"><span>起飛地</span><input v-model="f.from" /></label>
            <label class="field"><span>起飛時間</span><input v-model="f.departTime" type="time" /></label>
            <label class="field"><span>抵達地</span><input v-model="f.to" /></label>
            <label class="field"><span>抵達時間</span><input v-model="f.arriveTime" type="time" /></label>
          </div>
        </div>
        <ItemActions :list="booklet.flights" :index="i" :label="`航班 ${i + 1}`" />
      </div>
    </TransitionGroup>
    <EmptyArt v-if="booklet.flights.length === 0" kind="flight">還沒有航班。訂好機票後，把班機和時間填進來。</EmptyArt>

    <div :class="{ 'rows-foot': booklet.flights.length }">
      <button type="button" class="add" @click="booklet.flights.push(newFlight())"><Icon name="plus" />新增航班</button>
    </div>
  </section>
</template>

<style scoped>
/* 兩行：日期、航空公司、班機；起飛地、起飛時間、抵達地、抵達時間 */
.flight-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px minmax(0, 1fr) 112px;
  gap: 14px 16px;
  align-items: end;
}

.flight-grid .wide {
  grid-column: span 2;
}

.strong {
  font-weight: 700;
}

.route {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 900;
}

.route .icon-svg {
  width: 20px;
  height: 20px;
  color: var(--accent);
}

.flight-no {
  margin-left: auto;
  font-family: var(--font-label);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--ink-soft);
}

/* 撕線：操作按鈕前一條虛線，上下各一個半圓缺口 */
.pass > .item-actions {
  position: relative;
  align-self: stretch;
  margin: -22px 0;
  padding: 22px 0 22px 10px;
  border-left: 1.5px dashed var(--field-line);
}

.pass > .item-actions::before,
.pass > .item-actions::after {
  content: '';
  position: absolute;
  left: -7.5px;
  width: 12px;
  height: 12px;
  border: 1.5px solid var(--field-line);
  border-radius: 50%;
  background: var(--paper-texture) fixed, var(--paper);
}

.pass > .item-actions::before {
  top: -6px;
  clip-path: inset(50% 0 0 0);
}

.pass > .item-actions::after {
  bottom: -6px;
  clip-path: inset(0 0 50% 0);
}
</style>
