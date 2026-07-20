import { api, getUrl } from 'tm-utils'

// 全局变量
let videoEl = null
let time = 60

const url = getUrl()

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
  if (url.searches.mode === 'search') {
    setTimeout(() => {
      const FrameWrapperEl = document.querySelector('.wrap-view')
      FrameWrapperEl.style.width = 'unset'
    }, 100)
  }
}

function fastJump(seconds) {
  console.log(seconds, videoEl.duration)
  let newTime = videoEl.currentTime + seconds

  // if (newTime < 0) newTime = 0
  if (newTime > videoEl.duration) newTime = videoEl.duration

  videoEl.currentTime = newTime
}
