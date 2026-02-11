import { gmFetch } from './gm.js'

let _config = {
  baseUrl: null
}

/** [功能] 初始化配置 */
export function initConfig(config) {
  _config = { ..._config, ...config }
}

/** [功能] 从云端获取数据 */
export async function getCloudData(key) {
  // 1. 检查 baseUrl 是否已配置
  if (!_config.baseUrl) throw new Error('❌ 请先调用 initConfig() 初始化配置')

  // 2. 发送请求获取数据
  try {
    console.log('API: ', `${_config.baseUrl}?key=${key}`)
    const response = await gmFetch(`${_config.baseUrl}?key=${key}`)
    const responseJson = await response.json()
    return JSON.parse(responseJson.value)
  } catch (err) {
    console.error('❌ 获取云端数据失败：', err)
    return []
  }
}

/** [功能] 保存数据到云端 */
export async function setCloudData(key, value) {
  // 1. 检查 baseUrl 是否已配置
  if (!_config.baseUrl) throw new Error('❌ 请先调用 initConfig() 初始化配置')

  // 2. 发送请求保存数据
  try {
    await gmFetch(_config.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    })
    console.success('✅ 保存数据到云端成功')
  } catch (err) {
    console.error('❌ 保存数据到云端失败：', err)
  }
}

/** [功能] 移除云端指定数据 */
export async function removeCloudData(key) {
  // 1. 检查 baseUrl 是否已配置
  if (!_config.baseUrl) throw new Error('❌ 请先调用 initConfig() 初始化配置')

  // 2. 发送请求移除数据
  try {
    await gmFetch(`${_config.baseUrl}?key=${key}`, { method: 'DELETE' })
    console.success('✅ 移除云端数据成功')
  } catch (err) {
    console.error('❌ 移除云端数据失败：', err)
  }
}
