<script setup lang="ts">
import { computed } from 'vue'
import { hasPresetChecklistItem, mergePresetChecklist, newChecklistGroup, newChecklistItem } from '../model/defaults'
import { useBookletStore } from '../store/booklet'
import { keyOf } from '../utils/motion'
import Icon from './Icon.vue'
import ItemActions from './ItemActions.vue'

const { booklet } = useBookletStore()

// 舊手冊只有自訂項目時，給一個按鈕補上預設的清單
const hasPreset = computed(() => hasPresetChecklistItem(booklet.value.checklist))
function addPreset() {
  booklet.value.checklist = mergePresetChecklist(booklet.value.checklist)
}
</script>

<template>
  <section>
    <div class="panel-intro">
      <h2>行前清單</h2>
      <button type="button" class="add intro-add" @click="booklet.checklist.push(newChecklistGroup())"><Icon name="plus" />新增分類</button>
      <p class="hint intro-hint">
        已先列好常用的分類和項目，可以直接修改、刪除或新增。手冊上的清單就是這裡的內容，空白的項目不會出現；網站上可以逐項打勾。
      </p>
      <button v-if="!hasPreset" type="button" class="add" @click="addPreset"><Icon name="plus" />加入預設項目</button>
    </div>

    <TransitionGroup tag="div" name="row" class="groups">
      <div v-for="(g, gi) in booklet.checklist" :key="keyOf(g)" class="group">
        <div class="group-head">
          <input v-model="g.name" class="title-input" placeholder="分類名稱" :aria-label="`第 ${gi + 1} 個分類的名稱`" />
          <span class="group-count">{{ g.items.length }}</span>
          <ItemActions :list="booklet.checklist" :index="gi" :label="g.name || `第 ${gi + 1} 個分類`" />
        </div>
        <p v-if="g.items.length === 0" class="hint none">沒有項目。</p>
        <TransitionGroup tag="div" name="row" class="checks">
          <div v-for="(item, i) in g.items" :key="keyOf(item)" class="check-row">
            <input v-model="item.text" :aria-label="`${g.name || '這個分類'}的項目`" />
            <button type="button" class="icon danger" :aria-label="`刪除${item.text || '這個項目'}`" @click="g.items.splice(i, 1)">
              刪除
            </button>
          </div>
        </TransitionGroup>
        <div>
          <button type="button" class="add" @click="g.items.push(newChecklistItem())"><Icon name="plus" />新增項目</button>
        </div>
      </div>
    </TransitionGroup>
  </section>
</template>

<style scoped>
.groups {
  position: relative;
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

.group-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 4px;
}

.group-head input {
  flex: 1;
  min-width: 0;
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

.check-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 新增分類放在標題列右邊，說明文字換到下一行 */
.intro-add {
  margin-left: auto;
}

.intro-hint {
  flex-basis: 100%;
}
</style>
