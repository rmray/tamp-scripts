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

  /** [功能] 消息提示（支持多条堆叠） */
  const _toastList = [];
  const TOAST_GAP = 10; // toast 之间的间距
  const TOAST_TOP = 20; // 第一个 toast 距顶部的距离

  function _updateToastPositions() {
    let currentTop = TOAST_TOP;
    for (const t of _toastList) {
      t.style.top = currentTop + 'px';
      currentTop += t.offsetHeight + TOAST_GAP;
    }
  }

  function _removeToast(toast) {
    toast.classList.add('tm-toast-out');
    toast.addEventListener('animationend', () => {
      const idx = _toastList.indexOf(toast);
      if (idx > -1) _toastList.splice(idx, 1);
      toast.remove();
      _updateToastPositions();
    }, { once: true });
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
          console.log('gm-res: ', res);
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

      console.log('responseJson: ', responseJson);

      // 3. 处理响应结果
      if (!responseJson.success) throw new Error(responseJson.error || '未知错误')
      console.log(`✅ 保存 ${key} 数据到云端成功`);
      showToast(`✅ 保存 ${key} 数据到云端成功`, 'success');
    } catch (err) {
      console.log(`❌ 保存 ${key} 数据到云端失败：`, err);
      showToast(`❌ 保存 ${key} 数据到云端失败：${err}`, 'error');
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
      console.log(`✅ 移除云端 ${key} 数据成功`);
      showToast(`✅ 移除云端 ${key} 数据成功`, 'success');
    } catch (err) {
      console.log(`❌ 移除云端 ${key} 数据失败：`, err);
      showToast(`❌ 移除云端 ${key} 数据失败：${err}`, 'error');
    }
  }

  /** 全局变量 */
  // let cache = getCache() // 本地存储
  const url = getUrl(); // 获取URL：origin, pathname, search, searches
  const id = getId(); // 获取帖子ID
  const paginationEl = document.getElementById('pgt'); // 头部分页行
  let bookmarkBtn = null; // 书签按钮
  let bookmarks = []; // 书签列表

  async function main(config) {
    // 1. 初始化配置
    if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
    initConfig({ baseUrl: config.BASE_API_URL });

    // 2. CSS 样式
    setStyle(); // 设置 CSS 样式

    // 3. 书签功能
    await getBookmarks(); // 获取书签列表
    createBookmarkBtn(); // 创建书签按钮
    bookmarkBtnClick(); // 书签按钮点击事件

    // 4. Ban/Fav 功能
    createBanFavForm(); // 创建 Ban/Unban 和 Fav/Unfav 表单
    updateIdols(); // 更新女优状态
  }

  // #region CSS 样式 -------------------------------------------------------

  /** [功能] 设置 CSS 样式 */
  function setStyle() {
    GM_addStyle(`
    .bookmark-btn { display: inline-block; padding: 7px 10px; background: #fff; border: 1px solid #ccc; cursor: pointer; }
    .bookmark-btn:hover { background: #f0f0f0; }
    .bookmark-btn.active { background: blue; color: #fff; }

    /** Ban 和 Fav 表单 */
    .ban-fav-container { width: 300px; position: fixed; top: 50px; left: 60px; padding: 10px; box-sizing: border-box; background-color: #fff; }
  `);
  }

  // #endregion

  // #region 书签功能 -------------------------------------------------------

  /** [功能] 获取书签列表 */
  async function getBookmarks() {
    bookmarks = await getCloudData('sehuatang/bookmarks');
  }

  /** [功能] 创建书签按钮 */
  function createBookmarkBtn() {
    // 1. 创建书签按钮元素
    bookmarkBtn = createElement({
      type: 'button',
      text: '添加书签',
      cNames: ['bookmark-btn']
    });

    // 2. 根据 bookmarks 列表设置按钮状态
    if (bookmarks.includes(id)) {
      bookmarkBtn.classList.add('active');
      bookmarkBtn.innerHTML = '书签已添加';
    }

    // 3. 将按钮添加到页面
    paginationEl?.append(bookmarkBtn);
  }

  /** [功能] 书签按钮点击事件 */
  function bookmarkBtnClick() {
    // 1. 安全检查
    if (!bookmarkBtn) throw new Error('书签按钮未找到')

    bookmarkBtn.addEventListener('click', (e) => {
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
  function createBanFavForm() {
    const container = createElement({
      type: 'div',
      cNames: ['ban-fav-container']
    });
    container.innerHTML = `
    <h3 style="font-size: 18px; text-align: center; ">Ban / Fav 女优</h3>
    <div id="ban-fav-form">
      <textarea name="idols" placeholder="输入女优名字，多个用英文逗号分隔" style="width: 97%; height: 80px;"></textarea>
      <div style="margin-bottom: 10px;">
        <button class="ban" style="width: 48%; padding: 4px 0; margin-right: 2%;">Ban</button>
        <button class="unban" style="width: 48%; padding: 4px 0;">Unban</button>
      </div>
      <div>
        <button class="fav" style="width: 48%; padding: 4px 0; margin-right: 2%;">Fav</button>
        <button class="unfav" style="width: 48%; padding: 4px 0;">Unfav</button>
      </div>
    </div>
  `;
    document.body.appendChild(container);
  }

  /** [功能] 更新女优状态 */
  function updateIdols() {
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
        this.style.backgroundColor = 'blue';
        this.style.color = '#fff';
      });
    });
  }

  // #endregion

  // #region 工具方法 -------------------------------------------------------

  /** 获取帖子ID */
  function getId() {
    return Number(url.pathname.startsWith('/forum.php') ? url.searches.tid : url.pathname.split('-')[1])
  }

  // #endregion

  exports.main = main;

})(this.MrSehuatangDetail = this.MrSehuatangDetail || {});
