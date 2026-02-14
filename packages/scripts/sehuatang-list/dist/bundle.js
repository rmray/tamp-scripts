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

  /** [功能] 消息提示（支持多条堆叠） */
  const _toastList = [];
  const TOAST_GAP = 10; // toast 之间的间距
  const TOAST_TOP = 200; // 第一个 toast 距顶部的距离

  function _updateToastPositions() {
    let currentTop = TOAST_TOP;
    for (const t of _toastList) {
      t.style.top = currentTop + 'px';
      currentTop += t.offsetHeight + TOAST_GAP;
    }
  }

  function _removeToast(toast) {
    toast.classList.add('tm-toast-out');
    toast.addEventListener(
      'animationend',
      () => {
        const idx = _toastList.indexOf(toast);
        if (idx > -1) _toastList.splice(idx, 1);
        toast.remove();
        _updateToastPositions();
      },
      { once: true }
    );
  }

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `tm-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    _toastList.push(toast);
    _updateToastPositions();

    setTimeout(() => _removeToast(toast), 3000);
  }

  /** [功能] 创建元素 */
  function createElement(option) {
    const { type = 'div', text = '', css = '', cNames = [], attrs = [], value = '', name = '' } = option;

    const el = document.createElement(type);
    el.innerText = text;
    el.style.cssText = css;
    if (el.value) el.value = value;
    if (el.name) el.name = name;
    cNames.forEach((cName) => el.classList.add(cName));
    attrs.forEach((attr) => el.setAttribute(attr.name, attr.value));

    return el
  }

  // #region GM网络请求 -------------------------------------------------------

  /** [功能] 封装 GM_xmlhttpRequest 为 Promise，用法和 fetch 类似 */
  function gmFetch(url, options = {}) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: options.method || 'GET',
        url: url,
        headers: options.headers || {},
        data: options.body || null,
        // 模拟 fetch 的 response 对象
        onload: (res) => {
          // console.log('gm-res: ', res)
          if (res.status >= 200 && res.status < 300) {
            const resJson = res.responseText ? JSON.parse(res.responseText) : null;
            if (!resJson.success) {
              reject(new Error(`Custom Error: ${res.status} ${resJson.error || res.response}`));
            } else {
              resolve({
                ok: true,
                status: res.status,
                json: () => Promise.resolve(JSON.parse(res.responseText)),
                text: () => Promise.resolve(res.responseText)
              });
            }
          } else {
            reject(new Error(`HTTP Error: ${res.status} ${res.statusText}`));
          }
        },
        onerror: (err) => {
          reject(new Error('Network Error'));
        },
        ontimeout: () => {
          reject(new Error('Timeout'));
        }
      });
    })
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

  /** [功能] 从云端获取数据 */
  async function getCloudData(key) {
    // 1. 检查 baseUrl 是否已配置
    if (!_config.baseUrl) throw new Error('❌ 请先调用 initConfig() 初始化配置')

    // 2. 发送请求获取数据
    try {
      // console.log('API: ', `${_config.baseUrl}?key=${key}`)
      const responseJson = await gmFetch(`${_config.baseUrl}?key=${key}`).then((res) => res.json());

      // 3. 处理响应结果
      if (!responseJson.success) throw new Error(responseJson.error || '未知错误')
      showToast(`✅ 获取云端 ${key} 数据成功`, 'success');
      return responseJson.data
    } catch (err) {
      console.log(`❌ 获取云端 ${key} 数据失败：`, err);
      showToast(`❌ 获取云端 ${key} 数据失败`, 'error');
      return []
    }
  }

  /** 全局变量 */

  // 网络请求
  let bookmarks = []; // 书签列表
  let bannedIdols = []; // Ban 列表
  let favoriteIdols = []; // Fav 列表

  let listEls = []; // 目录列表元素
  let bannedEls = []; // 屏蔽的元素列表

  // #region 主方法 -------------------------------------------------------

  async function main(config = {}) {
    // 1. 初始化配置
    if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
    initConfig({ baseUrl: config.BASE_API_URL });

    // 2. 网络请求
    await fetchBookmarks(); // 请求书签列表数据
    await fetchBannedIdols(); // 请求 Ban 列表数据
    await fetchFavoriteIdols(); // 请求 Fav 列表数据

    // 3. 过滤列表
    listEls = getListEl(); // 获取目录列表
    listEls = filterBannedIdols(); // 过滤屏蔽女优，并隐藏列表
    listEls = filterSignStartWithNumber(); // 过滤数字开头的番号
    await highlightMarked(); // 高亮被标记过的链接
    await hightlightFavorite(); // 高亮被标记为喜欢的链接

    // 4. 批量打开链接
    createLink(); // 创建批量打开链接按钮
    batchOpenLink(); // 批量打开链接
  }

  // #endregion

  // #region 网络请求 -------------------------------------------------------

  /** [功能] 获取书签列表 */
  async function fetchBookmarks() {
    bookmarks = await getCloudData('sehuatang/bookmarks');
  }

  /** [功能] 获取 Ban 列表 */
  async function fetchBannedIdols() {
    bannedIdols = await getCloudData('sehuatang/bannedIdols');
  }

  /** [功能] 获取 Fav 列表 */
  async function fetchFavoriteIdols() {
    favoriteIdols = await getCloudData('sehuatang/favoriteIdols');
  }

  // #endregion

  // #region 过滤列表 -------------------------------------------------------

  /** [功能] 获取目录列表元素 */
  function getListEl() {
    return Array.from(document.querySelectorAll('#threadlisttableid .xst'))
  }

  /** [功能] 过滤目录列表元素：屏蔽黑名单女优，并隐藏列表 */
  function filterBannedIdols() {
    return listEls.filter((el) => {
      const title = el.innerText;
      const matched = bannedIdols.some((act) => title.includes(act));
      if (matched) {
        if (el.closest('tbody')) el.closest('tbody').style.display = 'none';
        bannedEls.push({ actress: bannedIdols.find((act) => title.includes(act)), title });
      }
      return !matched
    })
  }

  /** [功能] 过滤数字开头的番号 */
  function filterSignStartWithNumber() {
    return listEls.filter((el) => {
      const title = el.innerText;
      const matched = title.match(/^[0-9]+/);
      if (!matched) {
        return true
      } else {
        if (el.closest('tbody')) el.closest('tbody').style.display = 'none';
        bannedEls.push({ sign: matched[0], title: title });
        return false
      }
    })
  }

  /** [功能] 高亮被标记过的链接 */
  async function highlightMarked() {
    listEls.forEach((el) => {
      const id = Number(el.href.split('-')[1]);
      const isMarked = bookmarks.includes(id);
      if (isMarked) el.style.backgroundColor = '#f78b3e';
    });
  }

  /** [功能] 高亮被标记为喜欢的链接 */
  async function hightlightFavorite() {
    listEls.forEach((el) => {
      console.log(el.innerText);
      const title = el.innerText;
      const isFavorite = favoriteIdols.some((idol) => title.includes(idol));
      if (isFavorite) el.style.backgroundColor = '#b5fab5';
    });
  }

  // #endregion

  // #region 批量打开链接 -------------------------------------------------------

  /** 创建批量打开链接按钮 */
  function createLink() {
    const paginationEl = document.querySelector('#pgt');

    // 1. 创建按钮
    const css = `
    display: inline-block;
    padding: 0 10px;
    margin-right: 5px;
    line-height: 30px;
    border: 1px solid #ccc;
    cursor: pointer;
  `;
    const frontEl = createElement({
      type: 'a',
      text: '前一半',
      cNames: ['front-half'],
      attrs: [{ name: 'href', value: 'javascript:;' }],
      css
    });
    const rearEl = createElement({
      type: 'a',
      text: '后一半',
      cNames: ['rear-half'],
      attrs: [{ name: 'href', value: 'javascript:;' }],
      css
    });
    const countEl = createElement({
      type: 'span',
      text: listEls.length,
      cNames: ['count'],
      css: `margin-right: 5px;`
    });

    // 2. 插入按钮
    paginationEl?.appendChild(frontEl);
    paginationEl?.appendChild(rearEl);
    paginationEl?.appendChild(countEl);
  }

  /** 批量打开链接 */
  function batchOpenLink() {
    const frontEl = document.querySelector('.front-half');
    const rearEl = document.querySelector('.rear-half');

    // 1. 截取前一半和后一半的元素列表
    const size = listEls.length;
    const half = size < 16 ? size : Math.floor(size / 2);
    const frontHalfEls = listEls.slice(0, half);
    const rearHalfEls = listEls.slice(half);

    // 2. 绑定点击事件，批量打开链接
    frontEl.addEventListener('click', hdlOpenLinkClick(frontHalfEls));
    rearEl.addEventListener('click', hdlOpenLinkClick(rearHalfEls));
    function hdlOpenLinkClick(els) {
      return function () {
        this.style.color = 'red';

        els.forEach((el) => {
          const href = el.href;
          window.open(href);
        });
      }
    }
  }

  // #endregion

  exports.main = main;

})(this.MrSehuatangList = this.MrSehuatangList || {});
