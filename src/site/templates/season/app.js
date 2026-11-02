// 和風沉穩網站的互動：分頁、選日期、勾選清單、列印、離線快取。沒有 JavaScript 時全部內容依序顯示
;(function () {
  var root = document.documentElement
  root.classList.add('js')

  var $$ = function (sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel))
  }
  var store = {
    get: function (k) {
      try {
        return localStorage.getItem(k)
      } catch (e) {
        return null
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem(k, v)
      } catch (e) {}
    },
  }

  // ---------- 分頁 ----------

  var tabs = $$('.tab')
  var panels = $$('.panel')
  var themeMeta = document.querySelector('meta[name="theme-color"]')

  function showPanel(id) {
    if (!document.getElementById(id) || !tabs.length) return
    panels.forEach(function (p) {
      p.hidden = p.id !== id
    })
    tabs.forEach(function (t) {
      if (t.dataset.tab === id) t.setAttribute('aria-current', 'page')
      else t.removeAttribute('aria-current')
    })
  }

  // ---------- 選日期：整頁換成那天的和色 ----------

  var dayBtns = $$('.daybtn')
  var days = $$('.day')
  var currentDay = 0

  function showDay(n) {
    var day = days[n - 1]
    if (!day) return
    currentDay = n
    days.forEach(function (d, i) {
      d.hidden = i !== n - 1
    })
    dayBtns.forEach(function (b, i) {
      b.setAttribute('aria-selected', String(i === n - 1))
      b.tabIndex = i === n - 1 ? 0 : -1
    })
    root.style.setProperty('--day', day.dataset.deep)
    root.style.setProperty('--day-chip', day.dataset.chip)
    root.style.setProperty('--day-soft', day.dataset.soft)
    if (themeMeta) themeMeta.content = day.dataset.deep
  }

  function pad(v) {
    return (v < 10 ? '0' : '') + v
  }
  var now = new Date()
  var todayIso = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate())
  var todayN = 0
  days.forEach(function (d, i) {
    if (d.dataset.date === todayIso) todayN = i + 1
  })
  if (todayN) dayBtns[todayN - 1].querySelector('.today').hidden = false

  function setHash(h) {
    try {
      history.replaceState(null, '', '#' + h)
    } catch (e) {}
  }

  function route() {
    var h = location.hash.slice(1)
    var m = /^day-(\d+)$/.exec(h)
    if (m && days[m[1] - 1]) {
      showPanel('trip')
      showDay(Number(m[1]))
      return
    }
    showPanel(h && document.getElementById(h) && h !== 'main' ? h : 'trip')
    if (!currentDay) showDay(todayN || 1)
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function (e) {
      e.preventDefault()
      showPanel(t.dataset.tab)
      setHash(t.dataset.tab)
      window.scrollTo(0, 0)
    })
  })

  dayBtns.forEach(function (b, i) {
    b.addEventListener('click', function () {
      showDay(i + 1)
      setHash('day-' + (i + 1))
    })
    // 方向鍵在日期之間移動
    b.addEventListener('keydown', function (e) {
      var to = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1
      if (to < 0 || to >= dayBtns.length) return
      e.preventDefault()
      dayBtns[to].focus()
      dayBtns[to].click()
    })
  })

  window.addEventListener('hashchange', route)
  route()
  // 網址帶 #day-3 之類打開時，瀏覽器會捲到那一天；改回從頂端開始，日期色階才看得到
  if (location.hash) window.scrollTo(0, 0)

  // ---------- 行前清單：勾選狀態存在這支手機上 ----------

  var boxes = $$('.check-group input')
  var key = 'booklet-check:' + root.dataset.trip
  var bar = document.querySelector('.progress .bar span')
  var text = document.querySelector('.progress-text')

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
    var saved = {}
    try {
      saved = JSON.parse(store.get(key) || '{}') || {}
    } catch (e) {}
    boxes.forEach(function (b) {
      b.checked = !!saved[b.dataset.key]
      b.addEventListener('change', function () {
        saved[b.dataset.key] = b.checked
        store.set(key, JSON.stringify(saved))
        progress()
      })
    })
    progress()
  }

  // ---------- 列印：景點介紹全部展開，印完恢復 ----------

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
  $$('.print-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      window.print()
    })
  })

  // ---------- 離線 ----------

  var offline = document.querySelector('.offline')
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
