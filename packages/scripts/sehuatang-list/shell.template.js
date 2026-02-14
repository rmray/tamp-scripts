// ==UserScript==
// @name         色花堂-帖子列表页
// @namespace    http://tampermonkey.net/
// @version      2026-02-11
// @description  try to take over the world!
// @author       You
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dmn12.vip

// @match        https://7m53.caas1.net/forum-*.html
// @match        https://7m53.caas1.net/forum.php?mod=forumdisplay&fid=*
// @match        https://dmn12.vip/forum-*.html
// @match        https://dmn12.vip/forum.php?mod=forumdisplay&fid=*

// @require      file://D:/Code/Project/Tampermonkey/tamp-scripts/packages/scripts/sehuatang-list/dist/bundle.js
// @icon      https://cdn.jsdelivr.net/gh/rmray/tamp-scripts@tm-sehuatang-list@1.1.1/packages/scripts/sehuatang-list/dist/bundle.js
// @run-at       document-end
// @connect      127.0.0.1
// @connect      【远程域名】
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==

/* global MrSehuatangList */

;(function () {
  'use strict'

  const CONFIG = {
    BASE_API_URL: 'http://127.0.0.1:8788/api/data'
    // BASE_API_URL: 'https://【远程域名】/api/data'
  }

  MrSehuatangList.main(CONFIG)
})()
