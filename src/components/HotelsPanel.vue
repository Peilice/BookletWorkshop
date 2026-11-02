<script setup lang="ts">
import { newHotel } from '../model/defaults'
import { useBookletStore } from '../store/booklet'
import { useFormFields } from '../store/templates'
import Icon from './Icon.vue'
import ItemActions from './ItemActions.vue'

const { booklet } = useBookletStore()
const { has } = useFormFields()
</script>

<template>
  <section>
    <div class="panel-intro">
      <h2>飯店</h2>
      <p class="hint">房號一律留空，到當地再手寫。沒有填任何飯店時，手冊裡不會出現「飯店資訊」。</p>
    </div>

    <p v-if="booklet.hotels.length === 0" class="empty">還沒有飯店。</p>

    <div v-else class="rows">
      <div v-for="(h, i) in booklet.hotels" :key="i" class="row-item">
        <span class="seq" aria-hidden="true">{{ i + 1 }}</span>
        <div class="row-body">
          <div class="name-row" :class="{ 'with-city': has('hotelCity') }">
            <label v-if="has('hotelCity')" class="field"><span>城市</span><input v-model="h.city" placeholder="例：高山" /></label>
            <label class="field"><span>飯店名稱</span><input v-model="h.name" class="title-input" /></label>
          </div>
          <div v-if="has('hotelStay')" class="stay-row">
            <label class="field"><span>入住日期</span><input v-model="h.checkIn" type="date" /></label>
            <label class="field"><span>退房日期</span><input v-model="h.checkOut" type="date" /></label>
          </div>
          <div class="two-col" :class="{ single: !has('hotelPhone') }">
            <label class="field"><span>地址</span><input v-model="h.address" /></label>
            <label v-if="has('hotelPhone')" class="field"><span>電話</span><input v-model="h.phone" type="tel" /></label>
          </div>
        </div>
        <ItemActions :list="booklet.hotels" :index="i" :label="`飯店 ${i + 1}`" />
      </div>
    </div>

    <div :class="{ 'rows-foot': booklet.hotels.length }">
      <button type="button" class="add" @click="booklet.hotels.push(newHotel())"><Icon name="plus" />新增飯店</button>
    </div>

    <label v-if="has('hotelNote')" class="field note">
      <span>住宿備註（選填，例如備品、洗衣服務）</span>
      <textarea v-model="booklet.hotelNote" rows="2" />
    </label>
  </section>
</template>

<style scoped>
.two-col {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

.two-col.single {
  grid-template-columns: 1fr;
}

.name-row.with-city {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 16px;
  align-items: end;
}

.stay-row {
  display: grid;
  grid-template-columns: 170px 170px;
  gap: 16px;
}

.note {
  margin-top: 28px;
}
</style>
