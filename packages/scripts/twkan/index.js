import { api, createElement, zh2num, getUrl, showToast } from 'tm-utils'

const url = getUrl()

export async function main(config = {}) {
  // 1. 初始化配置
  if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
  api.initConfig({ baseUrl: config.BASE_API_URL })

  console.log(url, url.hostname)

  const isXsw = url.origin.includes('xsw.tw')
  const isBookcase = isXsw
    ? ['/bookcase.html', '/mybook.html'].includes(url.pathname)
    : ['/bookcase', '/modules/article/bookcase.php'].includes(url.pathname)
  const isCatalog = isXsw ? url.pathname.match(/\/book\/[^/]+\/?$/) : url.pathname.startsWith('/book/')
  const isContent = isXsw ? url.pathname.match(/\/book\/[^/]+\/[^/]+\.html$/) : url.pathname.startsWith('/txt/')

  if (isBookcase) {
    // 书架页
    if (isXsw) {
      updateXswBookcase()
    } else {
      GM_addStyle(`
        .count { position: absolute; left: 0; top: 0; width: 30px; height: 30px; background-color: #999; color: #fff; display: flex; align-items: center; justify-content: center; }
        .count2 { color: #00f;  }
        .count3 { color: #f00;  }
        .today-update { font-weight: bold !important; }
      `)
      updateMark() // 是否显示更新标记
      calcUpdateCount() // 计算更新章节数量
      setBottom() // 置底
      highlightTodayUpdates() // 高亮当天有新更新的书籍
    }
  } else if (isCatalog) {
    // 目录页
    // 修改样式
    GM_addStyle(`
      #catalog > ul a:visited {
        color: red!important;
      }
      #allchapter > ul a:visited {
        color: red!important;
      }
      .liebiao ul li a:visited {
        color: red!important;
      }
    `)
    scrollToBottom() // 滚动到底部
  } else if (isContent) {
    // 下载
    // 样式
    GM_addStyle(`
    .btn { width: 76px; height: 76px; background-color: #fff; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
    .downloaded { background-color: #f00; }
    .clear { background-color: #f00; }
    .auto-active { background-color: #0a0; color: #fff; }
  `)

    if (isXsw) {
      injectBaseScrollForXsw()
    }

    setTimeout(() => {
      autoDownloadBtn() // 自动下载按钮
      downloadBtn() // 下载按钮
      copyBtn() // 复制按钮
      clearBtn() // 清空按钮
    }, 0)
  }
}
/** 书架页 */

/** 是否显示更新标记 */
function updateMark() {
  const newnavEls = document.querySelectorAll('.newnav')

  newnavEls.forEach((el) => {
    const pEls = el.querySelectorAll('.zxzj > p')
    // console.log(pEls)
    const markText = pEls[0].querySelector('a').textContent.trim()
    const updateText = pEls[1].querySelector('a').textContent.trim()
    const labelEl = el.querySelector('h3 > a > label')

    // console.log(markText, updateText)
    if (markText === updateText && labelEl) {
      // console.log(labelEl)
      // debugger
      labelEl.style.display = 'none'
    }
  })
}

/** 计算更新章节数量 */
function calcUpdateCount() {
  const chapterEls = document.querySelectorAll('.zxzj')
  // console.log(chapterEls)
  chapterEls.forEach((el) => {
    // console.log(el)
    if (!el.querySelector('p')) return
    const markTitle = el?.querySelector('p:nth-child(1) > a').textContent.trim()
    const updateTitle = el?.querySelector('p:nth-child(2) > a').textContent.trim()
    const markNum = zh2num(markTitle)
    const updateNum = zh2num(updateTitle)

    // console.log(updateNum - markNum)
    const disCount = updateNum - markNum
    const imgBoxEl = el.parentNode.parentNode.querySelector('.imgbox')
    imgBoxEl.style.position = 'relative'
    const countEl = createElement({ cNames: ['count'], text: disCount || '' })
    if (disCount >= 50) countEl.classList.add('count3')
    else if (disCount >= 20) countEl.classList.add('count2')
    imgBoxEl.append(countEl)
  })
}

/** 置底 */
function setBottom() {
  const list = [
    '远东匹夫',
    '遠東匹夫',
    '重生九三，开局成了煤老板',
    '重生九三，開局成了煤老闆',
    '白衣卿相',
    '白衣卿相',
    '魔修也要上班打卡吗？',
    '魔修也要上班打卡嗎？',
    '万物希声',
    '萬物希聲',
    '万相塔',
    '萬相塔',
    '雙面法曹',
    '重生95流金歲月',
    '无限魔神：没流量怎么下载？',
    '無限魔神：沒流量怎麼下載？'
  ]

  const listParent = document.querySelector('.newbox>ul')
  const allListEls = document.querySelectorAll('.newbox>ul>li[id^="book"]')

  const filtedListEls = Array.from(allListEls).forEach((el) => {
    if (list.includes(el.querySelector('.newnav h3 span').textContent)) {
      el.style.border = '1px solid red'
      listParent.append(el)
    }
  })

  console.log(filtedListEls)
}

