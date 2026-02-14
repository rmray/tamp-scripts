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
  function getUrl() {
    const origin = window.location.origin; // https://fxc5.5qm5s.net
    const pathname = window.location.pathname; // /forum.php
    const search = window.location.search; // ?mod=forumdisplay&fid=37&page=100
    const searches = Object.fromEntries(new URLSearchParams(window.location.search)); // {mod: 'forumdisplay', fid: '37', page: '100'}

    return { origin, pathname, search, searches }
  }

  /** 去除广告 */
  function removeAd() {
    const adSelectors = ['.show-text', '.show-text2', '.show-text4'];
    adSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => el.remove());
    });
  }

  // #endregion

  let _config = {
    baseUrl: null
  };

  /** [功能] 初始化配置 */
  function initConfig(config) {
    _config = { ..._config, ...config };
    initGeneralStyle(); // 初始化通用样式
  }

  /** 全局变量 */
  const filterSections = ['求片问答悬赏区', 'AI专区']; // 需要过滤掉的板块
  let searchResultEls = []; // 搜索结果元素列表
  let url = getUrl(); // 获取URL：origin, pathname, search, searches

  // #region 主方法 -------------------------------------------------------

  async function main(config = {}) {
    // 1. 初始化配置
    if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
    initConfig({ baseUrl: config.BASE_API_URL });
    removeAd(); // 去除广告

    // 2. 执行搜索
    execSearch(); // 根据 URL 参数执行搜索

    // 3. 高亮/过滤搜索结果
    searchResultEls = getSearchResult(); // 获取搜索结果元素列表
    filterUselessSearchResult(); // 过滤无效的搜索结果
    heightSpecialResult(); // 高亮破解和无码帖子

    // 4. 倒计时
    startCountdown(); // 启动30秒倒计时
  }

  // #endregion

  // #region 搜索 -------------------------------------------------------

  /** [功能] 根据 URL 参数执行搜索 */
  function execSearch() {
    // 判断当前页面是否是已经有搜索结果了
    const hasReults = document.querySelectorAll('.pbw .xs3').length > 0;
    if (hasReults) return

    const searchInputEl = document.querySelector('#scform_srchtxt'); // 搜索输入框元素
    const searchBtnEl = document.querySelector('#scform_submit'); // 搜索按钮元素
    if (!searchInputEl || !searchBtnEl) return

    const keyword = url.searches.kw;
    if (!keyword) return

    searchInputEl.value = keyword; // 将 URL 参数中的关键词填入搜索输入框
    searchBtnEl.click(); // 点击搜索按钮
  }

  // #endregion

  // #region 搜索结果 -------------------------------------------------------

  /** 获取搜索结果元素列表 */
  function getSearchResult() {
    return document.querySelectorAll('.pbw')
  }

  /** 过滤无效的搜索结果 */
  function filterUselessSearchResult() {
    searchResultEls.forEach((item) => {
      const section = item.querySelector('.xi1')?.textContent;
      if (filterSections.includes(section)) {
        item.style.display = 'none';
      }
    });
  }

  /** 高亮破解和无码帖子 */
  function heightSpecialResult() {
    searchResultEls.forEach((item) => {
      if (item.textContent.includes('无码') || item.textContent.includes('破解')) {
        item.style.backgroundColor = '#ffeebe';
      }
    });
  }

  // #endregion

  // #region 倒计时 -------------------------------------------------------

  /** 启动30秒倒计时 */
  function startCountdown() {
    // 创建倒计时元素
    const countdownEl = document.createElement('div');
    countdownEl.id = 'se98-countdown';
    countdownEl.style.cssText = `
    position: fixed;
    top: 30px;
    right: 10px;
    background: linear-gradient(135deg, #afea66 0%, #f3c949 100%);
    color: white;
    padding: 5px 8px;
    border-radius: 50%;
    font-size: 16px;
    font-weight: bold;
    z-index: 99999;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    font-family: Arial, sans-serif;
  `;
    document.body.appendChild(countdownEl);

    let seconds = 30;
    countdownEl.textContent = `${seconds}`;

    const timer = setInterval(() => {
      seconds--;
      countdownEl.textContent = `${seconds}`;

      if (seconds <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  }

  // #endregion

  exports.main = main;

})(this.MrSehuatangSearch = this.MrSehuatangSearch || {});
