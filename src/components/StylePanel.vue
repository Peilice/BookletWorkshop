<script setup lang="ts">
// 範本選擇、配色、字體（規格書 4.3–4.5）
import { computed, onMounted, ref } from 'vue'
import { effectiveFonts, effectivePalette } from '../docx/fromSettings'
import type { AccentSlot, PaletteColors, TemplateManifest } from '../model/booklet'
import { lowContrastSpots, MIN_CONTRAST } from '../model/contrast'
import { useBookletStore } from '../store/booklet'
import { useTemplates } from '../store/templates'

const { settings } = useBookletStore()
const { templates, loadError, loadTemplates } = useTemplates()
onMounted(loadTemplates)

const manifest = computed<TemplateManifest | undefined>(
  () => templates.value.find((t) => t.id === settings.value.templateId) ?? templates.value[0],
)

// ---------- 範本 ----------

function chooseTemplate(id: string) {
  if (id === settings.value.templateId) return
  // 不同範本的顏色、字體角色不同，換範本時回到該範本的預設
  settings.value = { templateId: id, palette: null, fonts: {} }
}

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

// ---------- 字體 ----------

const fonts = computed(() => (manifest.value ? effectiveFonts(manifest.value, settings.value) : {}))

function setFont(style: string, value: string) {
  const next = { ...settings.value.fonts }
  if (value.trim()) next[style] = value
  else delete next[style]
  settings.value.fonts = next
}

// Chrome、Edge 可以列出電腦裡已安裝的字體（Local Font Access，會先徵求同意）
const canListFonts = typeof window !== 'undefined' && 'queryLocalFonts' in window
const localFonts = ref<string[]>([])
const fontListState = ref<'idle' | 'loading' | 'done' | 'denied'>('idle')

async function listLocalFonts() {
  fontListState.value = 'loading'
  try {
    const list = await window.queryLocalFonts!()
    localFonts.value = [...new Set(list.map((f) => f.family))].sort((a, b) => a.localeCompare(b, 'zh-Hant'))
    fontListState.value = 'done'
  } catch {
    fontListState.value = 'denied'
  }
}
</script>

<template>
  <section class="style-panel">
    <p v-if="loadError" class="hint warn" role="alert">{{ loadError }}</p>

    <!-- 範本 -->
    <div class="block">
      <div class="panel-intro">
        <h2>範本</h2>
      </div>
      <div class="choices">
        <label v-for="t in templates" :key="t.id" class="choice" :class="{ selected: manifest?.id === t.id }">
          <input type="radio" name="template" :checked="manifest?.id === t.id" @change="chooseTemplate(t.id)" />
          <span class="choice-body">
            <strong>{{ t.name }}</strong>
            <span class="hint">{{ t.description }}</span>
          </span>
        </label>
      </div>
    </div>

    <!-- 配色 -->
    <div v-if="manifest && palette" class="block">
      <div class="panel-intro">
        <h2>配色</h2>
        <p class="hint">選一組預設配色，或選「自訂」挑主色、輔色、強調色。</p>
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
            <span class="hint">自己挑 3 個顏色</span>
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

    <!-- 字體 -->
    <div v-if="manifest" class="block">
      <div class="panel-intro">
        <h2>字體</h2>
        <p class="hint">
          可以輸入任何字體名稱，中文或英文名稱都可以。Word 檔只記錄字體名稱，打開檔案的電腦沒有安裝這個字體時，會換成其他字體顯示；
          需要固定外觀時，請在 Word 裡另存為 PDF（付費字體依授權可能無法嵌入）。
        </p>
      </div>

      <div v-if="canListFonts" class="font-list-action">
        <button type="button" :disabled="fontListState === 'loading'" @click="listLocalFonts">
          {{ fontListState === 'done' ? `已列出 ${localFonts.length} 個字體` : '列出電腦裡的字體' }}
        </button>
        <span v-if="fontListState === 'denied'" class="hint warn">沒有取得權限，仍可以直接輸入字體名稱。</span>
        <span v-else class="hint">瀏覽器會先詢問是否允許讀取字體清單。</span>
      </div>
      <datalist id="local-fonts">
        <option v-for="f in localFonts" :key="f" :value="f" />
      </datalist>

      <div class="font-roles">
        <div v-for="role in manifest.fontRoles" :key="role.style" class="font-role">
          <label class="field">
            <span>{{ role.label }}</span>
            <input
              :value="settings.fonts[role.style] ?? ''"
              :placeholder="`預設：${role.default}`"
              list="local-fonts"
              @input="setFont(role.style, ($event.target as HTMLInputElement).value)"
            />
          </label>
          <p class="preview" :style="{ fontFamily: `'${fonts[role.style]}', serif` }">旅遊手冊 Day 1 大阪城公園 12/1</p>
        </div>
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

.choices {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
  border-top: 2px solid var(--ink);
  padding-top: 18px;
}

.choice {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 14px 16px;
  border: 1.5px solid var(--hair);
  background: var(--paper);
  cursor: pointer;
  transition: border-color 0.15s ease-out;
}

.choice:hover {
  border-color: var(--ink-soft);
}

.choice.selected {
  border-color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--ink);
}

.choice input {
  width: auto;
  margin-top: 4px;
}

.choice-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.choice-body strong {
  font-size: 16px;
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
  gap: 32px;
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

.font-list-action {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.font-roles {
  border-top: 2px solid var(--ink);
}

.font-role {
  display: flex;
  align-items: flex-end;
  gap: 32px;
  padding: 18px 0;
  border-bottom: 1px solid var(--hair);
}

.font-role .field {
  width: 320px;
  flex: none;
}

.preview {
  margin: 0;
  font-size: 24px;
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
