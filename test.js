const path = require("path")
const ytUploader = require("./index.js")
const puppeteer = require("puppeteer-extra")
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

puppeteer.launch({
    headless: false,
    // executablePath: `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`
    userDataDir: path.join(__dirname, "/dirs/bloxxy/")
}).then(browser => {
    ytUploader.upload(browser, {
    }, {
        videoPath: path.join(__dirname, "/temp/BigBuckBunny.mp4"),
        thumbnailPath: path.join(__dirname, "/temp/BigBuckBunny.jpg"),
        videoTitle: "test Video xx",
        videoDescription: "Test description for youtube",
        playlists: [
            "bestTextsseG",
            "askreddit",
            "casualconversation"
        ]
    })
})