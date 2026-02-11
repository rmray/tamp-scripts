(function () {
  'use strict';

  /** 获取URL */
  function getUrl() {
    const origin = window.location.origin; // https://fxc5.5qm5s.net
    const pathname = window.location.pathname; // /forum.php
    const search = window.location.search; // ?mod=forumdisplay&fid=37&page=100
    const searches = Object.fromEntries(new URLSearchParams(window.location.search)); // {mod: 'forumdisplay', fid: '37', page: '100'}

    return { origin, pathname, search, searches }
  }

  /** 判断是否已经标记过 */
  function checkId(id) {
    const downloads = cache.getItem('download') || [];
    const borings = cache.getItem('boring') || [];

    return {
      isDownload: downloads.includes(id),
      isBoring: borings.includes(id)
    }
  }

  /** 生成标题章节数 */
  function zh2num(item) {
    var zhArr = [];
    item = item.trim();
    if (item.match(/第.*?章/)) {
      zhArr = item.match(/第.*?章/);
    } else if (item.match(/第.*?节/)) {
      zhArr = item.match(/第.*?节/);
    } else if (item.match(/^.*?章/)) {
      zhArr = item.match(/^.*?章/);
    } else if (item.match(/^\d+[. 、【]/)) {
      zhArr = item.match(/^\d+[. 、【]/);
    } else if (item.match(/^\d+：/)) {
      zhArr = item.match(/^\d+：/);
    } else if (item.match(/^\d+.*?/)) {
      zhArr = item.match(/^\d+.*?/);
    } else if (item.match(/(续章|第)\d+[. ]/)) {
      zhArr = item.match(/(续章|第)\d+[. ]/);
    } else {
      zhArr[0] = '';
    }
    var zh = zhArr[0];
    //console.log(zh);
    // 处理中文字符
    zh = zh.replace('第', '').replace('章', '').replace('节', '').replace('.', '').replace(' ', '').replace('续', '');
    if (parseFloat(zh).toString() !== 'NaN') {
      //console.log(zh);
      return zh
    }
    zh = zh
      .replace(/零/g, '0')
      .replace(/一/g, '1')
      .replace(/二/g, '2')
      .replace(/两/g, '2')
      .replace(/三/g, '3')
      .replace(/四/g, '4')
      .replace(/五/g, '5')
      .replace(/六/g, '6')
      .replace(/七/g, '7')
      .replace(/八/g, '8')
      .replace(/九/g, '9');
    // console.log(zh);

    // console.log( zh.indexOf('十') );
    var ss = zh.indexOf('十');
    var sb = zh.indexOf('百');
    var sq = zh.indexOf('千');

    if (ss == -1 && sb == -1 && sq == -1) {
      var zhNum = zh;
    } else {
      var ge = 0,
        shi = 0,
        bai = 0,
        qian = 0;
      ge = zh.slice(-1);
      if (ge == '十' || ge == '百' || ge == '千') {
        ge = 0;
      }
      ge = parseInt(ge);
      // console.log('=============个位：'+ge);

      if (ss !== -1) {
        shi = parseInt(zh.slice(ss - 1, ss));
        if (shi.toString() == 'NaN') shi = 1;
        // console.dir('=============十位：'+shi);
      }
      if (sb !== -1) {
        bai = parseInt(zh.slice(sb - 1, sb));
        // console.log('=============百位：'+bai);
      }

      if (sq !== -1) {
        qian = parseInt(zh.slice(sq - 1, sq));
        // console.log('=============千位：'+qian);
      }

      zhNum = ge + shi * 10 + bai * 100 + qian * 1000;
      // console.log(zhNum);
    }
    return zhNum
  }

  /** 测试 */
  function test() {
    console.log('test ok');
  }

  var general = /*#__PURE__*/Object.freeze({
    __proto__: null,
    checkId: checkId,
    getUrl: getUrl,
    test: test,
    zh2num: zh2num
  });

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

  var dom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createElement: createElement
  });

  /** 封装本地存储方法 */
  function getCache() {
    class Cache {
      /** 获取存储项 */
      getItem(key) {
        let item = localStorage.getItem(key);
        try {
          return JSON.parse(item)

          // let items = item.split(',')
          // return items
        } catch (err) {
          return item
        }
      }

      /** 存储 */
      setItem(key, value) {
        // 转成Set类型
        value = new Set(value);

        // 如果是Set类型，则转换成数组
        if (value instanceof Set) value = Array.from(value);

        // 如果是其他类型，则转换成JSON字符串
        try {
          value = JSON.stringify(value);
        } catch (err) {
          console.log('stringify失败：', value);
        }
        return localStorage.setItem(key, value)
      }

      /** 追加存储项 */
      pushItem(key, value) {
        // 1. 获取存储项
        let items = this.getItem(key);
        console.log('items: ', items);

        // 2. 追加
        if (Array.isArray(items)) {
          // 数组类型
          items.push(value);
        } else if (typeof items === 'string') {
          // 字符串类型
          items += ',' + value;
          // console.log('items: ', items)
        }

        // 3. 重新存储
        console.log(key, items);
        this.setItem(key, items);
      }

      /** 删除存储项数组或字符串中的某个元素或某个子串 */
      removeItem(key, value) {
        // 1. 获取存储项
        const items = this.getItem(key);

        // 2. 删除
        if (Array.isArray(items)) {
          // 数组类型
          items.splice(items.indexOf(value), 1);
        } else if (typeof items === 'string') {
          // 字符串类型
          const arr = items.split(',');
          arr.splice(arr.indexOf(value), 1);
          items = arr.join(',');
        }

        // 3. 重新存储
        this.setItem(key, items);
      }
    }
    return new Cache()
  }

  // 测试
  // cache.setItem('str', '二宮和香,水原みその,愛瀬ゆうり,夏八木彩月')
  // cache.setItem('arr', ['響かれん', '菅日菜子', '藍沢汐里'])
  // cache.setItem('obj', { name: 'tom', age: 100 })
  // cache.setItem('set', new Set(['aaa', 'bbb', 'ccc', 'bbb']))

  // console.log(cache.getItem('bannedActress'))
  // console.log(cache.getItem('arr'))
  // console.log(cache.getItem('str'))
  // console.log(cache.getItem('obj'))
  // console.log(cache.getItem('set'))

  // cache.pushItem('str', '追加到字符串中')
  // cache.pushItem('arr', '追加到数组中')

  var cache$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    getCache: getCache
  });

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

  // #region GM本地存储 -------------------------------------------------------

  /** 获取存储项 */
  function gmGetValue(key, defaultValue = '') {
    return GM_getValue(key, defaultValue)
  }

  /** 存储 */
  function gmSetValue(key, value) {
    return GM_setValue(key, value)
  }

  /** 追加存储项 */
  function gmPushValue(key, value) {
    // 1. 获取存储项
    let items = gmGetValue(key);

    // 2. 追加
    if (Array.isArray(items)) {
      // 数组类型
      items.push(value);
    } else if (typeof items === 'string') {
      // 字符串类型
      items += ',' + value;
      console.log('items: ', items);
    }

    // 3. 重新存储
    gmSetValue(key, items);
  }

  /** 删除存储项数组或字符串中的某个元素或某个子串 */
  function gmRemoveValue(key, value) {
    // 1. 获取存储项
    const items = gmGetValue(key);

    // 2. 删除
    if (Array.isArray(items)) {
      // 数组类型
      items.splice(value, 1);
    } else if (typeof items === 'string') {
      // 字符串类型
      const arr = items.split(',');
      arr.splice(value, 1);
      items = arr.join(',');
    }

    // 3. 重新存储
    gmSetValue(key, items);
  }

  // #endregion

  var gm = /*#__PURE__*/Object.freeze({
    __proto__: null,
    gmFetch: gmFetch,
    gmGetValue: gmGetValue,
    gmPushValue: gmPushValue,
    gmRemoveValue: gmRemoveValue,
    gmSetValue: gmSetValue
  });

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
      return await response.json()
    } catch (err) {
      console.error('❌ 获取云端数据失败：', err);
      return []
    }
  }

  /** [功能] 保存数据到云端 */
  async function setCloudData(key, value) {
    // 1. 检查 baseUrl 是否已配置
    if (!_config.baseUrl) throw new Error('❌ 请先调用 initConfig() 初始化配置')

    // 2. 发送请求保存数据
    try {
      await gmFetch(_config.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      console.success('✅ 保存数据到云端成功');
    } catch (err) {
      console.error('❌ 保存数据到云端失败：', err);
    }
  }

  /** [功能] 移除云端指定数据 */
  async function removeCloudData(key) {
    // 1. 检查 baseUrl 是否已配置
    if (!_config.baseUrl) throw new Error('❌ 请先调用 initConfig() 初始化配置')

    // 2. 发送请求移除数据
    try {
      await gmFetch(`${_config.baseUrl}?key=${key}`, { method: 'DELETE' });
      console.success('✅ 移除云端数据成功');
    } catch (err) {
      console.error('❌ 移除云端数据失败：', err);
    }
  }

  var api = /*#__PURE__*/Object.freeze({
    __proto__: null,
    getCloudData: getCloudData,
    initConfig: initConfig,
    removeCloudData: removeCloudData,
    setCloudData: setCloudData
  });

  var MrUtils = { ...general, ...dom, ...cache$1, ...gm, api };

  console.log(MrUtils);

})();
