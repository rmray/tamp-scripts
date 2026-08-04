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
  let searchWidthIntervalId = null;

  async function main(config = {}) {
    // 1. 初始化配置
    if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
    initConfig({ baseUrl: config.BASE_API_URL });

    videoEl = document.querySelector('#js-video');

    // 快进/快退
    document.addEventListener('keydown', (e) => {
      // 输入框聚焦时不拦截按键，避免影响 Backspace / Ctrl+V 等默认行为
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return
      // 仅在视频页面生效
      if (!videoEl) return

      let seconds;
      switch (e.key) {
        // D键：快进1分钟
        // A键：快退1分钟
        // Q键：快进5分钟
        // E键：快退5分钟
        case 'd':
          seconds = time;
          break
        case 'a':
          seconds = -time;
          break
        case 'e':
          seconds = time * 5;
          break
        case 'q':
          seconds = -time * 5;
          break
        default:
          return
      }

      e.preventDefault();
      fastJump(seconds);
    });

    // 搜索页宽度扩大
    expandSearchPageWidth();
  }

  /** 搜索结果页取消 .wrap-view 固定宽度 */
  function expandSearchPageWidth() {
    const ensureWidthExpanded = () => {
      if (getUrl().searches.mode !== 'search') {
        clearInterval(searchWidthIntervalId);
        searchWidthIntervalId = null;
        return
      }

      const frameWrapperEls = [...document.querySelectorAll('.wrap-view')];
      if (frameWrapperEls.length === 0) return

      frameWrapperEls.forEach((frameWrapperEl) => {
        const width = frameWrapperEl.style.getPropertyValue('width');
        const priority = frameWrapperEl.style.getPropertyPriority('width');

        if (width !== 'unset' || priority !== 'important') {
          frameWrapperEl.style.setProperty('width', 'unset', 'important');
        }
      });

      const isWidthExpanded = frameWrapperEls.every((frameWrapperEl) => {
        return frameWrapperEl.style.getPropertyValue('width') === 'unset' && frameWrapperEl.style.getPropertyPriority('width') === 'important'
      });

      if (isWidthExpanded) {
        clearInterval(searchWidthIntervalId);
        searchWidthIntervalId = null;
      }
    };

    if (getUrl().searches.mode !== 'search' || searchWidthIntervalId !== null) return

    searchWidthIntervalId = setInterval(ensureWidthExpanded, 500);
    ensureWidthExpanded();
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
