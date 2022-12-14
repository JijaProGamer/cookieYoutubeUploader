
const path = require("path")

const { uploadFileXPath, uploadFileSelector, clickSelector, 
    clickXPath, goto, waitForSelector, waitForXPath, 
    typeSelector, typeXPath, sleep } = require(path.join(__dirname, "/functions.js"))

let XPaths = {
    videoDescription: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-basics/div[2]/ytcp-social-suggestions-textbox/ytcp-form-input-container/div[1]/div[2]/div/ytcp-social-suggestion-input/div`,
    videoTitle: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-basics/div[1]/ytcp-social-suggestions-textbox/ytcp-form-input-container/div[1]/div[2]/div/ytcp-social-suggestion-input/div`,
    thumbnailUpload: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-basics/div[3]/ytcp-thumbnails-compact-editor-old/div[3]/ytcp-thumbnails-compact-editor-uploader-old`
}

module.exports = async (browser, loginDetails, videoDetails) => {
    return new Promise(async (resolve, reject) => {
        setTimeout(async () => {
            let page = (await browser.pages())[0]

            goto(page, `https://accounts.google.com`, 0).then(async () => {
                if ((await page.$$(`input[type="email"]`))[0]) {
                    await typeSelector(page, `input[type="email"]`, loginDetails.email)
                    await clickSelector(page, `#identifierNext > div > button`)
                    await typeSelector(page, `input[type="password"]`, loginDetails.password)
                    await clickSelector(page, `#passwordNext > div > button`)
                    await page.waitForNavigation({ waitUntil: "networkidle0" })
                }

                goto(page, `https://youtube.com/upload`, 0).then(async () => {
                    await uploadFileSelector(page, "#select-files-button", videoDetails.videoPath)
                    await waitForXPath(page, XPaths.videoTitle)
                    await sleep(200)
                    await typeXPath(page, XPaths.videoTitle, videoDetails.videoTitle)
                    await sleep(200)
                    await typeXPath(page, XPaths.videoDescription, videoDetails.videoDescription)
                    await sleep(200)

                    if (videoDetails.thumbnailPath) {
                        await uploadFileXPath(page, XPaths.thumbnailUpload, videoDetails.thumbnailPath)
                    }

                    if (videoDetails.playlists && videoDetails.playlists.length >= 1) {
                        await page.evaluate(() => {
                            document.querySelector("#basics > div:nth-child(9) > div.compact-row.style-scope.ytcp-video-metadata-editor-basics > div:nth-child(1) > ytcp-video-metadata-playlists > ytcp-text-dropdown-trigger").scrollIntoView()
                        })

                        await clickSelector(page, "#basics > div:nth-child(9) > div.compact-row.style-scope.ytcp-video-metadata-editor-basics > div:nth-child(1) > ytcp-video-metadata-playlists > ytcp-text-dropdown-trigger")

                        let difference = await page.evaluate((playlists) => {
                            return new Promise((resolve, reject) => {
                                let list = document.querySelector("#items")
                                let start = seconds = new Date().getTime() / 1000;

                                let buttonsDone = []

                                const arraysEqual = (a1, a2) => {
                                    return JSON.stringify(a1) == JSON.stringify(a2)
                                }

                                const findDeselectedItem = (CurrentArray, PreviousArray) => {
                                    let CurrentArrSize = CurrentArray.length;
                                    let PreviousArrSize = PreviousArray.length;

                                    let difference = []

                                    for (var j = 0; j < PreviousArrSize; j++) {
                                        if (CurrentArray.indexOf(PreviousArray[j]) == -1) difference.push(PreviousArray[j])
                                    }

                                    return difference;

                                }

                                let interval1 = setInterval(() => {
                                    let current = seconds = new Date().getTime() / 1000;
                                    if ((current - start) > 5) {
                                        clearInterval(interval1)
                                        resolve({ equals: true })
                                        return;
                                    }

                                    if (list.childElementCount > 1) {
                                        for (let i = 2; i <= list.childElementCount; i += 1) {
                                            let textParent = document.querySelector(`#items > ytcp-ve:nth-child(${i}) > li > label`)
                                            let text = textParent.childNodes[1].textContent

                                            if (playlists.includes(text)) {
                                                let button = textParent.childNodes[0]
                                                button.click()

                                                buttonsDone.push(text)
                                            }
                                        }

                                        resolve({ equals: arraysEqual(playlists, buttonsDone), difference: findDeselectedItem(buttonsDone, playlists) })
                                        clearInterval(interval1)
                                        return;
                                    }
                                }, 500)
                            })
                        }, videoDetails.playlists)

                        if (!difference.equals) {
                            for (let i = 0; i < difference.difference.length; i += 1) {
                                await sleep(100)
                                await clickSelector(page, `#dialog > div.action-buttons.style-scope.ytcp-playlist-dialog > ytcp-button.new-playlist-button.action-button.style-scope.ytcp-playlist-dialog`)
                                await sleep(100)
                                await typeSelector(page, `#create-playlist-form > div.input-container.title.style-scope.ytcp-playlist-dialog > ytcp-form-textarea > div > textarea`, difference.difference[i])
                                await clickSelector(page, `#dialog > div.action-buttons.create-playlist-buttons.style-scope.ytcp-playlist-dialog > ytcp-button.create-playlist-button.action-button.style-scope.ytcp-playlist-dialog`)
                                await sleep(1000)

                                await page.evaluate((textNeeded) => {
                                    return new Promise((resolve, reject) => {
                                        let list = document.querySelector("#items")

                                        for (let i = 2; i <= list.childElementCount; i += 1) {
                                            let textParent = document.querySelector(`#items > ytcp-ve:nth-child(${i}) > li > label`)
                                            let text = textParent.childNodes[1].textContent

                                            if (text == textNeeded) {
                                                let button = textParent.childNodes[0]
                                                button.click()
                                            }
                                        }

                                        resolve()
                                    })
                                }, difference.difference[i])
                            }
                        }

                        await clickSelector(page, "#next-button")
                    }

                    await clickSelector(page, "#next-button")
                    await clickSelector(page, "#next-button")
                    await clickSelector(page, "#next-button")

                    let finishedText = await waitForXPath(page, `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[2]/div/div[1]/ytcp-video-upload-progress/span`)
                    await new Promise((resolve2, reject2) => {
                        let lastInterval = setInterval(async () => {
                            let currentText = await page.evaluate(name => name.innerText, finishedText);

                            if (currentText.includes("Check")) {
                                clearInterval(lastInterval)
                                await clickSelector(page, "#done-button")

                                resolve2()
                            }
                        }, 250);
                    })

                    await clickSelector(page, `#close-icon-button > tp-yt-iron-icon`)
                }).catch(err => {
                    reject(err)
                })

            }).catch(err => {
                reject(err)
            })
        }, 500);
    })
}