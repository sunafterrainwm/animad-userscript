// ==UserScript==
// @name         動畫瘋解析度顯示器
// @description  不用開始播放就可以知道該部番劇能播放的解析度！註：必須要有動畫瘋會員
// @namespace    https://github.com/sunafterrainwm/animad-userscript
// @supportURL   https://github.com/sunafterrainwm/animad-userscript/issues
// @downloadURL  https://github.com/sunafterrainwm/animad-userscript/raw/master/resolutionLister.user.js
// @updateURL    https://github.com/sunafterrainwm/animad-userscript/raw/master/resolutionLister.user.js
// @version      2024-04-21
// @author       sunafterrainwm
// @licence      BSD 3-Clause; https://opensource.org/license/bsd-3-clause
// @match        https://ani.gamer.com.tw/animeVideo.php?*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @run-at       document-end
// ==/UserScript==

/* global $ */

(function() {
    'use strict';

    if (!document.getElementById('video-container')) {
        return;
    }

    const thisUrl = new URL(window.location.href);
    const animeSn = thisUrl.searchParams.get('sn');

    let deviceid = window.localStorage.getItem('ANIME_deviceid');

    async function loadDeviceid() {
        const apiResult = await fetch('https://ani.gamer.com.tw/ajax/getdeviceid.php?deviceid=' + deviceid)
            .then((res) => res.json());

        if (apiResult.deviceid) {
            deviceid = apiResult.deviceid;
            window.localStorage.setItem('ANIME_deviceid', deviceid);
            return true;
        } else {
            console.error(apiResult);
            return false;
        }
    }

    async function checkUserIsVip() {
        const apiResult = await fetch('https://ani.gamer.com.tw/ajax/token.php?' + new URLSearchParams({
            adID: '0',
            sn: animeSn,
            device: deviceid,
            hash: Math.random().toString(16).slice(2, 14).padStart(12, '0')
        }))
            .then((res) => res.json());

        return !!apiResult.vip;
    }

    async function getM3U8Url() {
        const apiResult = await fetch('https://ani.gamer.com.tw/ajax/m3u8.php?sn=' + animeSn + '&device=' + deviceid)
            .then((res) => res.json());

        return apiResult.src;
    }

    async function loadAndParseM3u8(src) {
        const m3u8List = await fetch(src)
            .then((res) => res.text());

        window.m3u8List = m3u8List;
        return parseM3u8(m3u8List);
    }
    const resolution1609 = ['640x360', '960x540', '1280x720', '1920x1080'];
    function parseM3u8(m3u8List) {
        const m3u8ListArray = m3u8List.split('\n').filter(line => line.startsWith('#EXT-X-STREAM-INF:'));
        const resultList = [];
        const reg = /\bRESOLUTION=(\d+x(\d+))/g;
        let m;
        while (m = reg.exec(m3u8List)) {
            const [, wh, h] = m;
            const r = h + 'p';
            if (resolution1609.includes(wh)) {
                resultList.push(r);
            } else {
                resultList.push(`${r} (${wh})`);
            }
        }

        return resultList;
    }

    function displayResolutions(resultList) {
        $('.anime_info_detail').append(
            $('<span>').text('｜'),
            $('<span>').text('本番提供以下解析度：' + resultList.join('、'))
        );
    }

    checkUserIsVip()
        .then((isVip) => {
            if (isVip) {
                getM3U8Url().then(loadAndParseM3u8).then(displayResolutions);
            }
        })
})();