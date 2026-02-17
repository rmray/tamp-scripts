import { api, createElement } from 'tm-utils'

// 声明元素
let rootEl = null
let userQueryEls = null // 问题请求列表
let queryContainerEl = null // 自定义问题请求列表-容器
let queryItemEls = null // 自定义问题请求列表-项
let chatHistoryEl = null // 侧边对话历史记录
let myContentEl = null // 我的内容
let scrollObserver = null // 滚动监听观察器
let currentSelectedIndex = -1 // 当前选中的列表项索引

export async function main(config = {}) {
  // 1. 初始化配置
  if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
  api.initConfig({ baseUrl: config.BASE_API_URL })

  // [功能] 创建目录容器
  createQueryContainer()

  // [功能] 标注重点按钮点击处理（事件委托，只需注册一次）
  hdlImportantClick()

  // [功能] 监听延迟加载的网页元素
  elementObserver((mutation) => {
    if (mutation.addedNodes.length) {
      // [功能] 修改设置和帮助样式
      const settingEl = document.querySelector(
        'side-nav-action-button[data-test-id="settings-and-help-button"]'
      ).parentNode
      settingEl.style.margin = '0px'

      // [功能] 修改“我的内容”样式
      myContentEl = document.querySelector('.side-nav-entry-container')
      if (myContentEl) myContentEl.style.display = 'none'

      // [功能] 生成问题目录
      userQueryEls = document.querySelectorAll('user-query .query-text')
      if (userQueryEls) genQuestionList()

      // [功能] 点击滚动可视
      queryItemEls = document.querySelectorAll('.question-item')
      if (queryItemEls) hdlScrollClick()

      // [功能] 滚动高亮当前问题
      if (userQueryEls && queryItemEls) hdlScrollHighlight()

      // [功能] 设置侧边对话历史记录 overflow 为auto
      chatHistoryEl = document.querySelector('infinite-scroller:not(.chat-history)')
      if (chatHistoryEl) setChatHistroyStyle()
    }
  })
}

/** [功能] 创建目录容器 */
function createQueryContainer() {
  queryContainerEl = createElement({
    cNames: ['query-container'],
    css: `
      position: fixed;  
      bottom: 56px; 
      left: 0px; 
      z-index: 22; 
      width: 307px; 
      max-height: 360px; 
      overflow-y: auto; 
      font-size: 12px; 
      border: 1px solid #ddd; 
      background-color: #fff;
    `
  })
  document.body.appendChild(queryContainerEl)
}

/** [功能] 监听延迟加载的网页元素 */
function elementObserver(fn) {
  rootEl = document.querySelector('#app-root')
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(fn)
  })

  observer.observe(rootEl, {
    childList: true,
    subtree: true
  })
}

/** [功能] 生成问题目录 */
function genQuestionList() {
  // 读取本地存储中的重点项
  const importantItems = getImportantItems()

  // 创建ul
  const ulEl = createElement({
    type: 'ul',
    css: 'list-style-type: none; margin: 0; padding: 0; color: #333;'
  })

  // 根据聊天内容中的提问生成li列表
  Array.from(userQueryEls).map((el, index) => {
    const queryText = el.querySelector('.query-text-line').textContent
    const text = index + 1 + '. ' + queryText
    const isImportant = importantItems.includes(queryText.trim())

    const liEl = createElement({
      type: 'li',
      cNames: ['question-item'],
      css: `
        line-height: 34px;
        display: flex;
        align-items: center;
        ${isImportant ? 'background-color: #fee2e2;' : ''}
      `
    })
    if (isImportant) liEl.dataset.important = 'true'

    const aEl = createElement({
      type: 'a',
      text,
      css: `
        padding: 0 5px;
        color: #333;
        text-decoration: none;
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: pointer;
      `
    })

    const btnEl = createElement({
      type: 'button',
      text: isImportant ? '★' : '☆',
      cNames: ['important-btn'],
      css: `
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 14px;
        color: ${isImportant ? '#ef4444' : '#999'};
        display: flex;
        align-items: center;
        justify-content: center;
      `
    })

    liEl.appendChild(aEl)
    liEl.appendChild(btnEl)
    ulEl.appendChild(liEl)
  })

  // 追加到容器中
  queryContainerEl.replaceChildren()
  queryContainerEl.appendChild(ulEl)
}

