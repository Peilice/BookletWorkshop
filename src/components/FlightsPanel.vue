<script setup lang="ts">
import { newFlight } from '../model/defaults'
import { TRANSPORTS, transportOf } from '../model/transport'
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
      <h2>交通</h2>
      <p class="hint">飛機、高鐵、客運、自駕都填在這裡。沒有填任何交通時，手冊裡不會出現這一段。</p>
    </div>

    <TransitionGroup tag="div" name="row" class="rows">
      <!-- 一筆交通像一張票：上方是路線，右邊撕線後是操作按鈕；欄位名稱跟著交通方式變 -->
      <div v-for="(f, i) in booklet.flights" :key="keyOf(f)" class="row-item pass">
        <span class="seq" aria-hidden="true">{{ i + 1 }}</span>
        <div class="row-body">
          <p class="route" aria-hidden="true">
            <span>{{ f.from || transportOf(f.mode).from }}</span>
            <Icon name="route" />
            <span>{{ f.to || transportOf(f.mode).to }}</span>
            <b v-if="f.flightNo && transportOf(f.mode).number" class="flight-no">{{ f.flightNo }}</b>
          </p>
          <div class="flight-grid">
            <label class="field">
              <span>交通方式</span>
              <select v-model="f.mode">
                <option v-for="t in TRANSPORTS" :key="t.id" :value="t.id">{{ t.label }}</option>
              </select>
            </label>
            <label class="field"><span>日期</span><input v-model="f.date" type="date" /></label>
            <label v-if="transportOf(f.mode).carrier" class="field">
              <span>{{ transportOf(f.mode).carrier }}<UnusedMark field="airline" /></span><input v-model="f.airline" />
            </label>
            <label v-if="transportOf(f.mode).number" class="field">
              <span>{{ transportOf(f.mode).number }}<UnusedMark field="flightNo" /></span>
              <input v-model="f.flightNo" class="strong" :placeholder="transportOf(f.mode).numberHint" />
            </label>
            <label class="field"><span>{{ transportOf(f.mode).from }}</span><input v-model="f.from" /></label>
            <label class="field"><span>{{ transportOf(f.mode).departTime }}</span><input v-model="f.departTime" type="time" /></label>
            <label class="field"><span>{{ transportOf(f.mode).to }}</span><input v-model="f.to" /></label>
            <label class="field"><span>{{ transportOf(f.mode).arriveTime }}</span><input v-model="f.arriveTime" type="time" /></label>
          </div>
        </div>
        <ItemActions :list="booklet.flights" :index="i" :label="`交通 ${i + 1}`" />
      </div>
    </TransitionGroup>
    <EmptyArt v-if="booklet.flights.length === 0" kind="flight">還沒有交通。訂好機票、車票後，把班次和時間填進來；自己開車也可以記一筆。</EmptyArt>

    <div :class="{ 'rows-foot': booklet.flights.length }">
      <button type="button" class="add" @click="booklet.flights.push(newFlight())"><Icon name="plus" />新增交通</button>
    </div>
  </section>
</template>

<style scoped>
/* 兩行：交通方式、日期、業者、班次；出發地、出發時間、抵達地、抵達時間（自駕沒有業者、班次） */
.flight-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140px minmax(0, 1fr) 112px;
  gap: 14px 16px;
  align-items: end;
}

/* 出發地一律從第二行開頭排起 */
.flight-grid > :nth-last-child(4) {
  grid-column: 1;
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
