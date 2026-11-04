<script setup lang="ts">
import { computed } from 'vue'
import { nextHotel } from '../model/autofill'
import { knownPlaces } from '../model/places'
import { useBookletStore } from '../store/booklet'
import { keyOf } from '../utils/motion'
import EmptyArt from './EmptyArt.vue'
import Icon from './Icon.vue'
import ItemActions from './ItemActions.vue'
import UnusedMark from './UnusedMark.vue'

const { booklet } = useBookletStore()
const places = computed(() => knownPlaces(booklet.value))
</script>

<template>
  <section>
    <div class="panel-intro">
      <h2>住宿</h2>
      <p class="hint">房號一律留空，到當地再手寫。沒有填任何住宿時，手冊裡不會出現這一段。</p>
    </div>

    <TransitionGroup tag="div" name="row" class="rows">
      <!-- 一筆住宿像一張行李吊牌：編號上方打一個孔 -->
      <div v-for="(h, i) in booklet.hotels" :key="keyOf(h)" class="row-item tag">
        <span class="seq" aria-hidden="true">{{ i + 1 }}</span>
        <div class="row-body">
          <label class="field"><span>住宿名稱</span><input v-model="h.name" class="title-input" /></label>
          <div class="stay-row">
            <label class="field"><span>城市<UnusedMark field="hotelCity" /></span><input v-model="h.city" placeholder="例：高山" list="hotel-places" /></label>
            <label class="field"><span>入住日期<UnusedMark field="hotelStay" /></span><input v-model="h.checkIn" type="date" /></label>
            <label class="field"><span>退房日期<UnusedMark field="hotelStay" /></span><input v-model="h.checkOut" type="date" /></label>
          </div>
          <div class="two-col">
            <label class="field"><span>地址</span><input v-model="h.address" /></label>
            <label class="field"><span>電話<UnusedMark field="hotelPhone" /></span><input v-model="h.phone" type="tel" /></label>
          </div>
          <label class="field"><span>備註（選填，例如備品、洗衣服務）<UnusedMark field="hotelNote" /></span><textarea v-model="h.note" rows="2" /></label>
        </div>
        <ItemActions :list="booklet.hotels" :index="i" :label="`住宿 ${i + 1}`" />
      </div>
    </TransitionGroup>
    <EmptyArt v-if="booklet.hotels.length === 0" kind="hotel">還沒有住宿。</EmptyArt>

    <datalist id="hotel-places"><option v-for="p in places" :key="p" :value="p" /></datalist>

    <div :class="{ 'rows-foot': booklet.hotels.length }">
      <button type="button" class="add" @click="booklet.hotels.push(nextHotel(booklet))"><Icon name="plus" />新增住宿</button>
    </div>
  </section>
</template>

<style scoped>
.tag .seq {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  align-self: stretch;
  border-right: 1.5px dashed var(--hair);
}

.tag .seq::before {
  content: '';
  width: 12px;
  height: 12px;
  border: 1.5px solid var(--ink-soft);
  border-radius: 50%;
}

.two-col {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

.stay-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px 160px;
  gap: 16px;
}
</style>
