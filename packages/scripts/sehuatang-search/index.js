import { api, removeAd, getUrl } from 'tm-utils'

/** 常量（与全局脚本 sehuatang/index.js 共享） */
const COOLDOWN_SHORT = 30 * 1000 // 冷却时间 30 秒（毫秒）
const COOLDOWN_LONG = 5 * 60 * 1000 // 冷却时间 5 分钟（毫秒）
const STORAGE_KEY = 'search_cooldown_endtime' // localStorage Key

/** [工具] 根据时段获取冷却时长（19:00-24:00 为 5 分钟，其余 30 秒） */
function getCooldownDuration() {
  const hour = new Date().getHours()
  return hour >= 19 ? COOLDOWN_LONG : COOLDOWN_SHORT
}

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

  // 检查冷却状态：如果还在冷却中，则不执行搜索
  const endTime = localStorage.getItem(STORAGE_KEY)
  if (endTime && Number(endTime) > Date.now()) return

  // 写入新的冷却结束时间
  localStorage.setItem(STORAGE_KEY, String(Date.now() + getCooldownDuration()))

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
