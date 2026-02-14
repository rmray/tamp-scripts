import { createElement, api } from 'tm-utils'

/** 全局变量 */

// 网络请求
let bookmarks = [] // 书签列表
let bannedIdols = [] // Ban 列表
let favoriteIdols = [] // Fav 列表

let listEls = [] // 目录列表元素
let bannedEls = [] // 屏蔽的元素列表

// #region 主方法 -------------------------------------------------------

export async function main(config = {}) {
  // 1. 初始化配置
  if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
  api.initConfig({ baseUrl: config.BASE_API_URL })

  // 2. 网络请求
  await fetchBookmarks() // 请求书签列表数据
  await fetchBannedIdols() // 请求 Ban 列表数据
  await fetchFavoriteIdols() // 请求 Fav 列表数据

  // 3. 过滤列表
  listEls = getListEl() // 获取目录列表
  listEls = filterBannedIdols() // 过滤屏蔽女优，并隐藏列表
  listEls = filterSignStartWithNumber() // 过滤数字开头的番号
  await highlightMarked() // 高亮被标记过的链接
  await hightlightFavorite() // 高亮被标记为喜欢的链接

  // 4. 批量打开链接
  createLink() // 创建批量打开链接按钮
  batchOpenLink() // 批量打开链接
}

// #endregion

// #region 网络请求 -------------------------------------------------------

/** [功能] 获取书签列表 */
async function fetchBookmarks() {
  bookmarks = await api.getCloudData('sehuatang/bookmarks')
}

/** [功能] 获取 Ban 列表 */
async function fetchBannedIdols() {
  bannedIdols = await api.getCloudData('sehuatang/bannedIdols')
}

/** [功能] 获取 Fav 列表 */
async function fetchFavoriteIdols() {
  favoriteIdols = await api.getCloudData('sehuatang/favoriteIdols')
}

// #endregion

// #region 过滤列表 -------------------------------------------------------

/** [功能] 获取目录列表元素 */
function getListEl() {
  return Array.from(document.querySelectorAll('#threadlisttableid .xst'))
}

/** [功能] 过滤目录列表元素：屏蔽黑名单女优，并隐藏列表 */
function filterBannedIdols() {
  return listEls.filter((el) => {
    const title = el.innerText
    const matched = bannedIdols.some((act) => title.includes(act))
    if (matched) {
      if (el.closest('tbody')) el.closest('tbody').style.display = 'none'
      bannedEls.push({ actress: bannedIdols.find((act) => title.includes(act)), title })
    }
    return !matched
  })
}

/** [功能] 过滤数字开头的番号 */
function filterSignStartWithNumber() {
  return listEls.filter((el) => {
    const title = el.innerText
    const matched = title.match(/^[0-9]+/)
    if (!matched) {
      return true
    } else {
      if (el.closest('tbody')) el.closest('tbody').style.display = 'none'
      bannedEls.push({ sign: matched[0], title: title })
      return false
    }
  })
}

/** [功能] 高亮被标记过的链接 */
async function highlightMarked() {
  listEls.forEach((el) => {
    const id = Number(el.href.split('-')[1])
    const isMarked = bookmarks.includes(id)
    if (isMarked) el.style.backgroundColor = '#f78b3e'
  })
}

/** [功能] 高亮被标记为喜欢的链接 */
async function hightlightFavorite() {
  listEls.forEach((el) => {
    console.log(el.innerText)
    const title = el.innerText
    const isFavorite = favoriteIdols.some((idol) => title.includes(idol))
    if (isFavorite) el.style.backgroundColor = '#b5fab5'
  })
}

// #endregion

// #region 批量打开链接 -------------------------------------------------------

/** 创建批量打开链接按钮 */
function createLink() {
  const paginationEl = document.querySelector('#pgt')

  // 1. 创建按钮
  const css = `
    display: inline-block;
    padding: 0 10px;
    margin-right: 5px;
    line-height: 30px;
    border: 1px solid #ccc;
    cursor: pointer;
  `
  const frontEl = createElement({
    type: 'a',
    text: '前一半',
    cNames: ['front-half'],
    attrs: [{ name: 'href', value: 'javascript:;' }],
    css
  })
  const rearEl = createElement({
    type: 'a',
    text: '后一半',
    cNames: ['rear-half'],
    attrs: [{ name: 'href', value: 'javascript:;' }],
    css
  })
  const countEl = createElement({
    type: 'span',
    text: listEls.length,
    cNames: ['count'],
    css: `margin-right: 5px;`
  })

  // 2. 插入按钮
  paginationEl?.appendChild(frontEl)
  paginationEl?.appendChild(rearEl)
  paginationEl?.appendChild(countEl)
}

/** 批量打开链接 */
function batchOpenLink() {
  const frontEl = document.querySelector('.front-half')
  const rearEl = document.querySelector('.rear-half')

  // 1. 截取前一半和后一半的元素列表
  const size = listEls.length
  const half = size < 16 ? size : Math.floor(size / 2)
  const frontHalfEls = listEls.slice(0, half)
  const rearHalfEls = listEls.slice(half)

  // 2. 绑定点击事件，批量打开链接
  frontEl.addEventListener('click', hdlOpenLinkClick(frontHalfEls))
  rearEl.addEventListener('click', hdlOpenLinkClick(rearHalfEls))
  function hdlOpenLinkClick(els) {
    return function () {
      this.style.color = 'red'

      els.forEach((el) => {
        const href = el.href
        window.open(href)
      })
    }
  }
}

// #endregion
