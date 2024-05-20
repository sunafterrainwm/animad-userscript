// ==UserScript==
// @name         動畫瘋動畫列表名稱複製器
// @description  複製首頁上列出的動畫名字
// @namespace    https://github.com/sunafterrainwm/animad-userscript
// @supportURL   https://github.com/sunafterrainwm/animad-userscript/issues
// @downloadURL  https://github.com/sunafterrainwm/animad-userscript/raw/master/animeListCopy.user.js
// @updateURL    https://github.com/sunafterrainwm/animad-userscript/raw/master/animeListCopy.user.js
// @version      2024-05-20.01
// @author       sunafterrainwm
// @licence      (C) 2024 sunafterrainwm; BSD 3-Clause; https://opensource.org/license/bsd-3-clause
// @match        https://ani.gamer.com.tw/
// @icon         https://ani.gamer.com.tw/apple-touch-icon-72.jpg
// @grant        none
// @run-at       document-end
// ==/UserScript==

/* global $, Dialogify */

(function () {
    'use strict';

    const templateId = 'AnimadAnimeListCopy-' + String(Math.random()).slice(2);
    $('<script>')
        .attr({
            id: templateId,
            type: 'text/template'
        })
        .text('已複製。')
        .appendTo(document.body);

    for (const list of $('.animate-theme-list')) {
        const $list = $(list);
        const $listBlock = $list.find('.theme-list-block');
        if (!$listBlock.length) {
            continue;
        }
        const $button = $('<a>')
            .attr({
                href: '#'
            })
            .css('color', 'unset')
            .text('複製列表');

        $button.on('click', (e) => {
            e.preventDefault();
            window.navigator.clipboard.writeText(
                $list.find('.theme-title').text() + '\n' + Array.from($listBlock.find('.theme-name')).map(ele => $(ele).text()).join('\n')
            );
            new Dialogify('#' + templateId)
                .title('動畫瘋動畫列表名稱複製器')
                .buttons([
                    {
                        text: '確定',
                        type: Dialogify.BUTTON_PRIMARY,

                    }
                ])
                .show();
        });

        $list.find('.theme-title-block').append($button);
    }
})();
