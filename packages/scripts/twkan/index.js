import { api, createElement, zh2num, getUrl } from 'tm-utils'

const url = getUrl()

export async function main(config = {}) {
  // 1. 初始化配置
  if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
  api.initConfig({ baseUrl: config.BASE_API_URL })

  // console.log(url)

  if (['/bookcase', '/modules/article/bookcase.php'].includes(url.pathname)) {
    // 书架页
    GM_addStyle(`
      .count { position: absolute; left: 0; top: 0; width: 30px; height: 30px; background-color: #999; color: #fff; display: flex; align-items: center; justify-content: center; }
      .count2 { color: #00f;  }
      .count3 { color: #f00;  }
    `)
    updateMark() // 是否显示更新标记
    calcUpdateCount() // 计算更新章节数量
    setBottom() // 置底
  } else if (url.pathname.startsWith('/book/')) {
    // 目录页
    // 修改样式
    GM_addStyle(`
      #catalog > ul a:visited {
        color: red!important;
      }
      #allchapter > ul a:visited {
        color: red!important;
      }
    `)
    scrollToBottom() // 滚动到底部
  } else if (url.pathname.startsWith('/txt/')) {
    // 下载
    // 样式
    GM_addStyle(`
    .btn { width: 76px; height: 76px; background-color: #fff; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
    .downloaded { background-color: #f00; }
    .clear { background-color: #f00; }
  `)

    setTimeout(() => {
      downloadBtn() // 下载按钮
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
  const list = ['多我一个后富怎么了', '腐朽世界']

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
  const btnEl = createElement({ text: '下载', cNames: ['btn'] })
  fixedEl.prepend(btnEl)

  // 标记已下载
  // const isDownloaded = localStorage.getItem()
  btnEl.onclick = onDownload
}

function onDownload() {
  // 获取小说标题
  const title = document.querySelector('.bread > a:last-of-type').textContent
  // console.log('title: ', title)

  // 获取章节标题/内容
  const chapter = document.querySelector('.txtnav > h1').textContent
  let content = document.querySelector('.txtnav').innerHTML
  if (document.querySelector('#txtcontent0')) {
    content = document.querySelector('#txtcontent0').innerHTML
  }
  // console.log('content: ', content)

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

    .replace(/.*([台臺][湾灣]小[说説說][网網]|twkan|域名|本书由|GOOGLE搜索).*/gi, '')
    .replace(
      /[６|❻|➅|９|➈|❾|ｓ|ร|𝓼|Ş|Ⓢ|ѕ|𝓈|𝕤|ş|ⓢ|ֆ|ｈ|ђ|ʰ|ᕼ|Ⓗ|н|ħ|ɦ|ｕ|ᑌ|Ữ|ᵘ|𝔲|𝓊|υ|ย|ʊ|ｘ|𝔁|乂|𝓍|᙭|Ж|ⓧ|Ӽ|ｃ|ᑕ|ς|ⓒ|𝒸|¢|Č|匚|ᶜ|℃|ƈ|ｏ|ⓞ|Ø|☯|๏|𝔬|Ⓒ|𝐨|σ|ό|Ỗ|ᗝ|օ|ｍ|𝐦|𝐌|ᗰ|𝓂|м|ϻ|𝕞|爪|Μ|Ⓜ|ʍ|💘|🐤|🐨|😝|💙|👽]/gi,
      ''
    )

  // HTML字符串转DOM
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')
  content = doc.querySelector('body').textContent
  // console.log('firstLine', firstLine)

  const firstLine = getFirstLine(content)
  if (firstLine.trim() === chapter) {
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
  let value = localStorage.getItem(title)
  if (value) {
    // 追加
    value += chapter + '\n\n' + content + '\n\n'
    localStorage.setItem(title, value)
  } else {
    localStorage.setItem(title, chapter + '\n\n' + content + '\n\n')
  }
}

function clearBtn() {
  const fixedEl = document.querySelector('.baseScroll')

  const btnEl = createElement({ text: '清空', cNames: ['btn'] })

  fixedEl.append(btnEl)

  // 标记已清空
  setTimeout(() => {
    const title = document.querySelector('.bread > a:last-of-type').textContent
    // console.log('more: ', title)
    const isClear = !localStorage.getItem(title)
    if (isClear) btnEl.classList.add('clear')
  }, 400)

  btnEl.onclick = onClear
}

function onClear() {
  const title = document.querySelector('.bread > a:last-of-type').textContent
  // console.log('more: ', title)
  localStorage.removeItem(title)
  this.classList.add('clear')
}
