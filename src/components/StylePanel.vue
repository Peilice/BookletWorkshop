<script setup lang="ts">
// 工作台第 3 步「外觀」：配色（規格書 4.4）；手冊名稱在頂列，排版風格在第 2 步選
import { computed, onMounted, ref } from 'vue'
import { effectivePalette } from '../site/fromSettings'
import type { AccentSlot, PaletteColors, TemplateManifest } from '../model/booklet'
import { lowContrastSpots, MIN_CONTRAST } from '../model/contrast'
import { useBookletStore } from '../store/booklet'
import { useTemplates } from '../store/templates'
import PhotoField from './PhotoField.vue'

const { booklet, settings } = useBookletStore()
const { templates, loadError, loadTemplates } = useTemplates()
onMounted(loadTemplates)

const manifest = computed<TemplateManifest | undefined>(
  () => templates.value.find((t) => t.id === settings.value.templateId) ?? templates.value[0],
)

// ---------- 配色 ----------

const palette = computed(() => (manifest.value ? effectivePalette(manifest.value, settings.value) : null))
const sameColor = (a: string, b: string) => a.replace('#', '').toUpperCase() === b.replace('#', '').toUpperCase()

/** 目前配色符合哪一組預設；-1 表示自訂 */
const presetIndex = computed(() => {
  const m = manifest.value
  const p = palette.value
  if (!m || !p) return 0
  return m.presets.findIndex((preset) =>
    (Object.keys(preset.colors) as (keyof PaletteColors)[]).every((k) => sameColor(preset.colors[k] ?? '', p[k] ?? '')),
  )
})

const customMode = ref(false)
const isCustom = computed(() => customMode.value || presetIndex.value === -1)

function choosePreset(i: number) {
  customMode.value = false
  settings.value.palette = i === 0 ? null : { ...manifest.value!.presets[i].colors }
}

function chooseCustom() {
  customMode.value = true
  settings.value.palette = { ...palette.value! }
}

function setRoleColor(slots: AccentSlot[], color: string) {
  const p = { ...palette.value! }
  for (const s of slots) p[s] = color.toUpperCase()
  settings.value.palette = p
}

const warnings = computed(() => (manifest.value && palette.value ? lowContrastSpots(manifest.value, palette.value) : []))

</script>

<template>
  <section class="style-panel">
    <p v-if="loadError" class="hint warn" role="alert">{{ loadError }}</p>

    <!-- 配色 -->
    <div v-if="manifest && palette" class="block">
      <div class="panel-intro">
        <h2>配色</h2>
        <p v-if="manifest.site" class="hint">每天一個顏色，從第一天到最後一天沿著色階漸變。選一組預設配色，或選「自訂」自己挑色階。</p>
        <p v-else class="hint">選一組預設配色，或選「自訂」自己挑{{ manifest.colorRoles.map((r) => r.label).join('、') }}。</p>
      </div>

      <div class="choices palettes" role="radiogroup" aria-label="配色">
        <label v-for="(p, i) in manifest.presets" :key="p.name" class="choice" :class="{ selected: !isCustom && presetIndex === i }">
          <input type="radio" name="palette" :checked="!isCustom && presetIndex === i" @change="choosePreset(i)" />
          <span class="choice-body">
            <strong>{{ p.name }}</strong>
            <span class="swatches" aria-hidden="true">
              <span v-for="(c, slot) in p.colors" :key="slot" class="swatch" :style="{ background: c }" />
            </span>
          </span>
        </label>
        <label class="choice" :class="{ selected: isCustom }">
          <input type="radio" name="palette" :checked="isCustom" @change="chooseCustom" />
          <span class="choice-body">
            <strong>自訂</strong>
            <span class="hint">自己挑 {{ manifest.colorRoles.length }} 個顏色</span>
          </span>
        </label>
      </div>

      <div v-if="isCustom" class="custom-colors">
        <label v-for="role in manifest.colorRoles" :key="role.label" class="field color-field">
          <span>{{ role.label }}</span>
          <span class="color-input">
            <input
              type="color"
              :value="palette[role.slots[0]]"
              @input="setRoleColor(role.slots, ($event.target as HTMLInputElement).value)"
            />
            <code>{{ palette[role.slots[0]].toUpperCase() }}</code>
          </span>
        </label>
      </div>

      <ul v-if="warnings.length" class="warnings" role="status">
        <li v-for="w in warnings" :key="w.where">
          {{ w.where }}可能看不清楚（對比 {{ w.ratio.toFixed(1) }}，建議至少 {{ MIN_CONTRAST }}），請選深一點的顏色。
        </li>
      </ul>
    </div>

    <!-- 照片：都是選填，沒放就照原本的版面 -->
    <div class="block">
      <div class="panel-intro">
        <h2>照片</h2>
        <p class="hint">全部選填。封面和封底會做成整頁大圖，底圖鋪在整本手冊的後面。景點的照片在「每日行程」每個景點下面放。</p>
      </div>
      <div class="photos">
        <PhotoField v-model="booklet.cover" kind="cover" label="封面" empty="整頁大圖，標題疊在上面；直式照片最合適" />
        <PhotoField v-model="booklet.backCover" kind="cover" label="封底" empty="手冊最後的整頁大圖" />
        <PhotoField v-model="booklet.background" kind="background" label="底圖" empty="鋪在整本手冊後面，內容會蓋一層半透明底色" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.style-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.block + .block {
  margin-top: 16px;
}

.photos {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.swatches {
  display: flex;
  gap: 0;
}

.swatch {
  width: 24px;
  height: 24px;
}

.custom-colors {
  display: flex;
  flex-wrap: wrap;
  gap: 20px 32px;
  margin-top: 20px;
}

.color-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-input input {
  width: 48px;
  height: 36px;
  padding: 2px;
  border: 1.5px solid var(--ink);
  background: var(--paper);
  cursor: pointer;
}

.color-input code {
  font-family: var(--font-label);
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.06em;
}

.warnings {
  margin: 20px 0 0;
  padding: 10px 14px 10px 30px;
  background: var(--warn-bg);
  color: var(--warn);
}

</style>
