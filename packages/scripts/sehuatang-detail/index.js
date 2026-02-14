import { api, createElement, getUrl, initGeneralStyle } from 'tm-utils'

/** 全局变量 */

// 网络请求数据
let bookmarks = [] // 书签列表
let bannedIdols = [] // Ban 列表
let favoriteIdols = [] // Fav 列表

// 通用变量
const url = getUrl() // 获取URL：origin, pathname, search, searches
const id = getId() // 获取帖子ID

// 页面元素
const paginationEl = document.getElementById('pgt') // 头部分页行

// 书签功能
let bookmarkBtns = [] // 书签按钮

// Ban/Fav 功能
let idolNames = [] // 帖子中出现的女优名字列表
let idolsInput = null // Ban/Fav 输入框
let banBtn = null // Ban 按钮
let favBtn = null // Fav 按钮
let unBanBtn = null // Unban 按钮
let unFavBtn = null // Unfav 按钮

// 搜索番号功能
const SEHUATANG_SEARCH_BASE_URL =
  '/search.php?mod=forum&searchid=0&searchmd5=718fd9a1791fbce8968a682435a51b33&orderby=lastpost&ascdesc=desc&searchsubmit=yes&kw='
const JAVBUS_SEARCH_BASE_URL = 'https://www.busjav.bond/'
let searchBaseUrls = [SEHUATANG_SEARCH_BASE_URL, JAVBUS_SEARCH_BASE_URL] // 目标搜索引擎 URL 列表

let code = null // 番号
let searchModeSelects = [] // 搜索模式选择按钮
let searchCodeBtns = [] // 搜索番号按钮
let searchIdolBtns = [] // 搜索女优按钮

