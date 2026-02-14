import {
  api,
  createElement,
  getUrl,
  removeAd,
  getId,
  matchContent,
  createPageBtns,
  fetchBookmarks,
  fetchBannedIdols,
  fetchFavoriteIdols
} from 'tm-utils'

/** 全局变量 */

// 网络请求数据
let bookmarks = [] // 书签列表
let bannedIdols = [] // Ban 列表
let favoriteIdols = [] // Fav 列表

// 通用变量
const url = getUrl() // 获取URL：origin, pathname, search, searches
const id = getId(url) // 获取帖子ID

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
const SEHUATANG_SEARCH_BASE_URL = '/search.php?mod=forum'
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
  removeAd() // 去除广告

  // 2. CSS 样式
  setStyle() // 设置 CSS 样式

  // 3. 网络请求
  bookmarks = await fetchBookmarks() // 请求书签列表数据
  bannedIdols = await fetchBannedIdols() // 请求 Ban 列表数据
  favoriteIdols = await fetchFavoriteIdols() // 请求 Fav 列表数据

  // 4. 书签功能
  bookmarkBtns = await createPageBtns({
    type: 'bookmark',
    text: '添加书签',
    textActive: '书签已添加',
    datas: bookmarks,
    id
  }) // 创建书签按钮
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
    // console.log(idolNames, banBtn, favBtn)
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
          // 女优搜索且目标搜索引擎是 Javbus，使用特殊的搜索 URL 结构
          searchUrl = baseUrl + 'search/' + encodeURIComponent(keyword)
        } else if (baseUrl.toLowerCase().includes('/search.php')) {
          // 目标搜索引擎是 Sehuatang，特殊处理
          searchUrl = baseUrl + '&kw=' + encodeURIComponent(keyword)
        } else {
          // 其他情况使用通用的搜索 URL 结构
          searchUrl = baseUrl + encodeURIComponent(keyword)
        }

        window.open(searchUrl, '_blank')
      })
    })
  })
}

// #endregion
