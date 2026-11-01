<script setup lang="ts">
import { newInfo } from '../model/defaults'
import { useBookletStore } from '../store/booklet'
import ItemActions from './ItemActions.vue'

const { booklet } = useBookletStore()
</script>

<template>
  <section>
    <div class="panel-intro">
      <h2>旅遊資訊</h2>
      <p class="hint">可以再加其他項目，例如電壓插座、小費、緊急電話。「行李規定」是範本的固定內容，不用填。</p>
    </div>

    <div class="stack">
      <p v-if="booklet.infos.length === 0" class="empty">還沒有旅遊資訊。</p>

      <div v-for="(info, i) in booklet.infos" :key="i" class="card">
        <div class="card-head bottom">
          <label class="field title"><span>標題</span><input v-model="info.title" /></label>
          <span class="spacer" />
          <ItemActions :list="booklet.infos" :index="i" :label="info.title || `第 ${i + 1} 項`" />
        </div>
        <label class="field"><span>內容</span><textarea v-model="info.content" rows="3" /></label>
      </div>

      <div>
        <button type="button" class="add" @click="booklet.infos.push(newInfo())">＋ 新增項目</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.card-head.bottom {
  align-items: flex-end;
}

.field.title {
  width: 240px;
}
</style>
