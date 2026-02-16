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
  function getUrl(url = '') {
    const origin = window.location.origin; // https://fxc5.5qm5s.net
    const pathname = window.location.pathname; // /forum.php
    const search = window.location.search; // ?mod=forumdisplay&fid=37&page=100
    const searches = Object.fromEntries(new URLSearchParams(window.location.search)); // {mod: 'forumdisplay', fid: '37', page: '100'}

    return { origin, pathname, search, searches }
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
  const SWR_PREFIX = 'swr_cache_';
  const SWR_DELAY = 4000;

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
      // showToast(`✅ 获取云端 ${key} 数据成功`, 'success')
      return responseJson.data
    } catch (err) {
      console.log(`❌ 获取云端 ${key} 数据失败：`, err);
      showToast(`❌ 获取云端 ${key} 数据失败`, 'error');
      return []
    }
  }

  /** [功能] 从云端获取数据（本次缓存SWR） */
  async function getCloudDataSWR(key, fetchFn, renderFn = null) {
    const storageKey = SWR_PREFIX + key;

    // 1. 先尝试从缓存中获取数据
    const oldDataRaw = localStorage.getItem(storageKey); // 原始数据

    if (oldDataRaw) {
      // 立即设置定时器，延迟从云端获取最新数据并保存
      setTimeout(_execBackgroundSync, SWR_DELAY);

      // 2. 有缓存
      // 尝试解析获取到的原始数据并返回
      try {
        return JSON.parse(oldDataRaw).data
      } catch (err) {
        console.log('❌ 从缓存中获取数据失败：', err);
        showToast('❌ 从缓存中获取数据失败', 'error');
        // 解析失败，降级为网络请求，走下面的无缓存逻辑
      }
    }

    // 3. 没有缓存
    // 重新从云端请求数据
    const data = await fetchFn(key);
    // 保存请求到的数据
    localStorage.setItem(storageKey, JSON.stringify({ data, timestamp: Date.now() }));
    // 返回数据
    return data

    /** 4. 内部方法：后台执行网络请求并保存（可以访问私有变量） */
    async function _execBackgroundSync() {
      console.log('4秒后请求云端数据', key);
      // 重新从云端请求数据
      const newData = await fetchFn(key);

      // 保存新数据
      localStorage.setItem(storageKey, JSON.stringify({ data: newData, timestamp: Date.now() }));

      // 对比新旧数据，决定是否更新页面
      if (oldDataRaw !== JSON.stringify(newData)) {
        renderFn && renderFn(newData);
      }
    }
  }

  /** [功能] 保存/更新数据到云端 */
  async function setCloudData(key, values) {
    // 1. 检查 baseUrl 是否已配置
    if (!_config.baseUrl) throw new Error('❌ 请先调用 initConfig() 初始化配置')

    // 2. 发送请求保存数据
    try {
      const responseJson = await gmFetch(_config.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, values })
      }).then((res) => res.json());

      // console.log('responseJson: ', responseJson)

      // 3. 处理响应结果
      if (!responseJson.success) throw new Error(responseJson.error || '未知错误')
      // console.log(`✅ 保存 ${key} 数据到云端成功`)
      showToast(`✅ 保存 ${key} 数据到云端成功`, 'success');
    } catch (err) {
      console.log(`❌ 保存 ${key} 数据到云端失败：`, err);
      showToast(`❌ 保存 ${key} 数据到云端失败：${err}`, 'error');
      throw err
    }
  }

  /** [功能] 移除云端指定数据 */
  async function removeCloudData(key, values) {
    // 1. 检查 baseUrl 是否已配置
    if (!_config.baseUrl) throw new Error('❌ 请先调用 initConfig() 初始化配置')

    // 2. 发送请求移除数据
    try {
      const responseJson = await gmFetch(_config.baseUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, values })
      }).then((res) => res.json());

      // 3. 处理响应结果
      if (!responseJson.success) throw new Error(responseJson.error || '未知错误')
      // console.log(`✅ 移除云端 ${key} 数据成功`)
      showToast(`✅ 移除云端 ${key} 数据成功`, 'success');
    } catch (err) {
      console.log(`❌ 移除云端 ${key} 数据失败：`, err);
      showToast(`❌ 移除云端 ${key} 数据失败：${err}`, 'error');
      throw err
    }
  }

  /** 去除广告 */
  function removeAd() {
    const adSelectors = ['.show-text', '.show-text2', '.show-text4'];
    adSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => el.remove());
    });
  }

  /** [工具方法] 获取帖子ID */
  function getId(url) {
    return Number(url.pathname.startsWith('/forum.php') ? url.searches.tid : url.pathname.split('-')[1])
  }

  /**
   * [工具方法] 匹配指定内容
   * target: 可选值：idol/code/magnet/torrent
   */
  function matchContent(target) {
    let matched = null;
    let match = null;

    // 1. 获取帖子内容元素
    const postMsgEl = document.querySelector('#postlist div[id^="post_"] td[id^="postmessage_"]');
    const titleEl = document.querySelector('#thread_subject');
    // console.log(titleEl)
    if (!postMsgEl) return

    // 2. 根据目标类型匹配内容
    switch (target) {
      case 'idol':
        match = postMsgEl.textContent.match(/(?:【出演女优】|出演者)[:：][ \t]*([^\n\r]*)/);
        // console.log(postMsgEl.textContent)
        if (match && match[1]) {
          matched = match[1]
            .split(/&nbsp;|\s/)
            .map((name) => name.trim())
            .filter((name) => name);
        }
        break
      case 'code':
        match = titleEl.textContent.match(/^(Tokyo Hot\s+n\d+|[a-zA-Z0-9]+-[a-zA-Z0-9-]+(?<!-))/);
        // console.log(match)
        if (match && match[1]) {
          matched = match[1].trim().toUpperCase();
        }
        break
    }

    // 3. 返回匹配结果
    return matched
  }

  /** [工具方法] 创建分页行按钮 */
  async function createPageBtns(options = {}) {
    // 1. 获取变量
    let { type, text, values = [], textActive = text, datas = [], id = null } = options;
    const btns = [];
    const paginationEl = document.getElementById('pgt'); // 头部分页行

    // 2. 创建书签按钮元素
    let i = 0;
    do {
      let textOrigin = text;
      let btn = null;

      if (values.length) {
        textOrigin = textOrigin + ' ' + values[i];
      }

      if (type === 'search-mode') {
        // 3. 特殊处理 search-mode 情况
        btn = createElement({
          type: 'select',
          name: 'mode',
          cNames: [`${type}-select`, 'page-btn']
        });
        btn.innerHTML = `
        <option value="both" selected>同时搜索</option>
        <option value="sehuatang">色花堂</option>
        <option value="javbus">JavBus</option>  
      `;
      } else {
        btn = createElement({
          type: type === 'button',
          text: textOrigin,
          cNames: [`${type}-btn`, 'page-btn']
        });
      }

      // 3. 特殊处理 bookmark 情况
      if (type === 'bookmark') {
        const bookmarks = datas;
        // 根据 bookmarks 列表设置按钮状态
        if (bookmarks.includes(id)) {
          btn.classList.add('active');
          btn.innerHTML = textActive;
        }
      }

      // 4. 将按钮添加到页面，同时返回按钮元素
      paginationEl?.append(btn);
      btns.push(btn);
      i++;
    } while (i < values.length)

    return btns
  }

  // #region 网络请求 -------------------------------------------------------

  /** [功能] 获取书签列表 */
  async function fetchBookmarks() {
    return getCloudDataSWR('sehuatang/bookmarks', getCloudData)

    // return api.getCloudData('sehuatang/bookmarks')
  }

  /** [功能] 获取 Ban 列表 */
  async function fetchBannedIdols() {
    return getCloudDataSWR('sehuatang/bannedIdols', getCloudData)
  }

  /** [功能] 获取 Fav 列表 */
  async function fetchFavoriteIdols() {
    return getCloudDataSWR('sehuatang/favoriteIdols', getCloudData)
  }

  // #endregion

  /** 全局变量 */

  // 网络请求数据
  let bookmarks = []; // 书签列表
  let bannedIdols = []; // Ban 列表
  let favoriteIdols = []; // Fav 列表

  // 通用变量
  const url = getUrl(); // 获取URL：origin, pathname, search, searches
  const id = getId(url); // 获取帖子ID

  // 书签功能
  let bookmarkBtns = []; // 书签按钮

  // Ban/Fav 功能
  let idolNames = []; // 帖子中出现的女优名字列表
  let idolsInput = null; // Ban/Fav 输入框
  let banBtn = null; // Ban 按钮
  let favBtn = null; // Fav 按钮
  let unBanBtn = null; // Unban 按钮
  let unFavBtn = null; // Unfav 按钮

  // 搜索番号功能
  const SEHUATANG_SEARCH_BASE_URL = '/search.php?mod=forum';
  const JAVBUS_SEARCH_BASE_URL = 'https://www.busjav.bond/';
  let searchBaseUrls = [SEHUATANG_SEARCH_BASE_URL, JAVBUS_SEARCH_BASE_URL]; // 目标搜索引擎 URL 列表

  let code = null; // 番号
  let searchModeSelects = []; // 搜索模式选择按钮
  let searchCodeBtns = []; // 搜索番号按钮
  let searchIdolBtns = []; // 搜索女优按钮

  async function main(config) {
    // 1. 初始化配置
    if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
    initConfig({ baseUrl: config.BASE_API_URL });
    removeAd(); // 去除广告

    // 2. CSS 样式
    setStyle(); // 设置 CSS 样式

    // 3. 网络请求
    bookmarks = await fetchBookmarks(); // 请求书签列表数据
    bannedIdols = await fetchBannedIdols(); // 请求 Ban 列表数据
    favoriteIdols = await fetchFavoriteIdols(); // 请求 Fav 列表数据

    // 4. 书签功能
    bookmarkBtns = await createPageBtns({
      type: 'bookmark',
      text: '添加书签',
      textActive: '书签已添加',
      datas: bookmarks,
      id
    }); // 创建书签按钮
    bookmarkBtnClick(); // 书签按钮点击事件

    // 5. Ban/Fav 功能
    await createBanFavForm(); // 创建 Ban/Unban 和 Fav/Unfav 表单
    await initIdolStatus(); // 初始化女优状态
    updateIdolStatus(); // 更新女优状态

    // 6. 搜索番号/女优
    code = matchContent('code');
    searchModeSelects = await createPageBtns({ type: 'search-mode', text: '搜索模式' }); // 创建搜索模式选择按钮
    searchCodeBtns = await createPageBtns({ type: 'search-code', text: `搜索`, values: [code] }); // 创建搜索番号按钮
    searchIdolBtns = await createPageBtns({ type: 'search-idols', text: '搜索', values: idolNames }); // 创建搜索女优按钮
    switchSearchMode(); // 切换搜索模式
    searchBtnsClick(); // 点击执行搜索番号/女优
  }

  // #region CSS 样式 -------------------------------------------------------

  /** [功能] 设置 CSS 样式 */
  function setStyle() {
    GM_addStyle(`
    .page-btn { display: inline-block; padding: 7px 10px; margin-right: 5px; background: #fff; border: 1px solid #ccc; cursor: pointer; }
    .page-btn:hover { background: #f0f0f0; }
    .page-btn.active { background: blue; color: #fff; }

    /** Ban 和 Fav 表单 */
    .ban-fav-container { width: 300px; position: fixed; top: 20px; right: 20px; padding: 10px; box-sizing: border-box; background-color: #fff; }
  `);
  }

  // #endregion

  // #region 书签功能 -------------------------------------------------------

  /** [功能] 书签按钮点击事件 */
  function bookmarkBtnClick() {
    // 1. 安全检查
    if (!bookmarkBtns[0]) throw new Error('书签按钮未找到')

    bookmarkBtns[0].addEventListener('click', (e) => {
      // 2. 阻止默认行为
      e.preventDefault();

      const classList = e.target.classList;

      // 3. 切换书签状态
      if (classList.contains('active')) {
        // 已添加书签，执行取消书签逻辑
        classList.remove('active');
        e.target.innerHTML = '添加书签';

        // 取消书签的 API 调用
        removeCloudData('sehuatang/bookmarks', [id]);
      } else {
        // 未添加书签，执行添加书签逻辑
        classList.add('active');
        e.target.innerHTML = '书签已添加';

        // 添加书签的 API 调用
        setCloudData('sehuatang/bookmarks', [id]);
      }
    });
  }

  // #endregion

  // #region Ban/Fav 功能 -------------------------------------------------------

  /** [功能] 创建 Ban/Unban 和 Fav/Unfav 表单 */
  async function createBanFavForm() {
    // 1. 创建表单容器元素
    const container = createElement({
      type: 'div',
      cNames: ['ban-fav-container']
    });
    container.innerHTML = `
    <h3 style="font-size: 18px; text-align: center; ">Ban / Fav 女优</h3>
    <div id="ban-fav-form">
      <textarea id="idols"  name="idols" placeholder="输入女优名字，多个用英文逗号分隔" style="width: 97%; height: 40px;"></textarea>
      <div style="margin-bottom: 10px;">
        <button class="ban" id="ban" style="width: 48%; padding: 4px 0; margin-right: 2%;">Ban</button>
        <button class="unban" id="unban" style="width: 48%; padding: 4px 0;">Unban</button>
      </div>
      <div>
        <button class="fav" id="fav" style="width: 48%; padding: 4px 0; margin-right: 2%;">Fav</button>
        <button class="unfav" id="unfav" style="width: 48%; padding: 4px 0;">Unfav</button>
      </div>
    </div>
  `;
    document.body.appendChild(container);

    // 2. 获取 Ban 和 Fav 按钮元素
    idolsInput = document.getElementById('idols'); // Ban/Fav 输入框
    banBtn = document.getElementById('ban'); // Ban 按钮
    favBtn = document.getElementById('fav'); // Fav 按钮
    unBanBtn = document.getElementById('unban'); // Unban 按钮
    unFavBtn = document.getElementById('unfav'); // Unfav 按钮
  }

  /** [功能] 初始化女优状态 */
  async function initIdolStatus() {
    // 1. 获取页面中所有的女优名字元素
    idolNames = matchContent('idol');

    // 2. 自动填充 Ban/Fav 输入框
    if (idolNames.length > 0) {
      idolsInput.value = idolNames.join(',');
    }

    // 3. 根据 bannedIdols 和 favoriteIdols 列表设置女优状态
    idolNames.forEach((name) => {
      // console.log(idolNames, banBtn, favBtn)
      if (bannedIdols.length > 0 && bannedIdols.includes(name)) {
  [banBtn, favBtn, unFavBtn].forEach((btn) => {
          btn.disabled = true;
          btn.style.opacity = '0.5';
          btn.style.cursor = 'not-allowed';
        });
      }
      if (favoriteIdols.length > 0 && favoriteIdols.includes(name)) {
  [favBtn, banBtn, unBanBtn].forEach((btn) => {
          btn.disabled = true;
          btn.style.opacity = '0.5';
          btn.style.cursor = 'not-allowed';
        });
      }
    });
  }

  /** [功能] 更新女优状态 */
  function updateIdolStatus() {
    const options = ['ban', 'unban', 'fav', 'unfav'];

    // 1. 批量绑定按钮事件
    options.forEach((option) => {
      const btn = document.querySelector(`.ban-fav-container .${option}`);
      btn.addEventListener('click', async function () {
        // 2. 获取输入的女优名字列表
        const textarea = document.querySelector('.ban-fav-container textarea[name="idols"]');
        const idols = textarea.value
          .split(',')
          .map((name) => name.trim()) // 去除名字前后空格
          .filter((name) => name); // 去除空 name 字符串
        if (idols.length === 0) return

        // 3. 根据按钮类型执行不同的 API 调用
        if (option === 'ban') {
          await setCloudData('sehuatang/bannedIdols', idols);
        } else if (option === 'unban') {
          await removeCloudData('sehuatang/bannedIdols', idols);
        } else if (option === 'fav') {
          await setCloudData('sehuatang/favoriteIdols', idols);
        } else if (option === 'unfav') {
          await removeCloudData('sehuatang/favoriteIdols', idols);
        }

        // 4. 更新并高亮按钮状态
        this.style.backgroundColor = 'red';
        this.style.color = '#fff';
      });
    });
  }

  // #endregion

  // #region 搜索功能 -------------------------------------------------------

  /** [功能] 切换搜索模式 */
  function switchSearchMode() {
    searchModeSelects[0].addEventListener('change', function () {
      const mode = this.value;

      switch (mode) {
        case 'sehuatang':
          searchBaseUrls = [SEHUATANG_SEARCH_BASE_URL];
          break
        case 'javbus':
          searchBaseUrls = [JAVBUS_SEARCH_BASE_URL];
          break
        case 'both':
        default:
          searchBaseUrls = [SEHUATANG_SEARCH_BASE_URL, JAVBUS_SEARCH_BASE_URL];
      }
    });
  }

  /** [功能] 点击执行搜索番号/女优 */
  function searchBtnsClick() {
  [...searchCodeBtns, ...searchIdolBtns].forEach((btn) => {
      btn.addEventListener('click', function () {
        const isIdolSearch = searchIdolBtns.includes(this);
        const keyword = this.textContent.replace('搜索', '').trim();

        // 执行搜索，批量打开搜索引擎 URL
        searchBaseUrls.forEach((baseUrl) => {
          let searchUrl = '';
          if (isIdolSearch && (baseUrl.toLowerCase().includes('busjav') || baseUrl.toLowerCase().includes('javbus'))) {
            // 女优搜索且目标搜索引擎是 Javbus，使用特殊的搜索 URL 结构
            searchUrl = baseUrl + 'search/' + encodeURIComponent(keyword);
          } else if (baseUrl.toLowerCase().includes('/search.php')) {
            // 目标搜索引擎是 Sehuatang，特殊处理
            searchUrl = baseUrl + '&kw=' + encodeURIComponent(keyword);
          } else {
            // 其他情况使用通用的搜索 URL 结构
            searchUrl = baseUrl + encodeURIComponent(keyword);
          }

          window.open(searchUrl, '_blank');
        });
      });
    });
  }

  // #endregion

  exports.main = main;

})(this.MrSehuatangDetail = this.MrSehuatangDetail || {});
