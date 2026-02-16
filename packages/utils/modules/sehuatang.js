import * as api from './api'
import { createElement } from './dom'

/** 去除广告 */
export function removeAd() {
  const adSelectors = ['.show-text', '.show-text2', '.show-text4']
  adSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector)
    elements.forEach((el) => el.remove())
  })
}

/** [工具方法] 获取帖子ID */
export function getId(url) {
  return Number(url.pathname.startsWith('/forum.php') ? url.searches.tid : url.pathname.split('-')[1])
}

/**
 * [工具方法] 匹配指定内容
 * target: 可选值：idol/code/magnet/torrent
 */
export function matchContent(target) {
  let matched = null
  let match = null

  // 1. 获取帖子内容元素
  const postMsgEl = document.querySelector('#postlist div[id^="post_"] td[id^="postmessage_"]')
  const titleEl = document.querySelector('#thread_subject')
  // console.log(titleEl)
  if (!postMsgEl) return

  // 2. 根据目标类型匹配内容
  switch (target) {
    case 'idol':
      match = postMsgEl.textContent.match(/(?:【出演女优】|出演者)[:：][ \t]*([^\n\r]*)/)
      // console.log(postMsgEl.textContent)
      if (match && match[1]) {
        matched = match[1]
          .split(/&nbsp;|\s/)
          .map((name) => name.trim())
          .filter((name) => name)
      }
      break
    case 'code':
      match = titleEl.textContent.match(/^(Tokyo Hot\s+n\d+|[a-zA-Z0-9]+-[a-zA-Z0-9-]+(?<!-))/)
      // console.log(match)
      if (match && match[1]) {
        matched = match[1].trim().toUpperCase()
      }
      break
    case 'magnet':
      break
    case 'torrent':
      break
    default:
  }

  // 3. 返回匹配结果
  return matched
}

/** [工具方法] 创建分页行按钮 */
export async function createPageBtns(options = {}) {
  // 1. 获取变量
  let { type, text, values = [], textActive = text, datas = [], id = null } = options
  const btns = []
  const paginationEl = document.getElementById('pgt') // 头部分页行

  // 2. 创建书签按钮元素
  let i = 0
  do {
    let textOrigin = text
    let btn = null

    if (values.length) {
      textOrigin = textOrigin + ' ' + values[i]
    }

    if (type === 'search-mode') {
      // 3. 特殊处理 search-mode 情况
      btn = createElement({
        type: 'select',
        name: 'mode',
        cNames: [`${type}-select`, 'page-btn']
      })
      btn.innerHTML = `
        <option value="both" selected>同时搜索</option>
        <option value="sehuatang">色花堂</option>
        <option value="javbus">JavBus</option>  
      `
    } else {
      btn = createElement({
        type: type === 'button',
        text: textOrigin,
        cNames: [`${type}-btn`, 'page-btn']
      })
    }

    // 3. 特殊处理 bookmark 情况
    if (type === 'bookmark') {
      const bookmarks = datas
      // 根据 bookmarks 列表设置按钮状态
      if (bookmarks.includes(id)) {
        btn.classList.add('active')
        btn.innerHTML = textActive
      }
    }

    // 4. 将按钮添加到页面，同时返回按钮元素
    paginationEl?.append(btn)
    btns.push(btn)
    i++
  } while (i < values.length)

  return btns
}

// #region 网络请求 -------------------------------------------------------

/** [功能] 获取书签列表 */
export async function fetchBookmarks() {
  return api.getCloudDataSWR('sehuatang/bookmarks', api.getCloudData)

  // return api.getCloudData('sehuatang/bookmarks')
}

/** [功能] 获取 Ban 列表 */
export async function fetchBannedIdols() {
  return api.getCloudDataSWR('sehuatang/bannedIdols', api.getCloudData)
}

/** [功能] 获取 Fav 列表 */
export async function fetchFavoriteIdols() {
  return api.getCloudDataSWR('sehuatang/favoriteIdols', api.getCloudData)
}

// #endregion
