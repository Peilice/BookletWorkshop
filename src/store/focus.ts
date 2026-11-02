// 使用者正在填哪裡：工作台的步驟、內容區塊、每日行程的第幾天；成品預覽跟著跳到同一段

import { ref } from 'vue'
import type { TabId } from '../model/validate'

export type Step = 'content' | 'style' | 'look'
export type SectionId = Exclude<TabId, 'style'>

const step = ref<Step>('content')
const section = ref<SectionId>('flights')
const dayIndex = ref(0)

export function useFocus() {
  return { step, section, dayIndex }
}
