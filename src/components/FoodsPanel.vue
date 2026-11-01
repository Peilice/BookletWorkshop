<script setup lang="ts">
import { newFoodItem, newFoodPlace } from '../model/defaults'
import { useBookletStore } from '../store/booklet'
import ItemActions from './ItemActions.vue'

const { booklet } = useBookletStore()
</script>

<template>
  <section>
    <div class="panel-intro">
      <h2>美食特產</h2>
      <p class="hint">美食和特產不分類，依地點列出。沒有填任何項目時，手冊裡不會出現這個區塊。</p>
    </div>

    <div class="stack">
      <p v-if="booklet.foods.length === 0" class="empty">還沒有美食特產。</p>

      <div v-for="(p, i) in booklet.foods" :key="i" class="card">
        <div class="card-head bottom">
          <label class="field grow"><span>地點</span><input v-model="p.place" placeholder="例：大阪" /></label>
          <ItemActions :list="booklet.foods" :index="i" :label="`地點 ${p.place || i + 1}`" />
        </div>

        <div v-for="(f, j) in p.items" :key="j" class="sub-item">
          <div class="card-head bottom">
            <label class="field grow"><span>名稱</span><input v-model="f.name" /></label>
            <ItemActions :list="p.items" :index="j" :label="`${f.name || `項目 ${j + 1}`}`" />
          </div>
          <label class="field"><span>說明</span><textarea v-model="f.description" rows="2" /></label>
        </div>

        <div>
          <button type="button" class="add" @click="p.items.push(newFoodItem())">＋ 新增美食或特產</button>
        </div>
      </div>

      <div>
        <button type="button" class="add" @click="booklet.foods.push(newFoodPlace())">＋ 新增地點</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.card-head.bottom {
  align-items: flex-end;
}

.field.grow {
  flex: 1;
}
</style>
