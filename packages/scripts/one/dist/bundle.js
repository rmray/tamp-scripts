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

  /** 获取URL */
  function getUrl(urlStr = '') {
    const href = urlStr || window.location.href; // https://fxc5.5qm5s.net/forum.php?mod=forumdisplay&fid=37&page=100
    const url = new URL(href);
    const origin = url.origin; // https://fxc5.5qm5s.net
    const pathname = url.pathname; // /forum.php
    const search = url.search; // ?mod=forumdisplay&fid=37&page=100
    const searches = Object.fromEntries(new URLSearchParams(url.search)); // {mod: 'forumdisplay', fid: '37', page: '100'}

    return { origin, pathname, search, searches }
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

  const url = getUrl();

  async function main(config = {}) {
    // 1. 初始化配置
    if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
    initConfig({ baseUrl: config.BASE_API_URL });

    videoEl = document.querySelector('#js-video');

    // 快进/快退
    document.addEventListener('keydown', (e) => {
      e.preventDefault();

      switch (e.key) {
        // D键：快进1分钟
        // A键：快退1分钟
        // Q键：快进5分钟
        // E键：快退5分钟
        case 'd':
          fastJump(time);
          break
        case 'a':
          fastJump(-time);
          break
        case 'e':
          fastJump(time * 5);
          break
        case 'q':
          fastJump(-time * 5);
          break
      }
    });

    //
    console.log('url.searches: ', url.searches);
    // 搜索页
    if (url.searches.mode === 'search') {
      setTimeout(() => {
        const FrameWrapperEl = document.querySelector('.wrap-view');
        console.log('FrameWrapperEl: ', FrameWrapperEl);
        FrameWrapperEl.style.width = 'unset';
      }, 100);
    }
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
