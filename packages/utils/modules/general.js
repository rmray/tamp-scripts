/** [功能] 设置公共 CSS 样式 */
export function initGeneralStyle() {
  GM_addStyle(`
    .tm-toast {
      position: fixed;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      z-index: 100001;
      transition: top 0.3s ease, opacity 0.3s ease;
      animation: tm-slide-in 0.3s ease;
    }
    .tm-toast.success {
      background: #10b981;
    }
    .tm-toast.error {
      background: #ef4444;
    }
    .tm-toast.tm-toast-out {
      animation: tm-slide-out 0.3s ease forwards;
    }
    @keyframes tm-slide-in {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes tm-slide-out {
      from { opacity: 1; transform: translateX(0); }
      to { opacity: 0; transform: translateX(100%); }
    }
  `)
}

/** 获取URL */
export function getUrl() {
  const href = window.location.href // https://fxc5.5qm5s.net/forum.php?mod=forumdisplay&fid=37&page=100
  const origin = window.location.origin // https://fxc5.5qm5s.net
  const pathname = window.location.pathname // /forum.php
  const search = window.location.search // ?mod=forumdisplay&fid=37&page=100
  const searches = Object.fromEntries(new URLSearchParams(window.location.search)) // {mod: 'forumdisplay', fid: '37', page: '100'}

  return { origin, pathname, search, searches }
}

/** 生成标题章节数 */
export function zh2num(item) {
  var zhArr = []
  item = item.trim()
  if (item.match(/第.*?章/)) {
    zhArr = item.match(/第.*?章/)
  } else if (item.match(/第.*?节/)) {
    zhArr = item.match(/第.*?节/)
  } else if (item.match(/^.*?章/)) {
    zhArr = item.match(/^.*?章/)
  } else if (item.match(/^\d+[. 、【]/)) {
    zhArr = item.match(/^\d+[. 、【]/)
  } else if (item.match(/^\d+：/)) {
    zhArr = item.match(/^\d+：/)
  } else if (item.match(/^\d+.*?/)) {
    zhArr = item.match(/^\d+.*?/)
  } else if (item.match(/(续章|第)\d+[. ]/)) {
    zhArr = item.match(/(续章|第)\d+[. ]/)
  } else {
    zhArr[0] = ''
  }
  var zh = zhArr[0]
  //console.log(zh);
  // 处理中文字符
  zh = zh.replace('第', '').replace('章', '').replace('节', '').replace('.', '').replace(' ', '').replace('续', '')
  if (parseFloat(zh).toString() !== 'NaN') {
    //console.log(zh);
    return zh
  }
  zh = zh
    .replace(/零/g, '0')
    .replace(/一/g, '1')
    .replace(/二/g, '2')
    .replace(/两/g, '2')
    .replace(/三/g, '3')
    .replace(/四/g, '4')
    .replace(/五/g, '5')
    .replace(/六/g, '6')
    .replace(/七/g, '7')
    .replace(/八/g, '8')
    .replace(/九/g, '9')
  // console.log(zh);

  // console.log( zh.indexOf('十') );
  var ss = zh.indexOf('十')
  var sb = zh.indexOf('百')
  var sq = zh.indexOf('千')

  if (ss == -1 && sb == -1 && sq == -1) {
    var zhNum = zh
  } else {
    var ge = 0,
      shi = 0,
      bai = 0,
      qian = 0
    ge = zh.slice(-1)
    if (ge == '十' || ge == '百' || ge == '千') {
      ge = 0
    }
    ge = parseInt(ge)
    // console.log('=============个位：'+ge);

    if (ss !== -1) {
      shi = parseInt(zh.slice(ss - 1, ss))
      if (shi.toString() == 'NaN') shi = 1
      // console.dir('=============十位：'+shi);
    }
    if (sb !== -1) {
      bai = parseInt(zh.slice(sb - 1, sb))
      // console.log('=============百位：'+bai);
    }

    if (sq !== -1) {
      qian = parseInt(zh.slice(sq - 1, sq))
      // console.log('=============千位：'+qian);
    }

    zhNum = ge + shi * 10 + bai * 100 + qian * 1000
    // console.log(zhNum);
  }
  return zhNum
}

/** [功能] 消息提示（支持多条堆叠） */
const _toastList = []
const TOAST_GAP = 10 // toast 之间的间距
const TOAST_TOP = 200 // 第一个 toast 距顶部的距离

function _updateToastPositions() {
  let currentTop = TOAST_TOP
  for (const t of _toastList) {
    t.style.top = currentTop + 'px'
    currentTop += t.offsetHeight + TOAST_GAP
  }
}

function _removeToast(toast) {
  toast.classList.add('tm-toast-out')
  toast.addEventListener(
    'animationend',
    () => {
      const idx = _toastList.indexOf(toast)
      if (idx > -1) _toastList.splice(idx, 1)
      toast.remove()
      _updateToastPositions()
    },
    { once: true }
  )
}

export function showToast(message, type = 'success') {
  const toast = document.createElement('div')
  toast.className = `tm-toast ${type}`
  toast.textContent = message
  document.body.appendChild(toast)

  _toastList.push(toast)
  _updateToastPositions()

  setTimeout(() => _removeToast(toast), 3000)
}

/** 测试 */
export function test() {
  console.log('test ok')
}
