// ==UserScript==
// @name         動畫瘋跳轉到時間
// @description  支援在網址加上 &t=秒數 指定跳轉時間戳
// @supportURL   https://github.com/sunafterrainwm/animad-userscript/issues
// @downloadURL  https://github.com/sunafterrainwm/animad-userscript/raw/master/animadJumpToTime.user.js
// @updateURL    https://github.com/sunafterrainwm/animad-userscript/raw/master/animadJumpToTime.user.js
// @version      2025-11-22.01
// @author       sunafterrainwm
// @licence      (C) 2025 sunafterrainwm; BSD 3-Clause; https://opensource.org/license/bsd-3-clause
// @match        https://ani.gamer.com.tw/animeVideo.php?*
// @icon         https://ani.gamer.com.tw/apple-touch-icon-72.jpg
// @grant        none
// @run-at       document-end
// ==/UserScript==

(async () => {
    "use strict";

    /** @type {HTMLVideoElement} */
    const video = document.getElementById("ani_video_html5_api");
    if (!video) {
        return;
    }

    const url = new URL(window.location.href);
    if (url.searchParams.has('t')) {
        const timeString = url.searchParams.get('t');
        url.searchParams.delete('t');
        window.history.replaceState(null, '', url.href);

        const formatAbleMatch = /^(?:(\d+):)?(\d+):(\d+)([\.,]\d+)?$/.exec(timeString);
        let time = 0;
        if (formatAbleMatch) {
            const [, h, m, s, ms] = formatAbleMatch;
            time =
                Number.parseInt(h || "0", 10) * 3600 +
                Number.parseInt(m || "0", 10) * 60 +
                Number.parseInt(s || "0", 10) +
                Number.parseFloat("0" + ms);
        } else {
            time = Number.parseFloat(timeString);
        }
        if (Number.isNaN(time)) {
            alert("抱歉，時間戳無效！");
            return;
        }

        while (!document.querySelector(".container-player .R18")) {
            // video-js
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const r18button = document.querySelector(".container-player .R18 #adult");

        if (r18button) {
            r18button.click();
            await new Promise((resolve) => {
                function callback() {
                    if (video.duration >= 10) {
                        video.removeEventListener("play", callback);
                        resolve();
                    }
                }
                video.addEventListener("play", callback);
            });
        }

        video.currentTime = time;
        video.addEventListener(
            "seeked",
            () => {
                video.pause();
            },
            { once: true }
        );
    }
})();
