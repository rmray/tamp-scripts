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

  let _config = {
    baseUrl: null
  };

  /** [功能] 初始化配置 */
  function initConfig(config) {
    _config = { ..._config, ...config };
    initGeneralStyle(); // 初始化通用样式
  }

  async function main(config = {}) {
    // 1. 初始化配置
    if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
    initConfig({ baseUrl: config.BASE_API_URL });

    GM_addStyle(`
    .count { position: absolute; left: 0; top: 0; width: 30px; height: 30px; background-color: #999; color: #fff; display: flex; align-items: center; justify-content: center; }
    .count2 { color: #00f;  }
    .count3 { color: #f00;  }
  `);

    updateMark(); // 是否显示更新标记

    calcUpdateCount(); // 计算更新章节数量

    setBottom(); // 置底
  }

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
      const markNum = MrUtils.zh2num(markTitle);
      const updateNum = MrUtils.zh2num(updateTitle);

      // console.log(updateNum - markNum)
      const disCount = updateNum - markNum;
      const imgBoxEl = el.parentNode.parentNode.querySelector('.imgbox');
      imgBoxEl.style.position = 'relative';
      const countEl = MrUtils.createElement({ cNames: ['count'], text: disCount || '' });
      if (disCount >= 50) countEl.classList.add('count3');
      else if (disCount >= 20) countEl.classList.add('count2');
      imgBoxEl.append(countEl);
    });
  }

  /** 置底 */
  function setBottom() {
    // console.log('first')
    const list = ['多我一个后富怎么了', '腐朽世界'];

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

  exports.main = main;

})(this.MrTwkanBookcase = this.MrTwkanBookcase || {});
