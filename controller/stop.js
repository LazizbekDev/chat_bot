const { findContact, config, findContactPartner } = require('./base.js');
async function handleStopSession(from, bot) {
    try {
        const contact = await findContact(from);

        if (contact.status === 0) {
            await bot.telegram.sendMessage(from, config.mess.error.sessionNotFound, { parse_mode: "Markdown" });
            return;
        }

        const partnerContact = await findContactPartner(from);

        try {
            await bot.telegram.sendMessage(partnerContact.partnerId, config.mess.error.partnerStopSession, { parse_mode: "Markdown" });

            contact.status = 0;
            contact.partnerId = null;
            await contact.save();

            partnerContact.status = 0;
            partnerContact.partnerId = null;
            await partnerContact.save();

            await bot.telegram.sendMessage(from, config.mess.error.stopSession, { parse_mode: "Markdown" });
        } catch (partnerError) {
            contact.status = 0;
            contact.partnerId = null;
            await contact.save();
            await bot.telegram.sendMessage(from, config.mess.error.isBrokenPartner, { parse_mode: "Markdown" });
        }
    } catch (error) {
        await bot.telegram.sendMessage(from, config.mess.error.notRegistered, { parse_mode: "Markdown" });
    }
}

module.exports = {
    handleStopSession: handleStopSession
}