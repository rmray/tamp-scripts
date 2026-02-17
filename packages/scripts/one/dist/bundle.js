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

  // 全局变量
  let videoEl = null;
  let time = 60;

  async function main(config = {}) {
    // 1. 初始化配置
    if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
    initConfig({ baseUrl: config.BASE_API_URL });

    videoEl = document.querySelector('#js-video');

    // 快进/快退
    document.addEventListener('keydown', (e) => {
      e.preventDefault();

      switch (e.key) {
        case 'd':
          fastJump(time);
          break
        case 'a':
          fastJump(-time);
          break
        // D键：快进1分钟
        // A键：快退1分钟
      }
    });
  }

  function fastJump(seconds) {
    console.log(seconds, videoEl.duration);
    let newTime = videoEl.currentTime + seconds;

    // if (newTime < 0) newTime = 0
    if (newTime > videoEl.duration) newTime = videoEl.duration;

    videoEl.currentTime = newTime;
  }

  exports.main = main;

})(this.MrOne = this.MrOne || {});
