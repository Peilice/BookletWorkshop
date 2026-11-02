<script setup lang="ts">
import { computed } from 'vue'
import { CHECKLIST_CATEGORIES, type ChecklistCategory } from '../model/booklet'
import { useBookletStore } from '../store/booklet'
import { keyOf } from '../utils/motion'
import Icon from './Icon.vue'

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
      <div v-for="g in groups" :key="g.key" class="group">
        <h3>
          {{ g.label }}
          <span class="group-count">{{ g.items.length }}</span>
        </h3>
        <p v-if="g.items.length === 0" class="hint none">沒有自訂項目。</p>
        <TransitionGroup tag="div" name="row" class="checks">
          <div v-for="x in g.items" :key="keyOf(x.item)" class="check-row">
            <span class="box" aria-hidden="true" />
            <input v-model="x.item.item" :aria-label="`${g.label}的項目`" />
            <button type="button" class="icon danger" :aria-label="`刪除${x.item.item || '這個項目'}`" @click="booklet.checklist.splice(x.index, 1)">
              刪除
            </button>
          </div>
        </TransitionGroup>
        <div>
          <button type="button" class="add" @click="add(g.key)"><Icon name="plus" />新增項目</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 40px 48px;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-top: 2px solid var(--ink);
  padding-top: 12px;
}

.group h3 {
  font-size: 22px;
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 4px;
}

.group-count {
  font-family: var(--font-numeral);
  font-weight: 400;
  font-size: 22px;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.none {
  padding: 8px 0;
}

.checks {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 和手冊上的空白方格對應 */
.check-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.box {
  flex: none;
  width: 14px;
  height: 14px;
  border: 1.5px solid var(--ink);
}
</style>
