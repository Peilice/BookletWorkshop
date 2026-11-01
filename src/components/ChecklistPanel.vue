<script setup lang="ts">
import { computed } from 'vue'
import { CHECKLIST_CATEGORIES, type ChecklistCategory } from '../model/booklet'
import { useBookletStore } from '../store/booklet'

const { booklet } = useBookletStore()

// 依分類分組顯示；存檔裡仍是一個清單，記錄每項的原始位置方便刪除
const groups = computed(() =>
  CHECKLIST_CATEGORIES.map((c) => ({
    ...c,
    items: booklet.value.checklist.map((item, index) => ({ item, index })).filter((x) => x.item.category === c.key),
  })),
)

function add(category: ChecklistCategory) {
  booklet.value.checklist.push({ category, item: '' })
}
</script>

<template>
  <section>
    <div class="panel-intro">
      <h2>自訂檢查項目</h2>
      <p class="hint">
        範本裡已經印好常用的檢查項目，這裡只填要另外加的。項目會先填進該分類的空白 □ 格，不夠才加列；剩下的空白格保留給你手寫。
      </p>
    </div>

    <div class="groups">
      <div v-for="g in groups" :key="g.key" class="card">
        <h3>{{ g.label }}</h3>
        <p v-if="g.items.length === 0" class="hint">沒有自訂項目。</p>
        <div v-for="x in g.items" :key="x.index" class="row">
          <span aria-hidden="true">□</span>
          <input v-model="x.item.item" :aria-label="`${g.label}的項目`" />
          <button type="button" class="icon danger" :aria-label="`刪除${x.item.item || '這個項目'}`" @click="booklet.checklist.splice(x.index, 1)">
            刪除
          </button>
        </div>
        <div>
          <button type="button" class="add" @click="add(g.key)">＋ 新增項目</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.groups {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.groups h3 {
  font-size: 16px;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
