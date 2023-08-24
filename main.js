const {Telegraf} = require("telegraf");
const {
    handleRegistration,
    findContact,
    chatContact,
    findContactPartner,
    sortPartnerId,
    getUser,
    connect,
    startSearch
} = require('./controller/base.js');
const { handleFindingPartner } = require('./controller/findPartner.js');
const { handleMessage } = require('./controller/isCmd.js');
const {readFileSync} = require("fs");

const config = JSON.parse(readFileSync("./config.json"));

const bot = new Telegraf(config.botToken);
connect().then(()=>{});
const db = require("./model/Contact");


bot.on('message', async (lintof) => {

    const body = lintof.update.message.text || lintof.message.caption || lintof.message.text || ''
    const command = body.split(' ')[0]
    const isCmd = body.startsWith('/')
    const isGroup = lintof.chat.type.includes("group")
    const from = lintof.chat.id

    // console.log(lintof.chat)
    // Database Query

    const sender = getUser(lintof.message.from)
    // Get user ID
    const userid = sender.id
    // Get user name
    const username = sender.username
    // Owner, change in config.json
    const isOwner = config.ownerUsername.includes(username)

    // Media Type
    const isText = lintof.message.hasOwnProperty("text")
    const isImage = lintof.message.hasOwnProperty("photo")
    const isVideo = lintof.message.hasOwnProperty("video")
    const isAudio = lintof.message.hasOwnProperty("audio")
    const isSticker = lintof.message.hasOwnProperty("sticker")
    const isContact = lintof.message.hasOwnProperty("contact")
    const isLocation = lintof.message.hasOwnProperty("location")
    const isDocument = lintof.message.hasOwnProperty("document")
    const isAnimation = lintof.message.hasOwnProperty("animation")

    if (!isCmd) {

        try {
            await handleMessage(bot, lintof, isText, isSticker, isImage, isVideo, isAudio, isContact, isDocument, isAnimation, chatContact);

        } catch (err) {
            console.log(err);

            return bot.telegram.sendMessage(from, config.mess.error.notRegistered, {parse_mode: "Markdown"});
        }
    }

    switch (command) {
        case "/register":
            await handleRegistration(bot, from, lintof);
            break;
        case "/start":
            await handleFindingPartner(from, bot, lintof);
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
            await findContact(from)
                .then(async (res) => {
                    let con = res;
                    if (res.status === 0)
                        return bot.telegram.sendMessage(
                            from,
                            config.mess.error.sessionNotFound, {parse_mode: "Markdown"});
                    findContactPartner(con.contactId)
                        .then(async (res) => {
                            bot.telegram.sendMessage(
                                con.partnerId,
                                config.mess.error.partnerStopSession, {parse_mode: "Markdown"});
                            con.status = 1;
                            con.partnerId = null;
                            await con.save();
                            res.partnerId = null;
                            res.status = 0;
                            await res.save();
                            bot.telegram.sendMessage(from, config.mess.error.nextSession, {parse_mode: "Markdown"});
                            const findPartner = new Promise((resolve, reject) => {
                                setInterval(async () => {
                                        const partnerQuery = await db
                                            .findOne({
                                                status: 1, partnerId: null
                                            })
                                            .where("contactId")
                                            .ne(from);
                                        if (partnerQuery) {
                                            resolve(partnerQuery);
                                        } else {
                                            reject(partnerQuery);
                                        }
                                    },
                                    100);
                            });
                            findPartner
                                .then(async (res) => {
                                    let con = res;
                                    findContact(from)
                                        .then(async (res) => {
                                            res.partnerId = con.contactId;
                                            con.partnerId = res.contactId;
                                            await res.save();
                                            await con.save();
                                            bot.telegram.sendMessage(
                                                con.contactId,
                                                config.mess.partnerFound, {parse_mode: "Markdown"});
                                            bot.telegram.sendMessage(
                                                res.partnerId,
                                                config.mess.partnerFound, {parse_mode: "Markdown"});
                                        })
                                        .catch((err) => {
                                            bot.telegram.sendMessage(
                                                from,
                                                config.mess.error.notRegistered, {parse_mode: "Markdown"});
                                        });
                                })
                                .catch(() => {
                                    setTimeout(async () => {
                                        findContact(from).then(async (res) => {
                                            if (res.partnerId === null) {
                                                bot.telegram.sendMessage(
                                                    from,
                                                    config.mess.error.partnerNotFound, {parse_mode: "Markdown"}
                                                );
                                                res.status = 0;
                                                await res.save();
                                            }
                                        });
                                    }, 20000);
                                });
                        })
                        .catch(async (err) => {
                            con.status = 0;
                            con.partnerId = null;
                            await con.save();
                            bot.telegram.sendMessage(
                                from,
                                config.mess.error.isBrokenPartner, {parse_mode: "Markdown"}
                            );
                        });
                })
                .catch(() => {
                    bot.telegram.sendMessage(from, config.mess.error.notRegistered, {parse_mode: "Markdown"});
                });
            break;
        case "/stop":
            await findContact(from)
                .then(async (res) => {
                    let con = res;
                    if (res.status === 0)
                        return bot.telegram.sendMessage(
                            from,
                            config.mess.error.sessionNotFound, {parse_mode: "Markdown"}
                        );
                    findContactPartner(from)
                        .then(async (res) => {
                            bot.telegram.sendMessage(
                                con.partnerId,
                                config.mess.error.partnerStopSession, {parse_mode: "Markdown"}
                            );
                            con.status = 0;
                            con.partnerId = null;
                            await con.save();
                            res.status = 0;
                            res.partnerId = null;
                            await res.save();
                            bot.telegram.sendMessage(from, config.mess.error.stopSession, {parse_mode: "Markdown"});
                        })
                        .catch(async (err) => {
                            con.status = 0;
                            con.partnerId = null;
                            await con.save();
                            bot.telegram.sendMessage(
                                from,
                                config.mess.error.isBrokenPartner, {parse_mode: "Markdown"}
                            );
                        });
                })
                .catch(() => {
                    bot.telegram.sendMessage(from, config.mess.error.notRegistered, {parse_mode: "Markdown"});
                });
            break;
        case "/bc":
        case "/broadcast":
            const getUserName = await db.find().select("contactId");
            if (!isOwner) return bot.telegram.sendMessage(from, "bu xusisiyat faqat owner uchun");
            if (isImage) {
                txtbc = `*BROADCAST*\n\n${body.slice(command.length + 1)}`;
                for (let i = 0; i < getUserName.length; i++) {
                    bot.telegram.sendPhoto(getUserName[i].contactId, lintof.message.photo[2].file_id, {
                        caption: txtbc,
                        parse_mode: "Markdown"
                    });
                }
            } else if (isVideo) {
                txtbc = `*BROADCAST*\n\n${body.slice(command.length + 1)}`;
                for (let i = 0; i < getUserName.length; i++) {
                    bot.telegram.sendVideo(getUserName[i].contactId, lintof.message.video.file_id, {
                        caption: txtbc,
                        parse_mode: "Markdown"
                    });
                }
            } else {
                txtbc = `*BROADCAST*\n\n${body.slice(command.length + 1)}`;
                for (let i = 0; i < getUserName.length; i++) {
                    bot.telegram.sendMessage(getUserName[i].contactId, txtbc, {parse_mode: "Markdown"});
                }
            }
            break;
    }
})

bot.launch()
//
// // Enable graceful stop
// process.once('SIGINT', () => bot.stop('SIGINT'))
// process.once('SIGTERM', () => bot.stop('SIGTERM'))
