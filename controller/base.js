const db = require("../model/Contact");
const {readFileSync} = require("fs");
const colors = require("colors")
const mongoose = require("mongoose");
const config = JSON.parse(readFileSync("./config.json"));

// Token bot cannot be empty
if (config.botToken === "") console.log("Check config.json bot token belum diisi");
// Mongo_URI cannot be empty
if (config.mongo_URI === "") console.log("Check config.json mongo_URI belum diisi")

const connect = async () => {
    try {
        const connect = await mongoose.connect(config.mongo_URI);
        console.log(`${colors.green('➜')}  ${colors.bold.green('DB:   ')}    ${colors.underline.green(connect.connection.host)}`)
    } catch (err) {
        console.log(`${colors.gray('➜')}  ${colors.red('ERR:')}    ${err.message}`.red.underline.bold)
    }
}

async function startSearch(bot, ctx) {
    let botReply = config.mess.findPartner;

    try {
        await bot.telegram.sendMessage(ctx.chat.id, botReply, {parse_mode: "Markdown"})
    } catch (err) {
        console.log(err);
    }
}
const findContact = async (contact) => {
    try {
        return await db.findOne({
            contactId: contact
        });
    } catch (err) {
        console.log(err)
        throw err
    }
};

const chatContact = async (from) => {
    try {
        return await db
            .findOne({contactId: from})
            .where("partnerId")
            .ne(null);
    } catch (err) {
        console.log(err)
        throw err
    }
};

const findContactPartner = async (contact) => {
    try {
        return await db.findOne({
            status: 1,
            partnerId: contact,
        });
    } catch (err) {
        console.log(err)
        throw err
    }
};

const sortPartnerId = async () => {
    try {
        return await db.findOne().sort({
            status: 1
        });
    } catch (err) {
        console.log(err)
        throw err
    }
};

const getUser = (ctx) => {
    try {
        user = ctx
        last_name = user["last_name"] || ""
        full_name = user.first_name + " " + last_name
        user["full_name"] = full_name.trim()
        return user
    } catch (err) {
        console.log(err)
        throw err
    }
}

async function handleRegistration(bot, chatId, lintof) {
    try {
        const existingContact = await findContact(chatId);

        if (!existingContact) {
            await db.create({
                contactId: chatId,
                username: lintof.chat.username
            });

            await bot.telegram.sendMessage(chatId, config.mess.registerSuccess, { parse_mode: "Markdown" });
        } else {
            await bot.telegram.sendMessage(chatId, config.mess.error.isRegistered, { parse_mode: "Markdown" });
        }
    } catch (error) {
        console.error(error);
        await bot.telegram.sendMessage(chatId, config.mess.error.generic, { parse_mode: "Markdown" });
    }
}

module.exports = {
    handleRegistration: handleRegistration,
    findContact: findContact,
    connect: connect,
    chatContact: chatContact,
    findContactPartner: findContactPartner,
    sortPartnerId: sortPartnerId,
    getUser: getUser,
    startSearch: startSearch,
    config
};