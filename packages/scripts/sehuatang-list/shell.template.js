// ==UserScript==
// @name         色花堂-帖子列表页
// @namespace    http://tampermonkey.net/
// @version      2026-02-11
// @description  try to take over the world!
// @author       You
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dmn12.vip

// @match        https://dmn12.vip/forum-*.html
// @match        https://dmn12.vip/forum.php?mod=forumdisplay&fid=*

// @require      https://cdn.jsdelivr.net/gh/rmray/tamp-scripts@tamp/sehuatang-thread-list@1.1.0/packages/scripts/sehuatang-thread-list/dist/bundle.js
// @run-at       document-end
// @connect      【填入你的 API 域名】  // 例如：cdn.example.com
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';
    const CONFIG = {
        BASE_API_URL: '【填入你的 API 域名】/api/data' // 例如：https://cdn.example.com/api/data
    }

    MrSehuatangThreadList.main(CONFIG)
    
})();