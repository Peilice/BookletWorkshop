<script setup lang="ts">
import { computed } from 'vue'
import { LUGGAGE_RULES, newInfo, newLuggageRules } from '../model/defaults'
import { useBookletStore } from '../store/booklet'
import { keyOf } from '../utils/motion'
import EmptyArt from './EmptyArt.vue'
import Icon from './Icon.vue'
import ItemActions from './ItemActions.vue'

const { booklet } = useBookletStore()

// 舊手冊沒有行李規定時，給按鈕補上預設的內容
const hasLuggageRules = computed(() => booklet.value.infos.some((i) => i.title.trim() === LUGGAGE_RULES.title))
</script>

<template>
  <section>
    <div class="panel-intro">
      <h2>旅遊資訊</h2>
      <p class="hint">可以再加其他項目，例如電壓插座、小費、緊急電話。要帶的東西請寫在「行前清單」。「行李規定」先放了常見的規定，可以照航空公司的規定修改。</p>
    </div>

    <TransitionGroup tag="div" name="row" class="rows">
      <div v-for="(info, i) in booklet.infos" :key="keyOf(info)" class="row-item">
        <span class="seq" aria-hidden="true">{{ i + 1 }}</span>
        <div class="info-body">
          <label class="field"><span>標題</span><input v-model="info.title" class="title-input" /></label>
          <label class="field"><span>內容</span><textarea v-model="info.content" :rows="Math.min(12, Math.max(3, info.content.split('\n').length))" /></label>
        </div>
        <ItemActions :list="booklet.infos" :index="i" :label="info.title || `第 ${i + 1} 項`" />
      </div>
    </TransitionGroup>
    <EmptyArt v-if="booklet.infos.length === 0" kind="info">還沒有旅遊資訊。交通、換錢、網路這類小事都可以寫在這裡。</EmptyArt>

    <div :class="{ 'rows-foot': booklet.infos.length }">
      <button type="button" class="add" @click="booklet.infos.push(newInfo())"><Icon name="plus" />新增項目</button>
      <button v-if="!hasLuggageRules" type="button" class="add" @click="booklet.infos.push(newLuggageRules())"><Icon name="plus" />加入行李規定</button>
    </div>
  </section>
</template>

<style scoped>
/* 標題在上、內容在下 */
.info-body {
  display: grid;
  gap: 16px;
  min-width: 0;
}
</style>