/** 高亮当天有新更新的书名和最新章节 */
function highlightTodayUpdates() {
  const today = new Date()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const todayStr = `${mm}-${dd}`

  const allListEls = document.querySelectorAll('.newbox>ul>li[id^="book"]')
  allListEls.forEach((el) => {
    const dateEl = el.querySelector('.newright > span:first-of-type')
    if (!dateEl) return

    const dateText = dateEl.textContent.trim()
    if (dateText === todayStr) {
      const latestChapterEl = el.querySelector('.zxzj p:nth-of-type(2) a')

      if (latestChapterEl) {
        latestChapterEl.classList.add('today-update')
      }
    }
  })
}

/** 新小说网站书架页兼容 (xsw.tw/mybook.html) */
function updateXswBookcase() {
  GM_addStyle(`
    .today-update { font-weight: bold !important; }
  `)

  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const todayStr = `${yyyy}-${mm}-${dd}`

  const headerRow = document.querySelector('#articlelist > ul:first-of-type > li')
  if (headerRow) {
    const newHeader = createElement({
      type: 'span',
      cNames: ['l0'],
      text: '更新',
      css: 'text-align: center; font-weight: bold;'
    })
    const firstSpan = headerRow.querySelector('span')
    if (firstSpan) {
      headerRow.insertBefore(newHeader, firstSpan)
    }
  }

  const bookRows = document.querySelectorAll('#articlelist > ul:last-of-type > li')
  bookRows.forEach((row) => {
    const l8Spans = row.querySelectorAll('span.l8')
    if (l8Spans.length < 2) return

    const latestSpan = l8Spans[0]
    const bookmarkSpan = l8Spans[1]

    // 检查并高亮当天更新
    const dateSpan = row.querySelector('span.l7')
    if (dateSpan) {
      const dateText = dateSpan.textContent.trim()
      if (dateText.startsWith(todayStr)) {
        const latestChapterEl = latestSpan.querySelector('a')
        if (latestChapterEl) {
          latestChapterEl.classList.add('today-update')
        }
      }
    }

    const latestTitle = latestSpan.querySelector('a')?.textContent?.trim() || ''
    const bookmarkTitle = bookmarkSpan.querySelector('a')?.textContent?.trim() || ''

    const latestNum = Number(zh2num(latestTitle)) || 0
    const bookmarkNum = Number(zh2num(bookmarkTitle)) || 0

    const disCount = Math.max(0, latestNum - bookmarkNum)

    const countEl = createElement({
      type: 'span',
      cNames: ['l0'],
      text: String(disCount)
    })

    countEl.style.textAlign = 'center'
    if (disCount >= 50) {
      countEl.style.color = '#f00'
      countEl.style.fontWeight = 'bold'
    } else if (disCount >= 20) {
      countEl.style.color = '#00f'
      countEl.style.fontWeight = 'bold'
    } else if (disCount > 0) {
      countEl.style.color = '#0a0'
    } else {
      countEl.style.color = '#999'
    }

    const firstSpan = row.querySelector('span')
    if (firstSpan) {
      row.insertBefore(countEl, firstSpan)
    }
  })
}

/** 目录页 */

/** 滚动到底部 */
function scrollToBottom() {
  const body = document.body
  if (!body) return

  window.scrollTo(0, body.scrollHeight)
}

/** 下载 */

/** 下载按钮 */
function downloadBtn() {
  const fixedEl = document.querySelector('.baseScroll')
  if (!fixedEl) return
  const btnEl = createElement({ text: '下载', cNames: ['btn', 'download-btn'] })
  fixedEl.prepend(btnEl)

  // 标记已下载
  // const isDownloaded = localStorage.getItem()
  btnEl.onclick = onDownload
}

function getBookTitle() {
  const isXsw = window.location.hostname.includes('xsw.tw')
  if (isXsw) {
    return document.querySelector('ul.bread-crumbs li:nth-child(3) a')?.textContent?.trim() || ''
  } else {
    return document.querySelector('.bread > a:last-of-type')?.textContent?.trim() || ''
  }
}

