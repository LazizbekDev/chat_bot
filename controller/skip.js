const {config, findContact, findContactPartner} = require('./base.js');
const db = require('../model/Contact.js');
async function handleSession(from, bot) {
    try {
        const contact = await findContact(from);

        // console.log(contact)
        if (contact.status === 0) {
            await bot.telegram.sendMessage(from, config.mess.error.sessionNotFound, { parse_mode: "Markdown" });
            return;
        }

        const partnerContact = await findContactPartner(contact.contactId);
        // console.log(partnerContact)
        try {
            await bot.telegram.sendMessage(partnerContact.contactId, config.mess.error.partnerStopSession, { parse_mode: "Markdown" });

            contact.status = 1;
            contact.partnerId = null;
            await contact.save();

            partnerContact.partnerId = null;
            partnerContact.status = 0;
            await partnerContact.save();

            await bot.telegram.sendMessage(from, config.mess.error.nextSession, { parse_mode: "Markdown" });

            const findPartner = new Promise((resolve, reject) => {
                setInterval(async () => {
                    const partnerQuery = await db
                        .findOne({
                            status: 1,
                            partnerId: null
                        })
                        .where("contactId")
                        .ne(from);

                    if (partnerQuery) {
                        resolve(partnerQuery);
                    } else {
                        reject(partnerQuery);
                    }
                }, 100);
            });

            try {
                const newPartner = await findPartner;
                const userContact = await findContact(from);
                userContact.partnerId = newPartner.contactId;
                newPartner.partnerId = userContact.contactId;
                await userContact.save();
                await newPartner.save();

                await bot.telegram.sendMessage(newPartner.contactId, config.mess.partnerFound, { parse_mode: "Markdown" });
                await bot.telegram.sendMessage(userContact.partnerId, config.mess.partnerFound, { parse_mode: "Markdown" });
            } catch (error) {
                setTimeout(async () => {
                    const res = await findContact(from);

                    if (res.partnerId === null) {
                        await bot.telegram.sendMessage(from, config.mess.error.partnerNotFound, { parse_mode: "Markdown" });

                        res.status = 0;
                        await res.save();
                    }
                }, 20000);
            }
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

// Call the function
module.exports = {
    handleSession: handleSession
}