export async function main(config) {
  // 1. 初始化配置
  if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
  api.initConfig({ baseUrl: config.BASE_API_URL })

  // 2. CSS 样式
  setStyle() // 设置 CSS 样式

  // 3. 网络请求
  await fetchBookmarks() // 请求书签列表数据
  await fetchBannedIdols() // 请求 Ban 列表数据
  await fetchFavoriteIdols() // 请求 Fav 列表数据

  // 4. 书签功能
  bookmarkBtns = await createPageBtns({ type: 'bookmark', text: '添加书签', textActive: '书签已添加' }) // 创建书签按钮
  bookmarkBtnClick() // 书签按钮点击事件

  // 5. Ban/Fav 功能
  await createBanFavForm() // 创建 Ban/Unban 和 Fav/Unfav 表单
  await initIdolStatus() // 初始化女优状态
  updateIdolStatus() // 更新女优状态

  // 6. 搜索番号/女优
  code = matchContent('code')
  searchModeSelects = await createPageBtns({ type: 'search-mode', text: '搜索模式' }) // 创建搜索模式选择按钮
  searchCodeBtns = await createPageBtns({ type: 'search-code', text: `搜索`, values: [code] }) // 创建搜索番号按钮
  searchIdolBtns = await createPageBtns({ type: 'search-idols', text: '搜索', values: idolNames }) // 创建搜索女优按钮
  switchSearchMode() // 切换搜索模式
  searchBtnsClick() // 点击执行搜索番号/女优
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
  `)
}

// #endregion

// #region 网络请求 -------------------------------------------------------

/** [功能] 获取书签列表 */
async function fetchBookmarks() {
  bookmarks = await api.getCloudData('sehuatang/bookmarks')
}

/** [功能] 获取 Ban 列表 */
async function fetchBannedIdols() {
  bannedIdols = await api.getCloudData('sehuatang/bannedIdols')
}

/** [功能] 获取 Fav 列表 */
async function fetchFavoriteIdols() {
  favoriteIdols = await api.getCloudData('sehuatang/favoriteIdols')
}

// #endregion

// #region 书签功能 -------------------------------------------------------

/** [功能] 书签按钮点击事件 */
function bookmarkBtnClick() {
  // 1. 安全检查
  if (!bookmarkBtns[0]) throw new Error('书签按钮未找到')

  bookmarkBtns[0].addEventListener('click', (e) => {
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
  idolNames = matchContent('idol')

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

// #region 搜索功能 -------------------------------------------------------

/** [功能] 切换搜索模式 */
function switchSearchMode() {
  searchModeSelects[0].addEventListener('change', function () {
    const mode = this.value

    switch (mode) {
      case 'sehuatang':
        searchBaseUrls = [SEHUATANG_SEARCH_BASE_URL]
        break
      case 'javbus':
        searchBaseUrls = [JAVBUS_SEARCH_BASE_URL]
        break
      case 'both':
      default:
        searchBaseUrls = [SEHUATANG_SEARCH_BASE_URL, JAVBUS_SEARCH_BASE_URL]
    }
  })
}

/** [功能] 点击执行搜索番号/女优 */
function searchBtnsClick() {
  ;[...searchCodeBtns, ...searchIdolBtns].forEach((btn) => {
    btn.addEventListener('click', function () {
      const isIdolSearch = searchIdolBtns.includes(this)
      const keyword = this.textContent.replace('搜索', '').trim()

      // 执行搜索，批量打开搜索引擎 URL
      searchBaseUrls.forEach((baseUrl) => {
        let searchUrl = ''
        if (isIdolSearch && (baseUrl.toLowerCase().includes('busjav') || baseUrl.toLowerCase().includes('javbus'))) {
          searchUrl = baseUrl + 'search/' + encodeURIComponent(keyword)
        } else {
          searchUrl = baseUrl + encodeURIComponent(keyword)
        }

        window.open(searchUrl, '_blank')
      })
    })
  })
}

// #endregion

// #region 工具方法 -------------------------------------------------------

/** [工具方法] 获取帖子ID */
function getId() {
  return Number(url.pathname.startsWith('/forum.php') ? url.searches.tid : url.pathname.split('-')[1])
}

/**
 * [工具方法] 匹配指定内容
 * target: 可选值：idol/code/magnet/torrent
 */
function matchContent(target) {
  let matched = null
  let match = null

  // 1. 获取帖子内容元素
  const postMsgEl = document.querySelector('#postlist div[id^="post_"] td[id^="postmessage_"]')
  const titleEl = document.querySelector('#thread_subject')
  console.log(titleEl)
  if (!postMsgEl) return

  // 2. 根据目标类型匹配内容
  switch (target) {
    case 'idol':
      match = postMsgEl.textContent.match(/(?:【出演女优】|出演者)[:：][ \t]*([^\n\r]*)/)
      // console.log(postMsgEl.textContent)
      if (match && match[1]) {
        matched = match[1]
          .split(/&nbsp;|\s/)
          .map((name) => name.trim())
          .filter((name) => name)
      }
      break
    case 'code':
      match = titleEl.textContent.match(/^(Tokyo Hot\s+n\d+|[a-zA-Z0-9]+-[a-zA-Z0-9-]+(?<!-))/)
      console.log(match)
      if (match && match[1]) {
        matched = match[1].trim().toUpperCase()
      }
      break
    case 'magnet':
      break
    case 'torrent':
      break
    default:
  }

  // 3. 返回匹配结果
  return matched
}

/** [工具方法] 创建分页行按钮 */
async function createPageBtns(options = {}) {
  // 1. 获取变量
  let { type, text, values = [], textActive = text } = options
  const btns = []

  // 2. 创建书签按钮元素
  let i = 0
  do {
    let textOrigin = text
    let btn = null

    if (values.length) {
      textOrigin = textOrigin + ' ' + values[i]
    }

    if (type === 'search-mode') {
      // 3. 特殊处理 search-mode 情况
      btn = createElement({
        type: 'select',
        name: 'mode',
        cNames: [`${type}-select`, 'page-btn']
      })
      btn.innerHTML = `
        <option value="both" selected>同时搜索</option>
        <option value="sehuatang">色花堂</option>
        <option value="javbus">JavBus</option>  
      `
    } else {
      btn = createElement({
        type: type === 'button',
        text: textOrigin,
        cNames: [`${type}-btn`, 'page-btn']
      })
    }

    // 3. 特殊处理 bookmark 情况
    if (type === 'bookmark') {
      // 根据 bookmarks 列表设置按钮状态
      if (bookmarks.includes(id)) {
        btn.classList.add('active')
        btn.innerHTML = textActive
      }
    }

    // 4. 将按钮添加到页面，同时返回按钮元素
    paginationEl?.append(btn)
    btns.push(btn)
    i++
  } while (i < values.length)

  return btns
}

// #endregion
