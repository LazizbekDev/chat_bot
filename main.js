const {Telegraf} = require("telegraf");
const {
    handleRegistration,
    findContact,
    chatContact,
    getUser,
    connect,
    config
} = require('./controller/base.js');
const { handleFindingPartner } = require('./controller/findPartner.js');
const { handleMessage } = require('./controller/isCmd.js');
const {handleSession} = require("./controller/skip.js");
const {handleStopSession} = require("./controller/stop.js");
const sendBroadcastMessage = require("./controller/bc.js");
const { config: cnf } = require('dotenv');
const express = require("express");
// const colors = require('colors')

const app = express();
app.use(express.json());

cnf();

const bot = new Telegraf(process.env.botToken);
connect().then(()=>{});


bot.on('message', async (userScope) => {

    // userScope.sendMessage("hey salom")

    const body = userScope.update.message.text || userScope.message.caption || userScope.message.text || ''
    const command = body.split(' ')[0]
    const isCmd = body.startsWith('/')
    // const isGroup = userScope.chat.type.includes("group")
    const from = userScope.chat.id

    // console.log(userScope.chat)
    // Database Query

    const sender = getUser(userScope.message.from)
    // Get user ID
    const userid = sender.id
    // Get user name
    const username = sender.username
    // Owner, change in config.json
    const isOwner = config.ownerUsername.includes(username)

    // Media Type
    const isText = userScope.message.hasOwnProperty("text")
    const isImage = userScope.message.hasOwnProperty("photo")
    const isVideo = userScope.message.hasOwnProperty("video")
    const isAudio = userScope.message.hasOwnProperty("audio")
    const isSticker = userScope.message.hasOwnProperty("sticker")
    const isContact = userScope.message.hasOwnProperty("contact")
    // const isLocation = userScope.message.hasOwnProperty("location")
    const isDocument = userScope.message.hasOwnProperty("document")
    const isAnimation = userScope.message.hasOwnProperty("animation")

    if (!isCmd) {

        try {
            await handleMessage(bot, userScope, isText, isSticker, isImage, isVideo, isAudio, isContact, isDocument, isAnimation, chatContact);
        } catch (err) {
            console.log(err);

            return bot.telegram.sendMessage(from, config.mess.error.notRegistered, {parse_mode: "Markdown"});
        }
    }

    switch (command) {
        case "/register":
            await handleRegistration(bot, from, userScope);
            break;
        case "/start":
            await handleFindingPartner(from, bot, userScope);
            break;
        case "/unregister":
            findContact(from).then(async (res) => {
                if (res !== null) {
                    await res.remove();
                    await bot.telegram.sendMessage(from, config.mess.unRegisterSuccess, {parse_mode: "Markdown"});
                }
            });
            break;
        case "/next":
            await handleSession(from, bot);
            break;
        case "/stop":
            await handleStopSession(from, bot);
            break;
        case "/bc":
        case "/broadcast":
            await sendBroadcastMessage(bot, from, isOwner, isImage, userScope, body, command);
            break;
    }
})

app.get('/', (req,res) => {
    res.status(200).json({
        status: "OK",
        server: "ON"
    })
})

app.post('/', (req, res) => {
    res.status(200).json({
        status: "OK",
        server: "ON"
    })
})

const PORT = process.env.PORT || 5000;

if(process.env.NODE_ENV === "PRODUCTION"){
    bot.launch({
        webhook:{
            domain: process.env.URL,// Your domain URL (where server code will be deployed)
            port: PORT
        }
    }).then(() => {
        console.info(`The bot ${bot.botInfo.username} is running on server`);
    });
} else { // if local use Long-polling
    bot.launch().then(() => {
        console.info(`The bot ${bot.botInfo.username} is running locally`);
    });
}