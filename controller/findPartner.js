const {findContact, sortPartnerId, startSearch, config} = require('./base.js');
const db = require('../model/Contact.js');

async function handleFindingPartner(from, bot, lintof) {
    try {
        const contact = await findContact(from);

        if (contact.partnerId === from || (contact.partnerId !== null && contact.status === 0)) {
            contact.status = 0;
            contact.partnerId = null;
            await contact.save();
            return;
        }

        if (contact.partnerId === null) {
            const partner = await sortPartnerId();

            if (partner.partnerId === null) {
                contact.status = 1;
                await contact.save();
                await startSearch(bot, lintof);

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
                    const partnerRes = await findPartner;

                    const finder = await db.findOne({
                        contactId: from,
                    });
                    finder.partnerId = partnerRes.contactId;
                    partnerRes.partnerId = finder.contactId;
                    await finder.save();
                    await partnerRes.save();

                    await bot.telegram.sendMessage(
                        partnerRes.contactId,
                        config.mess.partnerFound,
                        {parse_mode: "Markdown"}
                    );

                    await bot.telegram.sendMessage(
                        partnerRes.partnerId,
                        config.mess.partnerFound,
                        {parse_mode: "Markdown"}
                    );
                } catch (error) {
                    setTimeout(async () => {
                        const res = await findContact(from);

                        if (res.partnerId === null) {
                            await bot.telegram.sendMessage(
                                from,
                                config.mess.error.partnerNotFound,
                                {parse_mode: "Markdown"}
                            );

                            res.status = 0;
                            await res.save();
                        }
                    }, 20000);
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
}

// Call the function
module.exports = {
    handleFindingPartner: handleFindingPartner
}