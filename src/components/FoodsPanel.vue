<script setup lang="ts">
import { newFoodItem, newFoodPlace } from '../model/defaults'
import { useBookletStore } from '../store/booklet'
import Icon from './Icon.vue'
import ItemActions from './ItemActions.vue'

const { booklet } = useBookletStore()
</script>

<template>
  <section>
    <div class="panel-intro">
      <h2>美食特產</h2>
      <p class="hint">美食和特產不分類，依地點列出。沒有填任何項目時，手冊裡不會出現這個區塊。</p>
    </div>

    <p v-if="booklet.foods.length === 0" class="empty">還沒有美食特產。</p>

    <div v-else class="rows">
      <div v-for="(p, i) in booklet.foods" :key="i" class="row-item">
        <span class="seq" aria-hidden="true">{{ i + 1 }}</span>
        <div class="row-body">
          <label class="field place"><span>地點</span><input v-model="p.place" class="title-input" placeholder="例：大阪" /></label>

          <div>
            <div v-for="(f, j) in p.items" :key="j" class="sub-item">
              <span class="sub-seq" aria-hidden="true">{{ i + 1 }}-{{ j + 1 }}</span>
              <div class="sub-body">
                <label class="field"><span>名稱</span><input v-model="f.name" class="strong" /></label>
                <label class="field"><span>說明</span><textarea v-model="f.description" rows="2" /></label>
              </div>
              <ItemActions :list="p.items" :index="j" :label="`${f.name || `項目 ${j + 1}`}`" />
            </div>
          </div>

          <div>
            <button type="button" class="add" @click="p.items.push(newFoodItem())"><Icon name="plus" />新增美食或特產</button>
          </div>
        </div>
        <ItemActions :list="booklet.foods" :index="i" :label="`地點 ${p.place || i + 1}`" />
      </div>
    </div>

    <div :class="{ 'rows-foot': booklet.foods.length }">
      <button type="button" class="add" @click="booklet.foods.push(newFoodPlace())"><Icon name="plus" />新增地點</button>
    </div>
  </section>
</template>

<style scoped>
.place {
  max-width: 360px;
}

.strong {
  font-weight: 700;
}
</style>
