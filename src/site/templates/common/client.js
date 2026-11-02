// 網站範本共用的互動：行前清單、列印、離線。範本用 data-* 標出元素，不依賴各自的 class
;(function () {
  var root = document.documentElement
  root.classList.add('js')

  var $$ = function (sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel))
  }

  // ---------- 行前清單：勾選狀態存在這支手機上 ----------

  var boxes = $$('input[data-check]')
  var key = 'booklet-check:' + root.dataset.trip
  var bar = document.querySelector('[data-progress-bar]')
  var text = document.querySelector('[data-progress-text]')
  var saved = {}

  function progress() {
    var done = boxes.filter(function (b) {
      return b.checked
    }).length
    if (bar) bar.style.width = (boxes.length ? (done / boxes.length) * 100 : 0) + '%'
    if (text) {
      text.textContent = done === boxes.length ? '✓ 全部準備好了' : '已準備 ' + done + ' / ' + boxes.length
      text.parentNode.classList.toggle('done', done === boxes.length)
    }
  }

  if (boxes.length) {
    try {
      saved = JSON.parse(localStorage.getItem(key) || '{}') || {}
    } catch (e) {}
    boxes.forEach(function (b) {
      b.checked = !!saved[b.dataset.check]
      b.addEventListener('change', function () {
        saved[b.dataset.check] = b.checked
        try {
          localStorage.setItem(key, JSON.stringify(saved))
        } catch (e) {}
        progress()
      })
    })
    progress()
  }

  // ---------- 列印：收合的內容全部展開，印完恢復 ----------

  var closed = []
  window.addEventListener('beforeprint', function () {
    closed = $$('details:not([open])')
    closed.forEach(function (d) {
      d.open = true
    })
  })
  window.addEventListener('afterprint', function () {
    closed.forEach(function (d) {
      d.open = false
    })
    closed = []
  })
  $$('[data-print]').forEach(function (b) {
    b.addEventListener('click', function () {
      window.print()
    })
  })

  // ---------- 離線 ----------

  var offline = document.querySelector('[data-offline]')
  function net() {
    if (offline) offline.hidden = navigator.onLine !== false
  }
  window.addEventListener('online', net)
  window.addEventListener('offline', net)
  net()

  if (root.dataset.pwa && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(function () {})
  }
})()
