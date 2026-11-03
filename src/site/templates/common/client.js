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

  // ---------- 出發倒數、今天 ----------

  function pad(v) {
    return (v < 10 ? '0' : '') + v
  }
  var now = new Date()
  var today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate())
  // 每天的區塊用 data-day-date 標日期
  var todayBlock = document.querySelector('[data-day-date="' + today + '"]')
  if (todayBlock) {
    $$('[data-day-date="' + today + '"] [data-today-tag]').forEach(function (t) {
      t.hidden = false
    })
  }

  var countdown = document.querySelector('[data-countdown]')
  if (countdown) {
    var start = countdown.dataset.start
    var end = countdown.dataset.end
    var between = function (a, b) {
      return Math.round((Date.parse(b) - Date.parse(a)) / 864e5)
    }
    var words = ''
    if (today < start) words = '距離出發還有 ' + between(today, start) + ' 天'
    else if (today <= end) words = start === end ? '今天出發' : '今天是旅程第 ' + (between(start, today) + 1) + ' 天'
    if (words) {
      countdown.textContent = ''
      var target = today >= start && todayBlock && todayBlock.id
      var el = document.createElement(target ? 'a' : 'span')
      if (target) el.href = '#' + todayBlock.id
      el.textContent = words
      countdown.appendChild(el)
      countdown.hidden = false
    }
  }

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
