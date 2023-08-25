const User = require("../model/Contact");
exports.message = `<i>Hey ghost, there is nothing abt u, u can set ur infos such as ur age</i>`

exports.profile = (bot) => {
    bot.command(['start', 'help'], (ctx) => {
        ctx.replyWithHTML(this.message, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: "Age", callback_data: "not set yet"},
                        {text: "Gander", callback_data: "Not set yet"}
                    ],
                    [{text: "Show country", callback_data: "set_country"}]
                ]
            }
        })
    })

    bot.action('set_country', async (ctx) => {
        ctx.deleteMessage();

        const {country} = await User.findOne({ contactId: ctx.chat.id });

        await bot.telegram.sendMessage(ctx.chat.id, 'Set Your country', {
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: `Hidden ${country === 'hidden' ? '✅' : ''}`, callback_data: country === 'hidden' ? "alert" : 'setHidden'},
                        {text: `${ctx.update.callback_query.from.language_code} ${country !== 'hidden' ? '✅' : ''}`, callback_data: country !== 'hidden' ? "alert" : 'setHidden'}
                    ]
                ]
            }
        })
    })

    bot.action("alert", (ctx) => {
        ctx.answerCbQuery("Already set")
    })

    bot.action("setHidden", async (ctx) => {
        const {country} = await User.findOne({ contactId: ctx.chat.id });
        try {
            const updateCountry = await User.findOneAndUpdate(
                { contactId: ctx.chat.id },
                { $set: { country: country !== 'hidden' ? "hidden" : ctx.update.callback_query.from.language_code } },
                { new: true }
            );
            if (!updateCountry) {
                // Handle the case where the user with the given ID doesn't exist
                console.log('not found');
                ctx.answerCbQuery('something went to wrong!')
                return;
            }
            ctx.answerCbQuery(updateCountry.country)
            ctx.deleteMessage();
            await bot.telegram.sendMessage(ctx.chat.id, `Country updated, You set to **${updateCountry.country.toUpperCase()}** \nClick to /start to start chat`, { parse_mode: "Markdown" })
        } catch (err) {
            console.log(err);
            throw err;
        }
    })
}