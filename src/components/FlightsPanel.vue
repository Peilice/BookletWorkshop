<script setup lang="ts">
import { newFlight } from '../model/defaults'
import { useBookletStore } from '../store/booklet'
import ItemActions from './ItemActions.vue'

const { booklet } = useBookletStore()
</script>

<template>
  <section>
    <div class="panel-intro">
      <h2>航班</h2>
      <p class="hint">沒有填任何航班時，手冊裡不會出現「航班資訊」。日期在手冊上會縮成「12/1」。</p>
    </div>

    <div class="stack">
      <p v-if="booklet.flights.length === 0" class="empty">還沒有航班。</p>

      <div v-for="(f, i) in booklet.flights" :key="i" class="card">
        <div class="card-head">
          <h3>航班 {{ i + 1 }}</h3>
          <span class="spacer" />
          <ItemActions :list="booklet.flights" :index="i" :label="`航班 ${i + 1}`" />
        </div>
        <div class="flight-grid">
          <label class="field"><span>日期</span><input v-model="f.date" type="date" /></label>
          <label class="field"><span>航空公司</span><input v-model="f.airline" /></label>
          <label class="field"><span>班機</span><input v-model="f.flightNo" placeholder="例：CI152" /></label>
          <label class="field"><span>起飛地</span><input v-model="f.from" /></label>
          <label class="field"><span>起飛時間</span><input v-model="f.departTime" type="time" /></label>
          <label class="field"><span>抵達地</span><input v-model="f.to" /></label>
          <label class="field"><span>抵達時間</span><input v-model="f.arriveTime" type="time" /></label>
        </div>
      </div>

      <div>
        <button type="button" class="add" @click="booklet.flights.push(newFlight())">＋ 新增航班</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.flight-grid {
  display: grid;
  grid-template-columns: 150px 1fr 110px 1fr 110px 1fr 110px;
  gap: 8px;
}
</style>
