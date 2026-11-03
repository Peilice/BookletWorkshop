<script setup lang="ts">
import { computed } from 'vue'
import { newFoodItem, newFoodPlace } from '../model/defaults'
import { knownPlaces } from '../model/places'
import { useBookletStore } from '../store/booklet'
import { keyOf } from '../utils/motion'
import AiIntro from './AiIntro.vue'
import AiKeySetting from './AiKeySetting.vue'
import EmptyArt from './EmptyArt.vue'
import Icon from './Icon.vue'
import ItemActions from './ItemActions.vue'

const { booklet } = useBookletStore()
const places = computed(() => knownPlaces(booklet.value))
</script>

<template>
  <section>
    <div class="panel-intro">
      <h2>美食特產</h2>
      <p class="hint">沒有填任何項目時，手冊裡不會出現這個區塊。</p>
    </div>

    <TransitionGroup tag="div" name="row" class="rows">
      <div v-for="(p, i) in booklet.foods" :key="keyOf(p)" class="row-item">
        <span class="seq" aria-hidden="true">{{ i + 1 }}</span>
        <div class="row-body">
          <label class="field place"><span>地點</span><input v-model="p.place" class="title-input" placeholder="例：大阪" list="food-places" /></label>

          <TransitionGroup tag="div" name="row" class="subs">
            <div v-for="(f, j) in p.items" :key="keyOf(f)" class="sub-item">
              <span class="sub-seq" aria-hidden="true">{{ i + 1 }}-{{ j + 1 }}</span>
              <div class="sub-body">
                <label class="field"><span>名稱</span><input v-model="f.name" class="strong" /></label>
                <label class="field"><span>說明</span><textarea v-model="f.description" rows="2" /></label>
                <AiIntro v-model="f.description" :request="{ kind: 'food', name: f.name, place: p.place, title: booklet.title }" />
              </div>
              <ItemActions :list="p.items" :index="j" :label="`${f.name || `項目 ${j + 1}`}`" />
            </div>
          </TransitionGroup>

          <div>
            <button type="button" class="add" @click="p.items.push(newFoodItem())"><Icon name="plus" />新增美食或特產</button>
          </div>
        </div>
        <ItemActions :list="booklet.foods" :index="i" :label="`地點 ${p.place || i + 1}`" />
      </div>
    </TransitionGroup>
    <EmptyArt v-if="booklet.foods.length === 0" kind="food">還沒有美食特產。依地點記下想吃的和想帶回家的。</EmptyArt>

    <datalist id="food-places"><option v-for="p in places" :key="p" :value="p" /></datalist>

    <div :class="{ 'rows-foot': booklet.foods.length }">
      <button type="button" class="add" @click="booklet.foods.push(newFoodPlace())"><Icon name="plus" />新增地點</button>
    </div>

    <AiKeySetting v-if="booklet.foods.length" />
  </section>
</template>

<style scoped>
.subs {
  position: relative;
}

.place {
  max-width: 360px;
}

.strong {
  font-weight: 700;
}
</style>
