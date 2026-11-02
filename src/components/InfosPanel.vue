<script setup lang="ts">
import { newInfo } from '../model/defaults'
import { useBookletStore } from '../store/booklet'
import { keyOf } from '../utils/motion'
import EmptyArt from './EmptyArt.vue'
import Icon from './Icon.vue'
import ItemActions from './ItemActions.vue'

const { booklet } = useBookletStore()
</script>

<template>
  <section>
    <div class="panel-intro">
      <h2>旅遊資訊</h2>
      <p class="hint">可以再加其他項目，例如電壓插座、小費、緊急電話。「行李規定」是範本的固定內容，不用填。</p>
    </div>

    <TransitionGroup tag="div" name="row" class="rows">
      <div v-for="(info, i) in booklet.infos" :key="keyOf(info)" class="row-item">
        <span class="seq" aria-hidden="true">{{ i + 1 }}</span>
        <div class="info-body">
          <label class="field"><span>標題</span><input v-model="info.title" class="title-input" /></label>
          <label class="field"><span>內容</span><textarea v-model="info.content" rows="3" /></label>
        </div>
        <ItemActions :list="booklet.infos" :index="i" :label="info.title || `第 ${i + 1} 項`" />
      </div>
    </TransitionGroup>
    <EmptyArt v-if="booklet.infos.length === 0" kind="info">還沒有旅遊資訊。交通、換錢、網路這類小事都可以寫在這裡。</EmptyArt>

    <div :class="{ 'rows-foot': booklet.infos.length }">
      <button type="button" class="add" @click="booklet.infos.push(newInfo())"><Icon name="plus" />新增項目</button>
    </div>
  </section>
</template>

<style scoped>
/* 標題和內容並排，像資訊表 */
.info-body {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  min-width: 0;
}
</style>
