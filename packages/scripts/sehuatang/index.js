import { api, removeAd } from 'tm-utils'

/** 常量 */
const COOLDOWN_SHORT = 30 * 1000 // 冷却时间 30 秒（毫秒）
const COOLDOWN_LONG = 5 * 60 * 1000 // 冷却时间 5 分钟（毫秒）

/** [工具] 根据时段获取冷却时长（19:00-24:00 为 5 分钟，其余 30 秒） */
function getCooldownDuration() {
  const hour = new Date().getHours()
  return hour >= 19 ? COOLDOWN_LONG : COOLDOWN_SHORT
}
const STORAGE_KEY = 'search_cooldown_endtime' // localStorage Key
const SEARCH_BTN_SELECTORS = '#scbar_btn, .search-button, #scform_submit, #scform_submit' // 搜索按钮选择器

/** 全局变量 */
let countdownEl = null // 倒计时 UI 元素
let countdownTimer = null // setInterval ID

// #region 主方法 -------------------------------------------------------

export async function main(config = {}) {
  // 1. 初始化配置
  if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
  api.initConfig({ baseUrl: config.BASE_API_URL })
  removeAd() // 去除广告

  // 2. 全局搜索冷却倒计时
  createCountdownUI() // 创建倒计时 UI（默认隐藏）
  checkAndResumeCooldown() // 检查 localStorage，如有活跃冷却则恢复倒计时
  interceptSearchButton() // 拦截搜索按钮点击事件
}

// #endregion

// #region 倒计时 UI -------------------------------------------------------

/** [UI] 创建倒计时悬浮框（默认隐藏） */
function createCountdownUI() {
  countdownEl = document.createElement('div')
  countdownEl.id = 'search-cooldown-timer'
  countdownEl.style.cssText = `
    display: none;
    position: fixed;
    top: 0px;
    right: 0px;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-family: 'Arial', 'Microsoft YaHei', sans-serif;
    z-index: 99999;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    transition: opacity 0.3s ease;
    user-select: none;
  `
  document.body.appendChild(countdownEl)
}

/** [UI] 显示倒计时 UI */
function showCountdownUI(seconds) {
  if (!countdownEl) return
  countdownEl.style.display = 'block'
  countdownEl.textContent = `${seconds}s`
}

/** [UI] 隐藏倒计时 UI */
function hideCountdownUI() {
  if (!countdownEl) return
  countdownEl.style.display = 'none'
  countdownEl.textContent = ''
}

// #endregion

// #region 冷却倒计时核心逻辑 -------------------------------------------------------

/** [核心] 获取剩余冷却秒数（向上取整） */
function getRemainingSeconds() {
  const endTime = localStorage.getItem(STORAGE_KEY)
  if (!endTime) return 0
  const remaining = Math.ceil((Number(endTime) - Date.now()) / 1000)
  return remaining > 0 ? remaining : 0
}

/** [核心] 是否正在冷却中 */
function isCoolingDown() {
  return getRemainingSeconds() > 0
}

/** [核心] 页面加载时检查并恢复冷却倒计时 */
function checkAndResumeCooldown() {
  const remaining = getRemainingSeconds()
  if (remaining <= 0) return // 无活跃冷却，静默待机

  // 有活跃冷却，启动倒计时
  showCountdownUI(remaining)
  startCountdownInterval()
}

/** [核心] 写入新的冷却结束时间并启动倒计时 */
function activateCooldown() {
  console.log('保存冷却时间')
  const duration = getCooldownDuration()
  const endTime = Date.now() + duration
  localStorage.setItem(STORAGE_KEY, String(endTime))

  showCountdownUI(Math.ceil(duration / 1000))
  startCountdownInterval()
}

/** [核心] 启动 setInterval 每秒更新 UI */
function startCountdownInterval() {
  // 防止重复启动
  if (countdownTimer) clearInterval(countdownTimer)

  countdownTimer = setInterval(() => {
    const remaining = getRemainingSeconds()

    if (remaining <= 0) {
      // 冷却结束：清除定时器、隐藏 UI、清理 localStorage
      clearInterval(countdownTimer)
      countdownTimer = null
      hideCountdownUI()
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    showCountdownUI(remaining)
  }, 1000)
}

// #endregion

// #region 搜索按钮拦截 -------------------------------------------------------

/** [功能] 拦截搜索按钮，冷却期内阻止搜索 */
function interceptSearchButton() {
  const searchBtns = document.querySelectorAll(SEARCH_BTN_SELECTORS)
  if (searchBtns.length === 0) return

  searchBtns.forEach((btn) => {
    btn.addEventListener(
      'click',
      (e) => {
        if (isCoolingDown()) {
          // 冷却中：阻止搜索
          e.preventDefault()
          e.stopImmediatePropagation()
          const remaining = getRemainingSeconds()
          alert(`搜索冷却中，请等待 ${remaining} 秒后再试`)
          return false
        }

        // 未冷却：允许搜索，激活新的冷却周期
        activateCooldown()
      },
      true
    ) // 使用捕获阶段，优先拦截
  })
}

// #endregion