function injectBaseScrollForXsw() {
  if (document.querySelector('.baseScroll')) return
  const scrollEl = createElement({
    cNames: ['baseScroll'],
    css: `
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `
  })
  document.body.appendChild(scrollEl)
}

function onDownload() {
  const isXsw = window.location.hostname.includes('xsw.tw')
  const title = getBookTitle()

  // 获取章节标题/内容
  let chapter = ''
  let content = ''

  if (isXsw) {
    chapter = document.querySelector('h2')?.textContent?.trim() || ''
    // 正文使用自定义标签 <chapter id="content">，需用 #content 选择器
    const contentEl = document.querySelector('#content p') || document.querySelector('#content')
    content = contentEl?.innerHTML || ''
  } else {
    chapter = document.querySelector('.txtnav > h1')?.textContent?.trim() || ''
    content = document.querySelector('#txtcontent0')?.innerHTML || document.querySelector('.txtnav')?.innerHTML || ''
  }

  // 过滤content内容
  content = filterContent(content, chapter)

  // 保存
  saveChapter(title, chapter, content)

  // 标记已下载
  this.classList.add('downloaded')
}

function filterContent(content, chapter) {
  const reg1 = new RegExp('<div class="txtinfo hide720"><span>.*?</span> <span>.*?</span></div>')
  content = content
    .replace(/<h1.*?<\/h1>/, '')
    .replace(reg1, '')
    .replace('loadAdv(2, 0);', '')
    .replace('loadAdv(3, 0);', '')
    .replace('loadAdv(10,0);', '')
    .replace('loadAdv(7, 3);', '')
    .replace('loadAdv(7,3);', '')
    .replace('&emsp;', '')
    .replace(/\u2003/g, '')

    .replace(/.*([台臺][湾灣]小[说説說][网網]|twkan|xsw\.tw|域名|本书由|GOOGLE搜索).*/gi, '')
    .replace(
      /[６|❻|➅|９|➈|❾|ｓ|ร|𝓼|Ş|Ⓢ|ѕ|𝓈|𝕤|ş|ⓢ|ֆ|ｈ|ђ|ʰ|ᕼ|Ⓗ|н|ħ|ɦ|ｕ|ᑌ|Ữ|ᵘ|𝔲|𝓊|υ|ย|ʊ|ｘ|𝔁|乂|𝓍|᙭|Ж|ⓧ|Ӽ|ｃ|ᑕ|ς|ⓒ|𝒸|¢|Č|匚|ᶜ|℃|ƈ|ｏ|ⓞ|Ø|☯|๏|𝔬|Ⓒ|𝐨|σ|ό|Ỗ|ᗝ|օ|ｍ|𝐦|𝐌|ᗰ|𝓂|м|ϻ|𝕞|爪|Μ|Ⓜ|ʍ|💘|🐤|🐨|😝|💙|👽]/gi,
      ''
    )

  // HTML字符串转DOM
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')
  content = doc.querySelector('body').textContent

  const isXsw = window.location.hostname.includes('xsw.tw')
  if (isXsw) {
    content = content.replace(/\u00a0\u00a0\u00a0\u00a0/g, '\n\n')
    content = content.replace(/\u00a0/g, '\n\n')
    content = content.replace(/\u000b/g, '\n\n')
    content = content.replace(/\u000c/g, '\n\n')
    content = content.replace(/\u000e/g, '\n\n')
    content = content.replace(/\u000f/g, '\n\n')
    content = content.replace(/\u0002/g, '\n\n')
    content = content.replace(/\u0003/g, '\n\n')
    content = content.replace(/\u0004/g, '\n\n')
    content = content.replace(/\u0005/g, '\n\n')
    content = content.replace(/\u0006/g, '\n\n')
    content = content.replace(/\u0008/g, '\n\n')
    content = content.replace(/\u0010/g, '\n\n')
  }

  // console.log('firstLine', firstLine)

  const firstLine = getFirstLine(content)
  if (firstLine && firstLine.trim() === chapter) {
    content = content.replace(firstLine, '')
  }

  return content
}

function getFirstLine(content) {
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim()) return lines[i]
  }
}

function saveChapter(title, chapter, content) {
  const cleanChapter = chapter.replace(/^(?:\r?\n)+|(?:\r?\n)+$/g, '')
  const cleanContent = content.replace(/^(?:\r?\n)+|(?:\r?\n)+$/g, '')

  let value = localStorage.getItem(title)
  if (value) {
    // 追加
    value = value.replace(/(?:\r?\n)+$/, '') + '\n\n\n' + cleanChapter + '\n\n' + cleanContent + '\n\n'
  } else {
    value = cleanChapter + '\n\n' + cleanContent + '\n\n'
  }

  // 统一将所有连续 4 个及以上的换行符替换为 3 个换行符
  value = value.replace(/(?:\r?\n){4,}/g, '\n\n\n')

  localStorage.setItem(title, value)
}

