// #region GM网络请求 -------------------------------------------------------

/** [功能] 封装 GM_xmlhttpRequest 为 Promise，用法和 fetch 类似 */
export function gmFetch(url, options = {}) {
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
          const resJson = res.responseText ? JSON.parse(res.responseText) : null
          if (!resJson.success) {
            reject(new Error(`Custom Error: ${res.status} ${resJson.error || res.response}`))
          } else {
            resolve({
              ok: true,
              status: res.status,
              json: () => Promise.resolve(JSON.parse(res.responseText)),
              text: () => Promise.resolve(res.responseText)
            })
          }
        } else {
          reject(new Error(`HTTP Error: ${res.status} ${res.statusText}`))
        }
      },
      onerror: (err) => {
        reject(new Error('Network Error'))
      },
      ontimeout: () => {
        reject(new Error('Timeout'))
      }
    })
  })
}

// #endregion

// #region GM本地存储 -------------------------------------------------------

/** 获取存储项 */
export function gmGetValue(key, defaultValue = '') {
  return GM_getValue(key, defaultValue)
}

/** 存储 */
export function gmSetValue(key, value) {
  return GM_setValue(key, value)
}

/** 追加存储项 */
export function gmPushValue(key, value) {
  // 1. 获取存储项
  let items = gmGetValue(key)

  // 2. 追加
  if (Array.isArray(items)) {
    // 数组类型
    items.push(value)
  } else if (typeof items === 'string') {
    // 字符串类型
    items += ',' + value
    console.log('items: ', items)
  }

  // 3. 重新存储
  gmSetValue(key, items)
}

/** 删除存储项数组或字符串中的某个元素或某个子串 */
export function gmRemoveValue(key, value) {
  // 1. 获取存储项
  const items = gmGetValue(key)

  // 2. 删除
  if (Array.isArray(items)) {
    // 数组类型
    items.splice(value, 1)
  } else if (typeof items === 'string') {
    // 字符串类型
    const arr = items.split(',')
    arr.splice(value, 1)
    items = arr.join(',')
  }

  // 3. 重新存储
  gmSetValue(key, items)
}

// #endregion
