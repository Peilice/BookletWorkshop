// 拋棄式原型：工作台＋預覽版面。不用正式的 store，不會動到自動暫存。
import { createApp } from 'vue'
import '@fontsource/anton/latin-400.css'
import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/noto-sans-tc/900.css'
import '../styles.css'
import Prototype from './Prototype.vue'

createApp(Prototype).mount('#app')
