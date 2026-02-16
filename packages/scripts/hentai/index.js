import { api } from 'tm-utils'

// #region 主方法 -------------------------------------------------------

export async function main(config = {}) {
  // 1. 初始化配置
  if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
  api.initConfig({ baseUrl: config.BASE_API_URL })

  // 2. 高亮特定标签：netorare
  const tagsEl = document.querySelectorAll(':is(.gtl, .gt, .gtw)')
  // console.log(tagsEl)
  const spTags = [
    'language:chinese',
    'other:uncensored',

    'female:netorare',
    'female:cheating',

    'other:story arc',
    'other:multi-work series'
  ]
  tagsEl.forEach((tagEl) => {
    spTags.forEach((spTag) => {
      if (spTag === tagEl.title) {
        tagEl.style.color = 'blue'
      }
      if ('td_' + spTag === tagEl.id || 'td_' + spTag.replaceAll(' ', '_') === tagEl.id) {
        tagEl.querySelector('a').style.color = 'blue'
      }
    })
  })
}

// #endregion
