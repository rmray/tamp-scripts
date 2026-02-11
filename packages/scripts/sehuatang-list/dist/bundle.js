(function (exports) {
  'use strict';

  /** [功能] 创建元素 */
  function createElement(option) {
    const { type = 'div', text = '', css = '', cNames = [], attrs = [], value = '' } = option;

    const el = document.createElement(type);
    el.innerText = text;
    el.style.cssText = css;
    if (el.value) el.value = value;
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
          if (res.status >= 200 && res.status < 300) {
            resolve({
              ok: true,
              status: res.status,
              json: () => Promise.resolve(JSON.parse(res.responseText)),
              text: () => Promise.resolve(res.responseText)
            });
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
  }

  /** [功能] 从云端获取数据 */
  async function getCloudData(key) {
    // 1. 检查 baseUrl 是否已配置
    if (!_config.baseUrl) throw new Error('❌ 请先调用 initConfig() 初始化配置')

    // 2. 发送请求获取数据
    try {
      console.log('API: ', `${_config.baseUrl}?key=${key}`);
      const response = await gmFetch(`${_config.baseUrl}?key=${key}`);
      const responseJson = await response.json();
      return JSON.parse(responseJson.value)
    } catch (err) {
      console.error('❌ 获取云端数据失败：', err);
      return []
    }
  }

  /** 全局变量 */
  let listEls = []; // 目录列表元素
  let bannedIdols = []; // 屏蔽的女优列表
  let bookmarks = []; // 标记过的帖子ID列表
  let bannedEls = []; // 屏蔽的元素列表

  // #region 主方法 -------------------------------------------------------

  async function main(config = {}) {
    // 1. 初始化配置
    if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
    initConfig({ baseUrl: config.BASE_API_URL });

    // 2. 过滤列表
    listEls = getListEl(); // 获取目录列表
    bannedIdols = await getBannedIdols(); // 获取屏蔽的女优列表
    listEls = filterBannedIdols(); // 过滤屏蔽女优，并隐藏列表
    listEls = filterSignStartWithNumber(); // 过滤数字开头的番号
    await highlightMarked(); // 高亮被标记过的链接

    // 3. 批量打开链接
    createLink(); // 创建批量打开链接按钮
    batchOpenLink(); // 批量打开链接
  }

  // #endregion

  // #region 过滤列表 -------------------------------------------------------

  /** 获取目录列表元素 */
  function getListEl() {
    return Array.from(document.querySelectorAll('#threadlisttableid .xst'))
  }

  /** 获取屏蔽的女优列表 */
  async function getBannedIdols() {
    return await getCloudData('sehuatang/bannedIdols')
  }

  /** 过滤目录列表元素：屏蔽黑名单女优，并隐藏列表 */
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

  /** 过滤数字开头的番号 */
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

  /** 高亮被标记过的链接 */
  async function highlightMarked() {
    bookmarks = await getCloudData('sehuatang/bookmarks');

    listEls.forEach((el) => {
      const id = el.href.split('-')[1];
      const isMarked = bookmarks.includes(id);
      if (isMarked) el.style.backgroundColor = '#d6f4c9';
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
    paginationEl.appendChild(frontEl);
    paginationEl.appendChild(rearEl);
    paginationEl.appendChild(countEl);
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
