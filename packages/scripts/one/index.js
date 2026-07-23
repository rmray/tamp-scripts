import { api, getUrl } from 'tm-utils'

// 全局变量
let videoEl = null
let time = 60
let searchWidthIntervalId = null

export async function main(config = {}) {
  // 1. 初始化配置
  if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
  api.initConfig({ baseUrl: config.BASE_API_URL })

  videoEl = document.querySelector('#js-video')

  // 快进/快退
  document.addEventListener('keydown', (e) => {
    e.preventDefault()

    switch (e.key) {
      // D键：快进1分钟
      // A键：快退1分钟
      // Q键：快进5分钟
      // E键：快退5分钟
      case 'd':
        fastJump(time)
        break
      case 'a':
        fastJump(-time)
        break
      case 'e':
        fastJump(time * 5)
        break
      case 'q':
        fastJump(-time * 5)
        break
    }
  })

  // 搜索页宽度扩大
  expandSearchPageWidth()
}

/** 搜索结果页取消 .wrap-view 固定宽度 */
function expandSearchPageWidth() {
  const ensureWidthExpanded = () => {
    if (getUrl().searches.mode !== 'search') {
      clearInterval(searchWidthIntervalId)
      searchWidthIntervalId = null
      return
    }

    const frameWrapperEls = [...document.querySelectorAll('.wrap-view')]
    if (frameWrapperEls.length === 0) return

    frameWrapperEls.forEach((frameWrapperEl) => {
      const width = frameWrapperEl.style.getPropertyValue('width')
      const priority = frameWrapperEl.style.getPropertyPriority('width')

      if (width !== 'unset' || priority !== 'important') {
        frameWrapperEl.style.setProperty('width', 'unset', 'important')
      }
    })

    const isWidthExpanded = frameWrapperEls.every((frameWrapperEl) => {
      return frameWrapperEl.style.getPropertyValue('width') === 'unset' && frameWrapperEl.style.getPropertyPriority('width') === 'important'
    })

    if (isWidthExpanded) {
      clearInterval(searchWidthIntervalId)
      searchWidthIntervalId = null
    }
  }

  if (getUrl().searches.mode !== 'search' || searchWidthIntervalId !== null) return

  searchWidthIntervalId = setInterval(ensureWidthExpanded, 500)
  ensureWidthExpanded()
}

function fastJump(seconds) {
  console.log(seconds, videoEl.duration)
  let newTime = videoEl.currentTime + seconds

  // if (newTime < 0) newTime = 0
  if (newTime > videoEl.duration) newTime = videoEl.duration

  videoEl.currentTime = newTime
}
