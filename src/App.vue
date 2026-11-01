<script setup lang="ts">
// 網站骨架：目前只有「用範例資料產生 Word」，用來確認瀏覽器裡的套版流程。表單等功能依規格書第 11 章陸續加入。
import { ref } from 'vue'
import { generateDocx } from './docx/generate'
import type { TemplateManifest } from './model/booklet'
import { osakaKyoto } from './model/sample'
import { toTemplateData } from './transform/templateData'

const busy = ref(false)
const error = ref('')

async function generateSample() {
  busy.value = true
  error.value = ''
  try {
    const base = `${import.meta.env.BASE_URL}templates/`
    const manifest: TemplateManifest = await (await fetch(`${base}classic.json`)).json()
    const template = await (await fetch(`${base}${manifest.file}`)).arrayBuffer()
    const docx = generateDocx(template, {
      data: toTemplateData(osakaKyoto, manifest),
      palette: manifest.presets[0].colors,
      fonts: Object.fromEntries(manifest.fontRoles.map((r) => [r.style, r.default])),
    })
    const url = URL.createObjectURL(
      new Blob([docx as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = '旅遊手冊_範例.docx'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main>
    <h1>旅遊手冊工坊</h1>
    <p>網站建置中。目前可以用範例資料產生一份 Word 手冊，確認套版功能正常。</p>
    <button type="button" :disabled="busy" @click="generateSample">
      {{ busy ? '產生中…' : '用範例資料產生 Word' }}
    </button>
    <p v-if="error" role="alert">產生失敗：{{ error }}</p>
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: 'Microsoft JhengHei', sans-serif;
  background: #fff;
  color: #222;
}

main {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 16px;
}
</style>
