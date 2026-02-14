import { api, createElement, getUrl, initGeneralStyle } from 'tm-utils'

/** 全局变量 */
const url = getUrl() // 获取URL：origin, pathname, search, searches
const id = getId() // 获取帖子ID
const paginationEl = document.getElementById('pgt') // 头部分页行
// 书签功能
let bookmarkBtn = null // 书签按钮
// Ban/Fav 功能
let idolNames = [] // 帖子中出现的女优名字列表
let idolsInput = null // Ban/Fav 输入框
let banBtn = null // Ban 按钮
let favBtn = null // Fav 按钮
let unBanBtn = null // Unban 按钮
let unFavBtn = null // Unfav 按钮

// 网络请求数据
let bookmarks = [] // 书签列表
let bannedIdols = [] // Ban 列表
let favoriteIdols = [] // Fav 列表

export async function main(config) {
  // 1. 初始化配置
  if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
  api.initConfig({ baseUrl: config.BASE_API_URL })

  // 2. CSS 样式
  setStyle() // 设置 CSS 样式

  // 3. 书签功能
  await fetchBookmarks() // 请求书签列表数据
  createBookmarkBtn() // 创建书签按钮
  bookmarkBtnClick() // 书签按钮点击事件

  // 4. Ban/Fav 功能
  await fetchBannedIdols() // 请求 Ban 列表数据
  await fetchFavoriteIdols() // 请求 Fav 列表数据
  await createBanFavForm() // 创建 Ban/Unban 和 Fav/Unfav 表单
  await initIdolStatus() // 初始化女优状态
  updateIdolStatus() // 更新女优状态
}

// #region CSS 样式 -------------------------------------------------------

/** [功能] 设置 CSS 样式 */
function setStyle() {
  GM_addStyle(`
    .bookmark-btn { display: inline-block; padding: 7px 10px; background: #fff; border: 1px solid #ccc; cursor: pointer; }
    .bookmark-btn:hover { background: #f0f0f0; }
    .bookmark-btn.active { background: blue; color: #fff; }

    /** Ban 和 Fav 表单 */
    .ban-fav-container { width: 300px; position: fixed; top: 20px; right: 20px; padding: 10px; box-sizing: border-box; background-color: #fff; }
  `)
}

// #endregion

// #region 书签功能 -------------------------------------------------------

/** [功能] 获取书签列表 */
async function fetchBookmarks() {
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

/** [功能] 获取 Ban 列表 */
async function fetchBannedIdols() {
  bannedIdols = await api.getCloudData('sehuatang/bannedIdols')
}

/** [功能] 获取 Fav 列表 */
async function fetchFavoriteIdols() {
  favoriteIdols = await api.getCloudData('sehuatang/favoriteIdols')
}

/** [功能] 创建 Ban/Unban 和 Fav/Unfav 表单 */
async function createBanFavForm() {
  // 1. 创建表单容器元素
  const container = createElement({
    type: 'div',
    cNames: ['ban-fav-container']
  })
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
  `
  document.body.appendChild(container)

  // 2. 获取 Ban 和 Fav 按钮元素
  idolsInput = document.getElementById('idols') // Ban/Fav 输入框
  banBtn = document.getElementById('ban') // Ban 按钮
  favBtn = document.getElementById('fav') // Fav 按钮
  unBanBtn = document.getElementById('unban') // Unban 按钮
  unFavBtn = document.getElementById('unfav') // Unfav 按钮
}

/** [功能] 初始化女优状态 */
async function initIdolStatus() {
  // 1. 获取页面中所有的女优名字元素
  const postMsgEl = document.querySelector('#postlist div[id^="post_"] td[id^="postmessage_"]')
  if (!postMsgEl) return
  const match = postMsgEl.textContent.match(/出演者：\s*([^\n\r]+)/)
  // const match = postMsgEl.textContent.match(/出演者：(?:&nbsp;|\s)*(.*?)/)
  if (match && match[1]) {
    idolNames = match[1]
      .split(/&nbsp;|\s/)
      .map((name) => name.trim())
      .filter((name) => name)
  }

  // 2. 自动填充 Ban/Fav 输入框
  if (idolNames.length > 0) {
    idolsInput.value = idolNames.join(',')
  }

  // 3. 根据 bannedIdols 和 favoriteIdols 列表设置女优状态
  idolNames.forEach((name) => {
    console.log(idolNames, banBtn, favBtn)
    if (bannedIdols.length > 0 && bannedIdols.includes(name)) {
      // 禁用其他按钮，添加禁用样式
      ;[banBtn, favBtn, unFavBtn].forEach((btn) => {
        btn.disabled = true
        btn.style.opacity = '0.5'
        btn.style.cursor = 'not-allowed'
      })
    }
    if (favoriteIdols.length > 0 && favoriteIdols.includes(name)) {
      // 禁用其他按钮，添加禁用样式
      ;[favBtn, banBtn, unBanBtn].forEach((btn) => {
        btn.disabled = true
        btn.style.opacity = '0.5'
        btn.style.cursor = 'not-allowed'
      })
    }
  })
}

/** [功能] 更新女优状态 */
function updateIdolStatus() {
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
      this.style.backgroundColor = 'red'
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
