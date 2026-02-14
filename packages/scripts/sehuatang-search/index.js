import { api, removeAd, getUrl } from 'tm-utils'

/** 全局变量 */
const filterSections = ['求片问答悬赏区', 'AI专区'] // 需要过滤掉的板块
let searchResultEls = [] // 搜索结果元素列表
let url = getUrl() // 获取URL：origin, pathname, search, searches

// #region 主方法 -------------------------------------------------------

export async function main(config = {}) {
  // 1. 初始化配置
  if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
  api.initConfig({ baseUrl: config.BASE_API_URL })
  removeAd() // 去除广告

  // 2. 执行搜索
  execSearch() // 根据 URL 参数执行搜索

  // 3. 高亮/过滤搜索结果
  searchResultEls = getSearchResult() // 获取搜索结果元素列表
  filterUselessSearchResult() // 过滤无效的搜索结果
  heightSpecialResult() // 高亮破解和无码帖子

  // 4. 倒计时
  startCountdown() // 启动30秒倒计时
}

// #endregion

// #region 搜索 -------------------------------------------------------

/** [功能] 根据 URL 参数执行搜索 */
function execSearch() {
  // 判断当前页面是否是已经有搜索结果了
  const hasReults = document.querySelectorAll('.pbw .xs3').length > 0
  if (hasReults) return

  const searchInputEl = document.querySelector('#scform_srchtxt') // 搜索输入框元素
  const searchBtnEl = document.querySelector('#scform_submit') // 搜索按钮元素
  if (!searchInputEl || !searchBtnEl) return

  const keyword = url.searches.kw
  if (!keyword) return

  searchInputEl.value = keyword // 将 URL 参数中的关键词填入搜索输入框
  searchBtnEl.click() // 点击搜索按钮
}

// #endregion

// #region 搜索结果 -------------------------------------------------------

/** 获取搜索结果元素列表 */
function getSearchResult() {
  return document.querySelectorAll('.pbw')
}

/** 过滤无效的搜索结果 */
function filterUselessSearchResult() {
  searchResultEls.forEach((item) => {
    const section = item.querySelector('.xi1')?.textContent
    if (filterSections.includes(section)) {
      item.style.display = 'none'
    }
  })
}

/** 高亮破解和无码帖子 */
function heightSpecialResult() {
  searchResultEls.forEach((item) => {
    if (item.textContent.includes('无码') || item.textContent.includes('破解')) {
      item.style.backgroundColor = '#ffeebe'
    }
  })
}

// #endregion

// #region 倒计时 -------------------------------------------------------

/** 启动30秒倒计时 */
function startCountdown() {
  // 创建倒计时元素
  const countdownEl = document.createElement('div')
  countdownEl.id = 'se98-countdown'
  countdownEl.style.cssText = `
    position: fixed;
    top: 30px;
    right: 10px;
    background: linear-gradient(135deg, #afea66 0%, #f3c949 100%);
    color: white;
    padding: 5px 8px;
    border-radius: 50%;
    font-size: 16px;
    font-weight: bold;
    z-index: 99999;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    font-family: Arial, sans-serif;
  `
  document.body.appendChild(countdownEl)

  let seconds = 30
  countdownEl.textContent = `${seconds}`

  const timer = setInterval(() => {
    seconds--
    countdownEl.textContent = `${seconds}`

    if (seconds <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

// #endregion