function clearBtn() {
  const fixedEl = document.querySelector('.baseScroll')

  const btnEl = createElement({ text: '清空', cNames: ['btn'] })

  fixedEl.append(btnEl)

  // 标记已清空
  setTimeout(() => {
    const title = getBookTitle()
    // console.log('more: ', title)
    const isClear = !localStorage.getItem(title)
    if (isClear) btnEl.classList.add('clear')
  }, 400)

  btnEl.onclick = onClear
}

function onClear() {
  const title = getBookTitle()
  // console.log('more: ', title)
  localStorage.removeItem(title)
  this.classList.add('clear')
}

/** 自动下载 */

const AUTO_DOWNLOAD_KEY = 'twkan_auto_download'
const AUTO_DELAY = 2500

/** 自动下载按钮 */
function autoDownloadBtn() {
  const fixedEl = document.querySelector('.baseScroll')
  if (!fixedEl) return
  const btnEl = createElement({ text: '自动', cNames: ['btn'] })
  fixedEl.prepend(btnEl)

  // 页面加载时检测是否处于自动下载状态
  const isAuto = localStorage.getItem(AUTO_DOWNLOAD_KEY)
  if (isAuto) {
    btnEl.classList.add('auto-active')
    btnEl.textContent = '停止'
    // 页面刚加载，等待后继续自动下载
    autoDownloadCycle(btnEl, true)
  }

  btnEl.onclick = () => toggleAutoDownload(btnEl)
}

function toggleAutoDownload(btnEl) {
  const isActive = localStorage.getItem(AUTO_DOWNLOAD_KEY)
  if (isActive) {
    stopAutoDownload(btnEl)
  } else {
    localStorage.setItem(AUTO_DOWNLOAD_KEY, '1')
    btnEl.classList.add('auto-active')
    btnEl.textContent = '停止'
    // 首次点击，立即开始下载
    autoDownloadCycle(btnEl, false)
  }
}

function stopAutoDownload(btnEl) {
  localStorage.removeItem(AUTO_DOWNLOAD_KEY)
  btnEl.classList.remove('auto-active')
  btnEl.textContent = '自动'
}

function autoDownloadCycle(btnEl, needInitialDelay) {
  const execute = () => {
    if (!localStorage.getItem(AUTO_DOWNLOAD_KEY)) return

    // 下载当前章节
    const dlBtn = document.querySelector('.download-btn')
    if (dlBtn) onDownload.call(dlBtn)

    // 等待后点击下一页
    setTimeout(() => {
      if (!localStorage.getItem(AUTO_DOWNLOAD_KEY)) return

      const isXsw = window.location.hostname.includes('xsw.tw')
      const nextLink = isXsw
        ? Array.from(document.querySelectorAll('div#thumb a')).find(
            (a) => a.textContent.includes('下一章') || a.textContent.includes('下一頁')
          )
        : Array.from(document.querySelectorAll('.page1 > a')).find(
            (a) => a.textContent.includes('下一章') || a.textContent.includes('下一頁')
          )

      if (nextLink && (nextLink.textContent.includes('下一章') || nextLink.textContent.includes('下一頁'))) {
        nextLink.click()
      } else {
        // 没有下一章，停止自动下载
        stopAutoDownload(btnEl)
      }
    }, AUTO_DELAY)
  }

  if (needInitialDelay) {
    setTimeout(execute, AUTO_DELAY)
  } else {
    execute()
  }
}

function copyBtn() {
  const fixedEl = document.querySelector('.baseScroll')
  if (!fixedEl) return
  const btnEl = createElement({ text: '复制', cNames: ['btn', 'copy-btn'] })
  fixedEl.append(btnEl)
  btnEl.onclick = onCopy
}

function onCopy() {
  const title = getBookTitle()
  const value = localStorage.getItem(title)
  if (!value) {
    showToast('暂无已下载的内容', 'error')
    return
  }

  copyText(value)
    .then(() => {
      showToast('已复制到剪切板！', 'success')
    })
    .catch((err) => {
      console.error('复制失败:', err)
      showToast('复制失败，请重试', 'error')
    })
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text)
  }
  // 回退方案
  return new Promise((resolve, reject) => {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      if (success) {
        resolve()
      } else {
        reject(new Error('execCommand copy failed'))
      }
    } catch (err) {
      reject(err)
    }
  })
}
