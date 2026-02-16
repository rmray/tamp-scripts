(function (exports) {
  'use strict';

  /** [功能] 设置公共 CSS 样式 */
  function initGeneralStyle() {
    GM_addStyle(`
    .tm-toast {
      position: fixed;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      z-index: 100001;
      transition: top 0.3s ease, opacity 0.3s ease;
      animation: tm-slide-in 0.3s ease;
    }
    .tm-toast.success {
      background: #10b981;
    }
    .tm-toast.error {
      background: #ef4444;
    }
    .tm-toast.tm-toast-out {
      animation: tm-slide-out 0.3s ease forwards;
    }
    @keyframes tm-slide-in {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes tm-slide-out {
      from { opacity: 1; transform: translateX(0); }
      to { opacity: 0; transform: translateX(100%); }
    }
  `);
  }

  let _config = {
    baseUrl: null
  };

  /** [功能] 初始化配置 */
  function initConfig(config) {
    _config = { ..._config, ...config };
    initGeneralStyle(); // 初始化通用样式
  }

  // #region 主方法 -------------------------------------------------------

  async function main(config = {}) {
    // 1. 初始化配置
    if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
    initConfig({ baseUrl: config.BASE_API_URL });

    // 2. 高亮特定标签：netorare
    const tagsEl = document.querySelectorAll(':is(.gtl, .gt, .gtw)');
    // console.log(tagsEl)
    const spTags = [
      'language:chinese',
      'other:uncensored',

      'female:netorare',
      'female:cheating',

      'other:story arc',
      'other:multi-work series'
    ];
    tagsEl.forEach((tagEl) => {
      spTags.forEach((spTag) => {
        if (spTag === tagEl.title) {
          tagEl.style.color = 'blue';
        }
        if ('td_' + spTag === tagEl.id || 'td_' + spTag.replaceAll(' ', '_') === tagEl.id) {
          tagEl.querySelector('a').style.color = 'blue';
        }
      });
    });
  }

  // #endregion

  exports.main = main;

})(this.MrHentai = this.MrHentai || {});
