// ==UserScript==
// @name         巴哈ACG資料庫 跳到編輯歷史
// @description  新增按鈕以便直接跳到編輯歷史
// @namespace    https://github.com/sunafterrainwm/animad-userscript
// @supportURL   https://github.com/sunafterrainwm/animad-userscript/issues
// @downloadURL  https://github.com/sunafterrainwm/animad-userscript/raw/master/acgJumpToHistory.user.js
// @updateURL    https://github.com/sunafterrainwm/animad-userscript/raw/master/acgJumpToHistory.user.js
// @version      2024-10-12.01
// @author       sunafterrainwm
// @licence      (C) 2024 sunafterrainwm; BSD 3-Clause; https://opensource.org/license/bsd-3-clause
// @match        https://acg.gamer.com.tw/acgDetail.php?*
// @icon         https://i2.bahamut.com.tw/apple-touch-icon-72x72.png
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.0/jquery.min.js
// @grant        none
// @run-at       document-end
// ==/UserScript==

/* global $ */

(function () {
    'use strict';

    const $acgItemTitle = $('.ACG-info-container > h1').first();
    const acgSn = new URL(window.location.href).searchParams.get('s');
    if (!$acgItemTitle.length || !acgSn) {
        return;
    }

    $('#ACG-box1mark')
        .prepend(
            $('<a>')
                .attr({
                    href: 'https://acg.gamer.com.tw/history.php?' + new URLSearchParams({
                        s: acgSn,
                        te: $acgItemTitle.text().trim() || '(placeholder)'
                    }).toString()
                })
                .append($('<button>').text('編輯歷史'))
        );

    $('.ACG-mster_box6 .BH-master_more2')
        .css({
            display: 'flex',
            'justify-content': 'flex-end',
            'align-items': 'center'
        })
        .append(
            $('<a>')
                .attr({
                    href: 'https://wiki2.gamer.com.tw/history.php?' + new URLSearchParams({
                        n: acgSn + ':default',
                        ss: acgSn
                    }).toString()
                })
                .append($('<button>').text('編輯歷史'))
        );
})();
