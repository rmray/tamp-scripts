/** 封装本地存储方法 */
export function getCache() {
  class Cache {
    /** 获取存储项 */
    getItem(key) {
      let item = localStorage.getItem(key)
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
      value = new Set(value)

      // 如果是Set类型，则转换成数组
      if (value instanceof Set) value = Array.from(value)

      // 如果是其他类型，则转换成JSON字符串
      try {
        value = JSON.stringify(value)
      } catch (err) {
        console.log('stringify失败：', value)
      }
      return localStorage.setItem(key, value)
    }

    /** 追加存储项 */
    pushItem(key, value) {
      // 1. 获取存储项
      let items = this.getItem(key)
      console.log('items: ', items)

      // 2. 追加
      if (Array.isArray(items)) {
        // 数组类型
        items.push(value)
      } else if (typeof items === 'string') {
        // 字符串类型
        items += ',' + value
        // console.log('items: ', items)
      }

      // 3. 重新存储
      console.log(key, items)
      this.setItem(key, items)
    }

    /** 删除存储项数组或字符串中的某个元素或某个子串 */
    removeItem(key, value) {
      // 1. 获取存储项
      const items = this.getItem(key)

      // 2. 删除
      if (Array.isArray(items)) {
        // 数组类型
        items.splice(items.indexOf(value), 1)
      } else if (typeof items === 'string') {
        // 字符串类型
        const arr = items.split(',')
        arr.splice(arr.indexOf(value), 1)
        items = arr.join(',')
      }

      // 3. 重新存储
      this.setItem(key, items)
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
