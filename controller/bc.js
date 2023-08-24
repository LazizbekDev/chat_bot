const db = require('../model/Contact.js');
async function sendBroadcastMessage(bot, from, isOwner, isImage, userScope, body, command) {
    try {
        if (!isOwner) {
            await bot.telegram.sendMessage(from, "this feature only for owner!");
            return;
        }

        let textBack = `*BROADCAST*\n\n${body.slice(command.length + 1)}`;
        const getUserName = await db.find().select("contactId");

        for (let i = 0; i < getUserName.length; i++) {
            const contactId = getUserName[i].contactId;

            if (isImage) {
                await bot.telegram.sendPhoto(contactId, userScope.message.photo[2].file_id, {
                    caption: textBack,
                    parse_mode: "Markdown"
                });
            } else if (isVideo) {
                await bot.telegram.sendVideo(contactId, userScope.message.video.file_id, {
                    caption: textBack,
                    parse_mode: "Markdown"
                });
            } else {
                await bot.telegram.sendMessage(contactId, textBack, { parse_mode: "Markdown" });
            }
        }
    } catch (error) {
        console.error(error);
    }
}

// Call the function
module.exports = sendBroadcastMessage;
