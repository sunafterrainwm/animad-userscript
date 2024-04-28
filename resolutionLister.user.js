// ==UserScript==
// @name         動畫瘋解析度顯示器
// @description  不用開始播放就可以知道該部番劇能播放的解析度！註：必須要有動畫瘋會員才能顯示完整列表
// @namespace    https://github.com/sunafterrainwm/animad-userscript
// @supportURL   https://github.com/sunafterrainwm/animad-userscript/issues
// @downloadURL  https://github.com/sunafterrainwm/animad-userscript/raw/master/resolutionLister.user.js
// @updateURL    https://github.com/sunafterrainwm/animad-userscript/raw/master/resolutionLister.user.js
// @version      2024-04-28.01
// @author       sunafterrainwm
// @licence      BSD 3-Clause; https://opensource.org/license/bsd-3-clause
// @match        https://ani.gamer.com.tw/animeVideo.php?*
// @icon         https://ani.gamer.com.tw/apple-touch-icon-72.jpg
// @require      https://unpkg.com/xhook@1.6.2/dist/xhook.min.js
// @grant        none
// @run-at       document-end
// ==/UserScript==

/* global $, xhook */

(function () {
    'use strict';

    const ResolutionListerLoadFromPage = true; // 盡可能從頁面中攔截所需參數而非調用Api

    const thisUrl = new URL(window.location.href);
    const animeSn = thisUrl.searchParams.get('sn');

    let deviceid;

    const hookContainers = {};
    const hook = (name) => {
        hookContainers[name] ??= (() => {
            const hooks = [];
            let tmp = null;
            const obj = {
                hooks,
                tmp,
                add(func) {
                    if (tmp) {
                        func(tmp);
                    }
                    hooks.push(func);
                },
                once(func) {
                    if (tmp) {
                        func(tmp);
                        return;
                    }
                    const _func = (data) => {
                        obj.remove(_func);
                        func(data);
                    };
                    hooks.push(_func);
                },
                remove(func) {
                    const index = hooks.indexOf(func);
                    if (index === -1) {
                        return false;
                    }
                    hooks.splice(index, 1);
                    return true;
                },
                fire(data) {
                    tmp = data;
                    for (const func of hooks) {
                        func(data);
                    }
                }
            }
            return obj;
        })();
        return hookContainers[name];
    };

    async function setTimeoutAsync(time) {
        return new Promise((resolve) => {
            setTimeout(resolve, time);
        });
    }

    async function loadSimpleBangumiResolution() {
        if (window.animefun && ResolutionListerLoadFromPage) {
            return window.animefun.quality;
        }

        const apiResult = await fetch('https://api.gamer.com.tw/mobile_app/anime/v4/video.php?' + new URLSearchParams({
            sn: animeSn
        }))
            .then((res) => res.json());

        if (apiResult.error) {
            return false;
        }

        return apiResult.quality;
    }

    function loadDeviceidFromCache() {
        deviceid = window.localStorage.getItem('ANIME_deviceid');
    }

    let cacheDeviceid;
    async function loadDeviceid() {
        if (ResolutionListerLoadFromPage) {
            return true;
        }
        if (cacheDeviceid) {
            return cacheDeviceid;
        }
        const apiResult = await fetch('/ajax/getdeviceid.php?' + new URLSearchParams({
            id: deviceid
        }))
            .then((res) => res.json());

        if (apiResult.deviceid) {
            cacheDeviceid = deviceid = apiResult.deviceid;
            window.localStorage.setItem('ANIME_deviceid', deviceid);
            return true;
        } else {
            console.error(apiResult);
            return false;
        }
    }

    let cacheTokenData;
    async function checkUserIsVip() {
        if (ResolutionListerLoadFromPage && !cacheTokenData) {
            await Promise.race([
                new Promise((resolve) => {
                    hook('onAjaxGetToken').once((data) => {
                        cacheTokenData = data;
                        resolve();
                    });
                }),
                setTimeoutAsync(3000)
            ]);
        }
        if (cacheTokenData) {
            return cacheTokenData.vip;
        }
        const apiResult = await fetch('/ajax/token.php?' + new URLSearchParams({
            adID: '0',
            sn: animeSn,
            device: deviceid,
            hash: Math.random().toString(16).slice(2, 14).padStart(12, '0')
        }))
            .then((res) => res.json());

        if (apiResult.error) {
            console.error(apiResult);
            return false;
        }

        cacheTokenData = apiResult;
        return apiResult.vip;
    }

    async function getM3U8Url() {
        let prevM3U8Url;
        hook('onAjaxGetM3U8Url').once((m3u8Url) => {
            prevM3U8Url = m3u8Url;
        });
        if (prevM3U8Url) {
            return prevM3U8Url;
        }
        const apiResult = await fetch('/ajax/m3u8.php?' + new URLSearchParams({
            sn: animeSn,
            device: deviceid
        }))
            .then((res) => res.json());

        return apiResult.src;
    }

    async function loadAndParseM3u8(src) {
        let prevM3U8List = null;
        // xhook 攔截不到 videojs 的 m3u8 請求
        // hook('onAjaxGetM3U8List').once((m3u8List) => {
        //     prevM3U8List = m3u8List;
        // });
        const m3u8List = prevM3U8List ?? await fetch(src)
            .then((res) => res.text());

        return parseM3u8(m3u8List);
    }
    const resolution1609 = ['640x360', '960x540', '1280x720', '1920x1080'];
    function parseM3u8(m3u8List) {
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


    xhook.after(async function (request, response) {
        let url = new URL(request.url, window.location.origin);
        if (url.hostname === 'ani.gamer.com.tw' && url.pathname === '/ajax/getdeviceid.php') {
            setTimeout(loadDeviceidFromCache, 1);
        } else if (url.hostname === 'ani.gamer.com.tw' && url.pathname === '/ajax/token.php') {
            const clonedResponse = response.clone();
            const json = await clonedResponse.json();
            if (!json.error) {
                hook('onAjaxGetToken').fire(json);
            }
        } else if (url.hostname === 'ani.gamer.com.tw' && url.pathname === '/ajax/m3u8.php') {
            const clonedResponse = response.clone();
            const json = await clonedResponse.json();
            if (!json.error) {
                hook('onAjaxGetM3U8Url').fire(json.src);
            }
        // xhook 攔截不到 videojs 的 m3u8 請求
        // } else if (url.hostname === 'bahamut.akamaized.net' && url.pathname.endsWith('.m3u8')) {
        //     const clonedResponse = response.clone();
        //     const m3u8List = await clonedResponse.text();
        //     hook('onAjaxGetM3U8List').fire(m3u8List);
        }
    });

    (async () => {
        if (!$('#video-container').length) {
            return;
        }

        let simpleResolution = await loadSimpleBangumiResolution();
        if (simpleResolution) {
            simpleResolution = '1080p';
        } else if (simpleResolution === '') {
            simpleResolution = '🗑未知';
        } else if (simpleResolution === false) {
            return;
        }

        const $resolutions = $('<span>');
        function displayResolutions(resultList) {
            $resolutions.empty().text('提供以下解析度：' + resultList.join('、'));
        }

        loadDeviceidFromCache();
        await loadDeviceid();
        const isVip = await checkUserIsVip();
        $('.anime_info_detail').append(
            $('<span>').text('｜'),
            $resolutions
                .append(
                    $('<span>').text('上限解析度：' + simpleResolution)
                )
        );
        if (isVip) {
            $resolutions.append(
                $('<span>').text('｜'),
                $('<a>')
                    .attr({
                        href: ''
                    })
                    .css({
                        color: 'black'
                    })
                    .text('點此查看可觀看的所有解析度')
                    .on('click', (e) => {
                        e.preventDefault();
                        getM3U8Url().then(loadAndParseM3u8).then(displayResolutions).catch((error) => alert('獲取解析度失敗：' + String(error)));
                    })
            );
        }
    })();
})();
