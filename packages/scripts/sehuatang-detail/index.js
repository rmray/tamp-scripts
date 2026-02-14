import { api, createElement, getUrl, initGeneralStyle } from 'tm-utils'

/** 全局变量 */
// let cache = getCache() // 本地存储
const url = getUrl() // 获取URL：origin, pathname, search, searches
const id = getId() // 获取帖子ID
const paginationEl = document.getElementById('pgt') // 头部分页行
let bookmarkBtn = null // 书签按钮
let bookmarks = [] // 书签列表

export async function main(config) {
  // 1. 初始化配置
  if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
  api.initConfig({ baseUrl: config.BASE_API_URL })

  // 2. CSS 样式
  setStyle() // 设置 CSS 样式

  // 3. 书签功能
  await getBookmarks() // 获取书签列表
  createBookmarkBtn() // 创建书签按钮
  bookmarkBtnClick() // 书签按钮点击事件

  // 4. Ban/Fav 功能
  createBanFavForm() // 创建 Ban/Unban 和 Fav/Unfav 表单
  updateIdols() // 更新女优状态
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
  `)
}

// #endregion

// #region 书签功能 -------------------------------------------------------

/** [功能] 获取书签列表 */
async function getBookmarks() {
  bookmarks = await api.getCloudData('sehuatang/bookmarks')
}

/** [功能] 创建书签按钮 */
function createBookmarkBtn() {
  // 1. 创建书签按钮元素
  bookmarkBtn = createElement({
    type: 'button',
    text: '添加书签',
    cNames: ['bookmark-btn']
  })

  // 2. 根据 bookmarks 列表设置按钮状态
  if (bookmarks.includes(id)) {
    bookmarkBtn.classList.add('active')
    bookmarkBtn.innerHTML = '书签已添加'
  }

  // 3. 将按钮添加到页面
  paginationEl?.append(bookmarkBtn)
}

/** [功能] 书签按钮点击事件 */
function bookmarkBtnClick() {
  // 1. 安全检查
  if (!bookmarkBtn) throw new Error('书签按钮未找到')

  bookmarkBtn.addEventListener('click', (e) => {
    // 2. 阻止默认行为
    e.preventDefault()

    const classList = e.target.classList

    // 3. 切换书签状态
    if (classList.contains('active')) {
      // 已添加书签，执行取消书签逻辑
      classList.remove('active')
      e.target.innerHTML = '添加书签'

      // 取消书签的 API 调用
      api.removeCloudData('sehuatang/bookmarks', [id])
    } else {
      // 未添加书签，执行添加书签逻辑
      classList.add('active')
      e.target.innerHTML = '书签已添加'

      // 添加书签的 API 调用
      api.setCloudData('sehuatang/bookmarks', [id])
    }
  })
}

// #endregion

// #region Ban/Fav 功能 -------------------------------------------------------

/** [功能] 创建 Ban/Unban 和 Fav/Unfav 表单 */
function createBanFavForm() {
  const container = createElement({
    type: 'div',
    cNames: ['ban-fav-container']
  })
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
  `
  document.body.appendChild(container)
}

/** [功能] 更新女优状态 */
function updateIdols() {
  const options = ['ban', 'unban', 'fav', 'unfav']

  // 1. 批量绑定按钮事件
  options.forEach((option) => {
    const btn = document.querySelector(`.ban-fav-container .${option}`)
    btn.addEventListener('click', async function () {
      // 2. 获取输入的女优名字列表
      const textarea = document.querySelector('.ban-fav-container textarea[name="idols"]')
      const idols = textarea.value
        .split(',')
        .map((name) => name.trim()) // 去除名字前后空格
        .filter((name) => name) // 去除空 name 字符串
      if (idols.length === 0) return

      // 3. 根据按钮类型执行不同的 API 调用
      if (option === 'ban') {
        await api.setCloudData('sehuatang/bannedIdols', idols)
      } else if (option === 'unban') {
        await api.removeCloudData('sehuatang/bannedIdols', idols)
      } else if (option === 'fav') {
        await api.setCloudData('sehuatang/favoriteIdols', idols)
      } else if (option === 'unfav') {
        await api.removeCloudData('sehuatang/favoriteIdols', idols)
      }

      // 4. 更新并高亮按钮状态
      this.style.backgroundColor = 'blue'
      this.style.color = '#fff'
    })
  })
}

// #endregion

// #region 工具方法 -------------------------------------------------------

/** 获取帖子ID */
function getId() {
  return Number(url.pathname.startsWith('/forum.php') ? url.searches.tid : url.pathname.split('-')[1])
}

// #endregion
