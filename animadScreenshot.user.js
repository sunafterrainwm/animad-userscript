// ==UserScript==
// @name         動畫瘋截圖小工具
// @description  簡化自動畫瘋·Plus的截圖小工具
// @namespace    https://github.com/sunafterrainwm/animad-userscript
// @supportURL   https://github.com/sunafterrainwm/animad-userscript/issues
// @downloadURL  https://github.com/sunafterrainwm/animad-userscript/raw/master/animadScreenshot.user.js
// @updateURL    https://github.com/sunafterrainwm/animad-userscript/raw/master/animadScreenshot.user.js
// @version      2024-06-20.01
// @author       sunafterrainwm
// @licence      (C) 2024 sunafterrainwm; BSD 3-Clause; https://opensource.org/license/bsd-3-clause
// @match        https://ani.gamer.com.tw/animeVideo.php?*
// @icon         https://ani.gamer.com.tw/apple-touch-icon-72.jpg
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/2.6.1/jszip.js
// @grant        GM_addStyle
// @grant        GM.addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @connect      p2.bahamut.com.tw
// @run-at       document-end
// ==/UserScript==

/* global $, JSZip */

(function () {
    'use strict';

    const video = document.getElementById('ani_video_html5_api');
    if (!video) {
        return;
    }

    const classPrefix = 'animadScreenshot-' + String(Math.random()).slice(2, 12) + '-';

    let addStyle, xmlHttpRequest;
    if (typeof GM === 'object' && typeof GM.addStyle === 'function') {
        addStyle = GM.addStyle;
    } else if (typeof GM_addStyle === 'function') {
        addStyle = GM_addStyle;
    } else {
        addStyle = (cssText) => {
            const style = document.createElement('style');
            style.type = 'text/css';
            style.appendChild(document.createTextNode(cssText));
            document.head.appendChild(style);
            return style;
        };
    }

    if (typeof GM === 'object' && typeof GM.xmlHttpRequest === 'function') {
        xmlHttpRequest = GM.xmlHttpRequest;
    } else {
        xmlHttpRequest = GM_xmlhttpRequest;
    }

    addStyle(`
#${classPrefix}imageDisplay {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0px;
    z-index: 10;
}

#${classPrefix}wrapper {
    position: relative;
    background: var(--card-bg);
    margin: 0;
}

#${classPrefix}buttonList, #${classPrefix}screenshotList {
    display: flex;
    flex-wrap: wrap;
}

.${classPrefix}buttonBox, .${classPrefix}screenshotBox {
    margin: 20px 0px 0px 16px;
}

.${classPrefix}button, .${classPrefix}screenshot {
    display: flex;
    cursor: pointer;
}

.${classPrefix}buttonBox {
    background: #00b4d8;
    border-radius: 3px;
    width: fit-content;
}

.${classPrefix}button {
    font-size: 15px;
    color: #ffffff;
    height: 30px;
    align-items: center;
    padding: 0px 10px;
    white-space: nowrap;
}

.${classPrefix}screenshotBox {
    position: relative;
    height: 90px;
    width: 160px;
    display: inline-flex;
    justify-content: center;
    flex: 0 0 160px;
}

.${classPrefix}screenshot {
    height: 100%;
    width: 100%;
    border: 1.5px solid #00000080;
}

.${classPrefix}screenshotBoxTools {
    background-color: #00000075;
    width: 160px;
    height: 90px;
    position: absolute;
    justify-content: center;
    align-items: center;
    display: flex;
    opacity: 0;
    z-index: 1;
    --play: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 357 357' version='1.0'%3E%3Cpolygon points='38.3,0 38.3,357 318.8,178.5' fill='%2300B4D8'/%3E%3C/svg%3E");
    --save: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 459 459' version='1.0'%3E%3Cpath d='M357,0H51C23,0,0,23,0,51v357c0,28,23,51,51,51h357c28,0,51-23,51-51V102L357,0z M229.5,408 c-43.4,0-76.5-33.1-76.5-76.5s33.1-76.5,76.5-76.5s76.5,33.1,76.5,76.5S272.9,408,229.5,408z M306,153H51V51h255V153z' fill='%2300B4D8'/%3E%3C/svg%3E");
    --copy: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 561 561' version='1.0'%3E%3Cpath d='M395.3,0h-306c-28,0-51,23-51,51v357h51V51h306V0z M471.8,102H191.3c-28.1,0-51,22.9-51,51v357 c0,28,22.9,51,51,51h280.5c28,0,51-23,51-51V153C522.8,124.9,499.8,102,471.8,102z M471.8,510H191.3V153h280.5V510z' fill='%2300B4D8'/%3E%3C/svg%3E");
    --delete: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 459 459' version='1.0'%3E%3Cpath d='M76.5,408c0,28,22.9,51,51,51h204c28,0,51-23,51-51V102h-306V408z M408,25.5h-89.3L293.3,0H165.8l-25.5,25.5 H51v51h357V25.5z' fill='%2300B4D8'/%3E%3C/svg%3E");
}

.${classPrefix}screenshotBoxTools:hover {
    opacity: 1;
}

.${classPrefix}screenshotBoxTool {
    height: 35px;
    min-width: 30px;
    text-align: center;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    background-color: white;
    cursor: pointer;
    margin: 0px 5px;
    border-width: 1px;
    border-style: solid;
    border-color: #bbbbbb6b;
    border-image: initial;
    border-radius: 5px;
    padding: 0px 3px;
}

.${classPrefix}screenshotBoxTool::before {
    width: 18px;
    height: 18px;
    text-decoration: none;
}

.${classPrefix}screenshotBoxTool-play::before {
    content: var(--play);
}

.${classPrefix}screenshotBoxTool-save::before {
    content: var(--save);
}

.${classPrefix}screenshotBoxTool-copy::before {
    content: var(--copy);
}

.${classPrefix}screenshotBoxTool-delete::before {
    content: var(--delete);
}
`);

    const $imageDisplay = $('<div>')
        .attr({
            id: `${classPrefix}imageDisplay`
        })
        .css('display', 'none')
        .appendTo(video.parentElement);

    function createButton(text, cb) {
        const $button = $('<a>')
            .attr({
                class: `${classPrefix}button`
            })
            .text(text)
            .on('click', cb);
        return $('<div>')
            .attr({
                class: `${classPrefix}buttonBox`
            })
            .append($button);
    }

    const $screenshotList = $('<div>')
        .attr({
            id: `${classPrefix}screenshotList`
        });

    class ImageFile {
        static images = [];

        initialFromScreenshot() {
            return new Promise((resolve) => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                ctx.save();
                this.filename = String(new Date().getTime()) + '.png';
                this.screenshotTime = video.currentTime;
                canvas.toBlob((blob) => {
                    this.blob = new Blob([blob], { type: 'image/png' });
                    this.blobUrl = URL.createObjectURL(this.blob);
                    ImageFile.append(this);
                    resolve();
                }, 'image/png');
            });
        }

        async initialFromBlob(blob, filename) {
            this.filename = filename;
            this.blob = blob;
            this.blobUrl = URL.createObjectURL(this.blob);
            if (this.blob.type !== 'image/png') {
                this.pngBlob = await ImageFile.toPng(this.blobUrl);
            }
            ImageFile.append(this);
        }

        download() {
            ImageFile.downloadFile(this);
        }

        copy() {
            try {
                navigator.clipboard.write([
                    new ClipboardItem({
                        'image/png': this.pngBlob ?? this.blob
                    })
                ]);
            } catch (error) {
                console.error(error);
                alert('複製失敗！');
            }
        }

        unref() {
            ImageFile.remove(this);
            URL.revokeObjectURL(this.blobUrl);
        }

        onmouseover() {
            $imageDisplay.show().css('content', `url(${this.blobUrl})`);
        }

        onmouseout() {
            ImageFile.onmouseout();
        }

        makeElement() {
            const $image = $('<img>')
                .attr({
                    class: `${classPrefix}screenshot`,
                    src: this.blobUrl
                })
                .on('click', (e) => {
                    e.preventDefault();
                    this.copy();
                });
            const $tools = $('<div>')
                .attr({
                    class: `${classPrefix}screenshotBoxTools`
                })
                .append(
                    $('<a>')
                        .attr({
                            class: `${classPrefix}screenshotBoxTool ${classPrefix}screenshotBoxTool-save`,
                            href: this.blobUrl,
                            download: this.filename,
                            target: '_blank'
                        }),
                    $('<span>')
                        .attr({
                            class: `${classPrefix}screenshotBoxTool ${classPrefix}screenshotBoxTool-copy`
                        })
                        .on('click', (e) => {
                            e.preventDefault();
                            this.copy();
                        }),
                    $('<span>')
                        .attr({
                            class: `${classPrefix}screenshotBoxTool ${classPrefix}screenshotBoxTool-delete`
                        })
                        .on('click', (e) => {
                            e.preventDefault();
                            this.unref();
                            this.onmouseout();
                        }),
                );
            if (this.screenshotTime !== undefined) {
                $tools.prepend(
                    $('<span>')
                        .attr({
                            class: `${classPrefix}screenshotBoxTool ${classPrefix}screenshotBoxTool-play`
                        })
                        .on('click', (e) => {
                            e.preventDefault();
                            video.currentTime = this.screenshotTime;
                            this.onmouseout();
                        })
                );
            }
            const $element = this.$element = $('<div>')
                .attr({
                    class: `${classPrefix}screenshotBox`
                })
                .on('mouseover', (e) => {
                    e.preventDefault();
                    this.onmouseover();
                })
                .on('mouseout', (e) => {
                    e.preventDefault();
                    this.onmouseout();
                })
                .append($image, $tools);
            return $element;
        }

        static onmouseout() {
            $imageDisplay.hide().css('content', '');
        }

        static toPng(imageBlobUrl) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.style.display = 'none';
                const canvas = document.createElement('canvas');
                img.onload = function () {
                    img.remove();
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
                    ctx.save();
                    canvas.toBlob(resolve, 'image/png');
                }
                img.onerror = () => {
                    img.remove();
                    reject(new Error('Convert fail.'));
                };
                img.src = imageBlobUrl;
            });
        }

        static downloadFile({ blobUrl, filename }) {
            const a = document.createElement('a');
            a.download = filename;
            a.href = blobUrl;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            a.remove();
        }

        static async createFromScreenshot() {
            const screenshot = new this();
            await screenshot.initialFromScreenshot();
            return screenshot;
        }

        static async createFromBlob(blob, filename) {
            const image = new this();
            await image.initialFromBlob(blob, filename);
            return image;
        }

        static append(image) {
            this.images.push(image);
            $screenshotList.prepend(image.makeElement());
        }

        static remove(image) {
            if (this.lock) {
                throw new Error('lock is enable!');
            }
            image.$element.remove();
            this.images.splice(this.images.indexOf(image), 1);
        }

        static async createZipAndDownload() {
            this.lock = true;
            const zip = new JSZip();
            try {
                for (const image of this.images) {
                    zip.file(image.filename, await image.blob.arrayBuffer(), {
                        binary: true
                    });
                }
                const blob = zip.generate({
                    type: 'blob',
                    compression: 'store'
                });
                const blobUrl = URL.createObjectURL(blob);
                this.downloadFile({ blobUrl, filename: 'screenshots.zip' });
                URL.revokeObjectURL(this.blobUrl);
            } finally {
                this.lock = false;
            }
        }
    }

    const $buttonList = $('<div>')
        .attr({
            id: `${classPrefix}buttonList`
        })
        .append(
            createButton('截圖', (e) => {
                e.preventDefault();
                ImageFile.createFromScreenshot().then((screenshot) => {
                    // screenshot.download();
                    // screenshot.unref();
                });
            }),
            createButton('擷取封面圖', (e) => {
                e.preventDefault();
                const poster = video.poster;
                if (!poster) {
                    alert('抱歉，尋無預覽圖！');
                    return;
                }

                xmlHttpRequest({
                    method: 'GET',
                    url: poster,
                    responseType: 'blob',
                    onload(response) {
                        ImageFile.createFromBlob(response.response, poster.split('/').pop());
                    },
                    onerror(error) {
                        console.error(error);
                        alert('擷取封面圖失敗，詳請請見控制台輸出。');
                    }
                });
            }),
            createButton('清除全部', (e) => {
                e.preventDefault();
                for (const image of [...ImageFile.images]) {
                    image.unref();
                }
            }),
            createButton('全部下載', (e) => {
                e.preventDefault();
                ImageFile.createZipAndDownload();
            })
        );

    $('<div>')
        .attr({
            id: `${classPrefix}wrapper`
        })
        .append($buttonList)
        .append($screenshotList)
        .insertBefore($('.anime-title'))
        .on('mouseleave', (e) => {
            e.preventDefault();
            // Force clear status
            ImageFile.onmouseout();
        });
})();
