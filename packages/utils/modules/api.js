import { gmFetch } from './gm.js'
import { showToast, initGeneralStyle } from './general.js'

let _config = {
  baseUrl: null
}
const SWR_PREFIX = 'swr_cache_'
const SWR_DELAY = 4000

/** [功能] 初始化配置 */
export function initConfig(config) {
  _config = { ..._config, ...config }
  initGeneralStyle() // 初始化通用样式
}

/** [功能] 从云端获取数据 */
export async function getCloudData(key) {
  // 1. 检查 baseUrl 是否已配置
  if (!_config.baseUrl) throw new Error('❌ 请先调用 initConfig() 初始化配置')

  // 2. 发送请求获取数据
  try {
    // console.log('API: ', `${_config.baseUrl}?key=${key}`)
    const responseJson = await gmFetch(`${_config.baseUrl}?key=${key}`).then((res) => res.json())

    // 3. 处理响应结果
    if (!responseJson.success) throw new Error(responseJson.error || '未知错误')
    // showToast(`✅ 获取云端 ${key} 数据成功`, 'success')
    return responseJson.data
  } catch (err) {
    console.log(`❌ 获取云端 ${key} 数据失败：`, err)
    showToast(`❌ 获取云端 ${key} 数据失败`, 'error')
    return []
  }
}

/** [功能] 从云端获取数据（本次缓存SWR） */
export async function getCloudDataSWR(key, fetchFn, renderFn = null) {
  const storageKey = SWR_PREFIX + key

  // 1. 先尝试从缓存中获取数据
  const oldDataRaw = localStorage.getItem(storageKey) // 原始数据

  if (oldDataRaw) {
    // 立即设置定时器，延迟从云端获取最新数据并保存
    setTimeout(_execBackgroundSync, SWR_DELAY)

    // 2. 有缓存
    // 尝试解析获取到的原始数据并返回
    try {
      return JSON.parse(oldDataRaw).data
    } catch (err) {
      console.log('❌ 从缓存中获取数据失败：', err)
      showToast('❌ 从缓存中获取数据失败', 'error')
      // 解析失败，降级为网络请求，走下面的无缓存逻辑
    }
  }

  // 3. 没有缓存
  // 重新从云端请求数据
  const data = await fetchFn(key)
  // 保存请求到的数据
  localStorage.setItem(storageKey, JSON.stringify({ data, timestamp: Date.now() }))
  // 返回数据
  return data

  /** 4. 内部方法：后台执行网络请求并保存（可以访问私有变量） */
  async function _execBackgroundSync() {
    console.log('4秒后请求云端数据', key)
    // 重新从云端请求数据
    const newData = await fetchFn(key)

    // 保存新数据
    localStorage.setItem(storageKey, JSON.stringify({ data: newData, timestamp: Date.now() }))

    // 对比新旧数据，决定是否更新页面
    if (oldDataRaw !== JSON.stringify(newData)) {
      renderFn && renderFn(newData)
    }
  }
}

/** [功能] 保存/更新数据到云端 */
export async function setCloudData(key, values) {
  // 1. 检查 baseUrl 是否已配置
  if (!_config.baseUrl) throw new Error('❌ 请先调用 initConfig() 初始化配置')

  // 2. 发送请求保存数据
  try {
    const responseJson = await gmFetch(_config.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, values })
    }).then((res) => res.json())

    // console.log('responseJson: ', responseJson)

    // 3. 处理响应结果
    if (!responseJson.success) throw new Error(responseJson.error || '未知错误')
    // console.log(`✅ 保存 ${key} 数据到云端成功`)
    showToast(`✅ 保存 ${key} 数据到云端成功`, 'success')
  } catch (err) {
    console.log(`❌ 保存 ${key} 数据到云端失败：`, err)
    showToast(`❌ 保存 ${key} 数据到云端失败：${err}`, 'error')
    throw err
  }
}

/** [功能] 移除云端指定数据 */
export async function removeCloudData(key, values) {
  // 1. 检查 baseUrl 是否已配置
  if (!_config.baseUrl) throw new Error('❌ 请先调用 initConfig() 初始化配置')

  // 2. 发送请求移除数据
  try {
    const responseJson = await gmFetch(_config.baseUrl, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, values })
    }).then((res) => res.json())

    // 3. 处理响应结果
    if (!responseJson.success) throw new Error(responseJson.error || '未知错误')
    // console.log(`✅ 移除云端 ${key} 数据成功`)
    showToast(`✅ 移除云端 ${key} 数据成功`, 'success')
  } catch (err) {
    console.log(`❌ 移除云端 ${key} 数据失败：`, err)
    showToast(`❌ 移除云端 ${key} 数据失败：${err}`, 'error')
    throw err
  }
}
