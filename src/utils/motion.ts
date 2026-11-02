// 工作台的動態：列的穩定 key、滑動的重點色線
import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

const rowKeys = new WeakMap<object, number>()
let lastKey = 0

/** 列的穩定 key：上移、下移、刪除時，動畫才會跟著那一筆資料，而不是固定的位置 */
export function keyOf(item: object): number {
  let k = rowKeys.get(item)
  if (!k) rowKeys.set(item, (k = ++lastKey))
  return k
}

/**
 * 滑動的重點色線：量出容器裡 .active 按鈕的位置，寫成 CSS 變數（--x、--y、--w、--h），
 * 放在容器裡的 .slider 依這些變數定位，換選項時滑過去。
 */
export function useSlider(box: Ref<HTMLElement | undefined>, deps: () => unknown) {
  const style = ref<Record<string, string>>({ opacity: '0' })

  async function measure() {
    await nextTick()
    const el = box.value?.querySelector<HTMLElement>('.active')
    style.value = el
      ? {
          '--x': `${el.offsetLeft}px`,
          '--y': `${el.offsetTop}px`,
          '--w': `${el.offsetWidth}px`,
          '--h': `${el.offsetHeight}px`,
        }
      : { opacity: '0' }
  }

  // 字型載入、視窗縮放、換行都會改變按鈕位置
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => measure())
  watch(
    box,
    (el, old) => {
      if (old) observer?.unobserve(old)
      if (el) observer?.observe(el)
    },
    { immediate: true },
  )
  watch(deps, measure, { flush: 'post' })
  onMounted(measure)
  onBeforeUnmount(() => observer?.disconnect())

  return style
}
