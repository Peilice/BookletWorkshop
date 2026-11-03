<script setup lang="ts">
// 工作台第 2 步：用縮圖挑排版風格。縮圖是用目前的資料（還沒填時用範例）和各風格的預設配色畫出來的
import { onMounted, ref, watch } from 'vue'
import { hiddenContent } from '../model/hiddenContent'
import type { TemplateManifest } from '../model/booklet'
import { isBlankBooklet, previewBooklet, renderPreview } from '../site/preview'
import { useBookletStore } from '../store/booklet'
import { useTemplates } from '../store/templates'

const store = useBookletStore()
const { booklet, settings } = store
const { templates, loadError, loadTemplates } = useTemplates()
onMounted(loadTemplates)

const thumbs = ref<Record<string, string>>({})
let timer: ReturnType<typeof setTimeout> | undefined
watch(
  [booklet, templates],
  () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      const b = previewBooklet(booklet.value)
      thumbs.value = Object.fromEntries(
        templates.value.filter((t) => t.site).map((t) => [t.id, renderPreview(b, t, t.presets[0].colors)]),
      )
    }, 300)
  },
  { deep: true, immediate: true },
)

// 這個風格不會顯示的內容（有填的才提醒）
const hidden = (t: TemplateManifest) => hiddenContent(booklet.value, t)

function pick(t: TemplateManifest) {
  if (t.id !== settings.value.templateId) store.changeTemplate(t.id)
}
</script>

<template>
  <section>
    <div class="panel-intro">
      <h2>排版風格</h2>
      <p class="hint">
        縮圖用{{ isBlankBooklet(booklet) ? '範例行程' : '你填的資料' }}畫出來。換風格時資料全部保留，配色換成新風格的預設配色。
      </p>
    </div>
    <p v-if="loadError" class="hint warn" role="alert">{{ loadError }}</p>

    <div class="styles" role="radiogroup" aria-label="排版風格">
      <button
        v-for="t in templates"
        :key="t.id"
        type="button"
        role="radio"
        class="style-card"
        :class="{ selected: t.id === settings.templateId }"
        :aria-checked="t.id === settings.templateId"
        @click="pick(t)"
      >
        <span class="thumb">
          <iframe v-if="thumbs[t.id]" :srcdoc="thumbs[t.id]" tabindex="-1" aria-hidden="true" scrolling="no" />
          <span v-else-if="!t.site" class="thumb-none">沒有網站版</span>
        </span>
        <strong>{{ t.name }}</strong>
        <span class="hint">{{ t.description }}</span>
        <span class="badges">
          <span :class="{ off: !t.site }">網站</span>
          <span :class="{ off: !t.site }">PDF</span>
        </span>
        <span v-if="hidden(t).length" class="hint warn">
          不會顯示：{{ hidden(t).map((h) => h.label).join('、') }}
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.styles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 20px;
  border-top: 2px solid var(--ink);
  padding-top: 18px;
}

.style-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 10px 14px;
  text-align: left;
  border: 1.5px solid var(--hair);
  background: var(--paper);
  color: var(--ink);
}

.style-card:hover:not(:disabled) {
  background: var(--paper);
  color: var(--ink);
  border-color: var(--ink-soft);
}

.style-card.selected {
  border-color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--ink);
}

.style-card strong {
  font-family: var(--font-heading);
  font-weight: 900;
  font-size: 18px;
}

.style-card .hint {
  font-weight: 400;
}

/* 縮圖也是「紙張」：放在和成品預覽一樣的深色桌面上 */
.thumb {
  display: block;
  position: relative;
  height: 300px;
  overflow: hidden;
  background: #2b2a27;
}

.thumb iframe {
  position: absolute;
  left: 50%;
  top: 14px;
  width: 390px;
  height: 900px;
  border: 0;
  transform: translateX(-50%) scale(0.5);
  transform-origin: top center;
  pointer-events: none;
  background: #fff;
}

.thumb-none {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 400;
  color: #cfcabd;
}

.badges {
  display: flex;
  gap: 6px;
  font-size: 12px;
}

.badges span {
  border: 1px solid var(--ink-soft);
  padding: 0 6px;
}

.badges .off {
  border-style: dashed;
  color: var(--placeholder);
  text-decoration: line-through;
}
</style>
