import { api } from 'tm-utils'

// 全局变量
let videoEl = null
let time = 60

export async function main(config = {}) {
  // 1. 初始化配置
  if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
  api.initConfig({ baseUrl: config.BASE_API_URL })

  videoEl = document.querySelector('#js-video')

  // 快进/快退
  document.addEventListener('keydown', (e) => {
    e.preventDefault()

    switch (e.key) {
      case 'd':
        fastJump(time)
        break
      case 'a':
        fastJump(-time)
        break
      // D键：快进1分钟
      // A键：快退1分钟
    }
  })
}

function fastJump(seconds) {
  console.log(seconds, videoEl.duration)
  let newTime = videoEl.currentTime + seconds

  // if (newTime < 0) newTime = 0
  if (newTime > videoEl.duration) newTime = videoEl.duration

  videoEl.currentTime = newTime
}