/** [功能] 更新高亮状态（共用方法） */
function updateHighlight(targetIndex) {
  // 移除旧的高亮（如果是重点项，恢复红色背景）
  if (currentSelectedIndex !== -1 && queryItemEls[currentSelectedIndex]) {
    const isImportant = queryItemEls[currentSelectedIndex].dataset.important === 'true'
    queryItemEls[currentSelectedIndex].style.backgroundColor = isImportant ? '#fee2e2' : 'unset'
  }
  // 设置新的高亮
  if (queryItemEls[targetIndex]) {
    queryItemEls[targetIndex].style.backgroundColor = '#dbeafe'
    // 将高亮项滚动到列表容器的可视区域
    queryItemEls[targetIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
  currentSelectedIndex = targetIndex
}

/** [功能] 点击滚动可视 */
function hdlScrollClick() {
  // 预先缓存问题文本，避免重复 DOM 查询
  const queryTexts = Array.from(userQueryEls).map((el) => el.querySelector('.query-text-line').textContent.trim())

  // 监听容器点击事件（使用事件委托）
  queryContainerEl.addEventListener('click', (e) => {
    // 只处理点击链接标签的情况
    if (e.target.nodeName !== 'A') return

    // 从点击的文本中提取问题内容（去掉序号）
    const clickedText = e.target.innerText.replace(/^\d+\. /, '').trim()

    // 在缓存数组中查找匹配的索引
    const targetIndex = queryTexts.indexOf(clickedText)

    // 如果没找到匹配项，直接返回
    if (targetIndex === -1) return

    // 更新高亮
    updateHighlight(targetIndex)

    // 滚动当前问题项到可视区
    if (userQueryEls[targetIndex]) {
      userQueryEls[targetIndex].scrollIntoView({ behavior: 'smooth' })
    }
  })
}

/** [功能] 滚动高亮当前问题 */
function hdlScrollHighlight() {
  // 先断开旧的观察器，避免重复监听
  if (scrollObserver) scrollObserver.disconnect()

  // 创建 IntersectionObserver，监听 user-query 元素进入可视区域
  scrollObserver = new IntersectionObserver(
    (entries) => {
      // 筛选出正在进入可视区域的元素
      const visibleEntries = entries.filter((entry) => entry.isIntersecting)
      if (visibleEntries.length === 0) return

      // 取第一个可见的 user-query 元素
      const firstVisible = visibleEntries[0]
      const allQueryEls = Array.from(userQueryEls)
      const targetIndex = allQueryEls.indexOf(firstVisible.target)

      if (targetIndex !== -1 && targetIndex !== currentSelectedIndex) {
        updateHighlight(targetIndex)
      }
    },
    {
      // 使用页面视口作为根
      root: null,
      // 只在元素顶部进入视口上半部分时触发
      rootMargin: '0px 0px -50% 0px',
      threshold: 0
    }
  )

  // 观察所有 user-query 元素
  userQueryEls.forEach((el) => scrollObserver.observe(el))
}

/** [功能] 获取存储键名（按页面路径区分） */
function getStorageKey() {
  return 'gemini-important-' + window.location.pathname
}

/** [功能] 读取本地存储中的重点项 */
function getImportantItems() {
  try {
    const items = localStorage.getItem(getStorageKey())
    return items ? JSON.parse(items) : []
  } catch {
    return []
  }
}

/** [功能] 保存重点项到本地存储 */
function saveImportantItems(items) {
  localStorage.setItem(getStorageKey(), JSON.stringify(items))
}

/** [功能] 标注重点按钮点击处理 */
function hdlImportantClick() {
  queryContainerEl.addEventListener('click', (e) => {
    // 只处理重点按钮的点击
    if (!e.target.classList.contains('important-btn')) return

    const liEl = e.target.closest('.question-item')
    if (!liEl) return

    // 获取问题原始文本（去掉序号前缀）
    const queryText = liEl
      .querySelector('a')
      .innerText.replace(/^\d+\. /, '')
      .trim()
    const importantItems = getImportantItems()
    const isCurrentlyImportant = liEl.dataset.important === 'true'

    if (isCurrentlyImportant) {
      // 取消重点标记
      const filtered = importantItems.filter((t) => t !== queryText)
      saveImportantItems(filtered)
      liEl.dataset.important = 'false'
      // 如果是当前滚动高亮项，保持蓝色；否则取消背景色
      const index = Array.from(queryItemEls).indexOf(liEl)
      liEl.style.backgroundColor = index === currentSelectedIndex ? '#dbeafe' : 'unset'
      e.target.textContent = '☆'
      e.target.style.color = '#999'
    } else {
      // 添加重点标记
      importantItems.push(queryText)
      saveImportantItems(importantItems)
      liEl.dataset.important = 'true'
      liEl.style.backgroundColor = '#fee2e2'
      e.target.textContent = '★'
      e.target.style.color = '#ef4444'
    }
  })
}

/** [功能] 设置侧边对话历史记录 overflow 为auto */
function setChatHistroyStyle() {
  chatHistoryEl.style.cssText = `
    max-height: 458px;
    overflow: auto;
    border-bottom: 1px solid red;
  `
}
