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
  function getUrl(url = '') {
    const origin = window.location.origin; // https://fxc5.5qm5s.net
    const pathname = window.location.pathname; // /forum.php
    const search = window.location.search; // ?mod=forumdisplay&fid=37&page=100
    const searches = Object.fromEntries(new URLSearchParams(window.location.search)); // {mod: 'forumdisplay', fid: '37', page: '100'}

    return { origin, pathname, search, searches }
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
    zh = zh
      .replace('第', '')
      .replace('章', '')
      .replace('节', '')
      .replace('.', '')
      .replace(' ', '')
      .replace('续', '')
      .replace('【', '')
      .replace('、', '')
      .replace('：', '');
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

  /** [功能] 创建元素 */
  function createElement(option) {
    const { type = 'div', text = '', css = '', cNames = [], attrs = [], value = '', name = '' } = option;

    const el = document.createElement(type);
    el.innerText = text;
    el.style.cssText = css;
    if (el.value) el.value = value;
    if (el.name) el.name = name;
    cNames.forEach((cName) => el.classList.add(cName));
    attrs.forEach((attr) => el.setAttribute(attr.name, attr.value));

    return el
  }

  let _config = {
    baseUrl: null
  };

  /** [功能] 初始化配置 */
  function initConfig(config) {
    _config = { ..._config, ...config };
    initGeneralStyle(); // 初始化通用样式
  }

  const url = getUrl();

  async function main(config = {}) {
    // 1. 初始化配置
    if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
    initConfig({ baseUrl: config.BASE_API_URL });

    // console.log(url)

    if (['/bookcase', '/modules/article/bookcase.php'].includes(url.pathname)) {
      // 书架页
      GM_addStyle(`
      .count { position: absolute; left: 0; top: 0; width: 30px; height: 30px; background-color: #999; color: #fff; display: flex; align-items: center; justify-content: center; }
      .count2 { color: #00f;  }
      .count3 { color: #f00;  }
    `);
      updateMark(); // 是否显示更新标记
      calcUpdateCount(); // 计算更新章节数量
      setBottom(); // 置底
    } else if (url.pathname.startsWith('/book/')) {
      // 目录页
      // 修改样式
      GM_addStyle(`
      #catalog > ul a:visited {
        color: red!important;
      }
      #allchapter > ul a:visited {
        color: red!important;
      }
    `);
      scrollToBottom(); // 滚动到底部
    } else if (url.pathname.startsWith('/txt/')) {
      // 下载
      // 样式
      GM_addStyle(`
    .btn { width: 76px; height: 76px; background-color: #fff; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
    .downloaded { background-color: #f00; }
    .clear { background-color: #f00; }
    .auto-active { background-color: #0a0; color: #fff; }
  `);

      setTimeout(() => {
        autoDownloadBtn(); // 自动下载按钮
        downloadBtn(); // 下载按钮
        clearBtn(); // 清空按钮
      }, 0);
    }
  }
  /** 书架页 */

  /** 是否显示更新标记 */
  function updateMark() {
    const newnavEls = document.querySelectorAll('.newnav');

    newnavEls.forEach((el) => {
      const pEls = el.querySelectorAll('.zxzj > p');
      // console.log(pEls)
      const markText = pEls[0].querySelector('a').textContent.trim();
      const updateText = pEls[1].querySelector('a').textContent.trim();
      const labelEl = el.querySelector('h3 > a > label');

      // console.log(markText, updateText)
      if (markText === updateText && labelEl) {
        // console.log(labelEl)
        // debugger
        labelEl.style.display = 'none';
      }
    });
  }

  /** 计算更新章节数量 */
  function calcUpdateCount() {
    const chapterEls = document.querySelectorAll('.zxzj');
    // console.log(chapterEls)
    chapterEls.forEach((el) => {
      // console.log(el)
      if (!el.querySelector('p')) return
      const markTitle = el?.querySelector('p:nth-child(1) > a').textContent.trim();
      const updateTitle = el?.querySelector('p:nth-child(2) > a').textContent.trim();
      const markNum = zh2num(markTitle);
      const updateNum = zh2num(updateTitle);

      // console.log(updateNum - markNum)
      const disCount = updateNum - markNum;
      const imgBoxEl = el.parentNode.parentNode.querySelector('.imgbox');
      imgBoxEl.style.position = 'relative';
      const countEl = createElement({ cNames: ['count'], text: disCount || '' });
      if (disCount >= 50) countEl.classList.add('count3');
      else if (disCount >= 20) countEl.classList.add('count2');
      imgBoxEl.append(countEl);
    });
  }

  /** 置底 */
  function setBottom() {
    const list = [
      '多我一个后富怎么了',
      '多我一個後富怎麼了',
      '远东匹夫',
      '遠東匹夫',
      '重生九三，开局成了煤老板',
      '重生九三，開局成了煤老闆',
      '沸腾时代',
      '沸騰時代'
    ];

    const listParent = document.querySelector('.newbox>ul');
    const allListEls = document.querySelectorAll('.newbox>ul>li[id^="book"]');

    const filtedListEls = Array.from(allListEls).forEach((el) => {
      if (list.includes(el.querySelector('.newnav h3 span').textContent)) {
        el.style.border = '1px solid red';
        listParent.append(el);
      }
    });

    console.log(filtedListEls);
  }

  /** 目录页 */

  /** 滚动到底部 */
  function scrollToBottom() {
    const body = document.body;
    if (!body) return

    window.scrollTo(0, body.scrollHeight);
  }

  /** 下载 */

  /** 下载按钮 */
  function downloadBtn() {
    const fixedEl = document.querySelector('.baseScroll');
    if (!fixedEl) return
    const btnEl = createElement({ text: '下载', cNames: ['btn', 'download-btn'] });
    fixedEl.prepend(btnEl);

    // 标记已下载
    // const isDownloaded = localStorage.getItem()
    btnEl.onclick = onDownload;
  }

  function onDownload() {
    // 获取小说标题
    const title = document.querySelector('.bread > a:last-of-type').textContent;
    // console.log('title: ', title)

    // 获取章节标题/内容
    const chapter = document.querySelector('.txtnav > h1').textContent;
    let content = document.querySelector('.txtnav').innerHTML;
    if (document.querySelector('#txtcontent0')) {
      content = document.querySelector('#txtcontent0').innerHTML;
    }
    // console.log('content: ', content)

    // 过滤content内容
    content = filterContent(content, chapter);

    // 保存
    saveChapter(title, chapter, content);

    // 标记已下载
    this.classList.add('downloaded');
  }

  function filterContent(content, chapter) {
    const reg1 = new RegExp('<div class="txtinfo hide720"><span>.*?</span> <span>.*?</span></div>');
    content = content
      .replace(/<h1.*?<\/h1>/, '')
      .replace(reg1, '')
      .replace('loadAdv(2, 0);', '')
      .replace('loadAdv(3, 0);', '')
      .replace('loadAdv(10,0);', '')
      .replace('loadAdv(7, 3);', '')
      .replace('loadAdv(7,3);', '')
      .replace('&emsp;', '')

      .replace(/.*([台臺][湾灣]小[说説說][网網]|twkan|域名|本书由|GOOGLE搜索).*/gi, '')
      .replace(
        /[６|❻|➅|９|➈|❾|ｓ|ร|𝓼|Ş|Ⓢ|ѕ|𝓈|𝕤|ş|ⓢ|ֆ|ｈ|ђ|ʰ|ᕼ|Ⓗ|н|ħ|ɦ|ｕ|ᑌ|Ữ|ᵘ|𝔲|𝓊|υ|ย|ʊ|ｘ|𝔁|乂|𝓍|᙭|Ж|ⓧ|Ӽ|ｃ|ᑕ|ς|ⓒ|𝒸|¢|Č|匚|ᶜ|℃|ƈ|ｏ|ⓞ|Ø|☯|๏|𝔬|Ⓒ|𝐨|σ|ό|Ỗ|ᗝ|օ|ｍ|𝐦|𝐌|ᗰ|𝓂|м|ϻ|𝕞|爪|Μ|Ⓜ|ʍ|💘|🐤|🐨|😝|💙|👽]/gi,
        ''
      );

    // HTML字符串转DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    content = doc.querySelector('body').textContent;
    // console.log('firstLine', firstLine)

    const firstLine = getFirstLine(content);
    if (firstLine.trim() === chapter) {
      content = content.replace(firstLine, '');
    }

    return content
  }

  function getFirstLine(content) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim()) return lines[i]
    }
  }

  function saveChapter(title, chapter, content) {
    let value = localStorage.getItem(title);
    if (value) {
      // 追加
      value += chapter + '\n\n' + content + '\n\n';
      localStorage.setItem(title, value);
    } else {
      localStorage.setItem(title, chapter + '\n\n' + content + '\n\n');
    }
  }

  function clearBtn() {
    const fixedEl = document.querySelector('.baseScroll');

    const btnEl = createElement({ text: '清空', cNames: ['btn'] });

    fixedEl.append(btnEl);

    // 标记已清空
    setTimeout(() => {
      const title = document.querySelector('.bread > a:last-of-type').textContent;
      // console.log('more: ', title)
      const isClear = !localStorage.getItem(title);
      if (isClear) btnEl.classList.add('clear');
    }, 400);

    btnEl.onclick = onClear;
  }

  function onClear() {
    const title = document.querySelector('.bread > a:last-of-type').textContent;
    // console.log('more: ', title)
    localStorage.removeItem(title);
    this.classList.add('clear');
  }

  /** 自动下载 */

  const AUTO_DOWNLOAD_KEY = 'twkan_auto_download';
  const AUTO_DELAY = 2500;

  /** 自动下载按钮 */
  function autoDownloadBtn() {
    const fixedEl = document.querySelector('.baseScroll');
    if (!fixedEl) return
    const btnEl = createElement({ text: '自动', cNames: ['btn'] });
    fixedEl.prepend(btnEl);

    // 页面加载时检测是否处于自动下载状态
    const isAuto = localStorage.getItem(AUTO_DOWNLOAD_KEY);
    if (isAuto) {
      btnEl.classList.add('auto-active');
      btnEl.textContent = '停止';
      // 页面刚加载，等待后继续自动下载
      autoDownloadCycle(btnEl, true);
    }

    btnEl.onclick = () => toggleAutoDownload(btnEl);
  }

  function toggleAutoDownload(btnEl) {
    const isActive = localStorage.getItem(AUTO_DOWNLOAD_KEY);
    if (isActive) {
      stopAutoDownload(btnEl);
    } else {
      localStorage.setItem(AUTO_DOWNLOAD_KEY, '1');
      btnEl.classList.add('auto-active');
      btnEl.textContent = '停止';
      // 首次点击，立即开始下载
      autoDownloadCycle(btnEl, false);
    }
  }

  function stopAutoDownload(btnEl) {
    localStorage.removeItem(AUTO_DOWNLOAD_KEY);
    btnEl.classList.remove('auto-active');
    btnEl.textContent = '自动';
  }

  function autoDownloadCycle(btnEl, needInitialDelay) {
    const execute = () => {
      if (!localStorage.getItem(AUTO_DOWNLOAD_KEY)) return

      // 下载当前章节
      const dlBtn = document.querySelector('.download-btn');
      if (dlBtn) onDownload.call(dlBtn);

      // 等待后点击下一页
      setTimeout(() => {
        if (!localStorage.getItem(AUTO_DOWNLOAD_KEY)) return

        const nextLink = document.querySelector('.page1 > a:last-child');
        if (nextLink && nextLink.textContent.includes('下一章')) {
          nextLink.click();
        } else {
          // 没有下一章，停止自动下载
          stopAutoDownload(btnEl);
        }
      }, AUTO_DELAY);
    };

    if (needInitialDelay) {
      setTimeout(execute, AUTO_DELAY);
    } else {
      execute();
    }
  }

  exports.main = main;

})(this.MrTwkan = this.MrTwkan || {});
