const { Telegraf } = require("telegraf");
const updatelog = require("telegraf-update-logger");
const chalk = require("chalk");
const { Extra } = require("telegraf");
const fs = require("fs");

// Database
const config = JSON.parse(fs.readFileSync("./config.json"));
const bot = new Telegraf(config.botToken);

const mongoose = require("mongoose");
const db = require("./model/Contact");
mongoose.connect(config.mongo_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on("connected", function () {
  console.log("Mongoose default connection open to "+ config.mongo_URI);
});

// If the connection throws an error
mongoose.connection.on("error", function (err) {
  console.log("Mongoose default connection error: " + err);
});

// When the connection is disconnected
mongoose.connection.on("disconnected", function () {
  console.log("Mongoose default connection disconnected");
});

// Log bot
bot.use(
  updatelog({
    colors: {
      id: chalk.red,
      chat: chalk.yellow,
      user: chalk.green,
      type: chalk.bold,
    },
  }),
);

function sendsearch(ctx) {
  let botReply = config.mess.findPartner
  bot.telegram.sendMessage(ctx.chat.id, botReply, {parse_mode: "Markdown"})
  .then((result) => {
    setTimeout(() => {
      bot.telegram.deleteMessage(ctx.chat.id, result.message_id)
    }, 10 *  250)})
  .catch(err => console.log(err))
}

bot.on('message', async lintof => {

  const body = lintof.update.message.text || ''
  const command = body.split(' ')[0]
  const isCmd = body.startsWith('/')
  const isGroup = lintof.chat.type.includes("group")
  const from = lintof.chat.id

  // Database Query
  const findContact = async (contact) => {
    let findContact = await db.findOne({
      contactId: contact
    });
    return findContact;
  };

  const chatContact = async () => {
    let chatContact = await db
    .findOne({
      contactId: from
    })
    .where("partnerId")
    .ne(null);

    return chatContact;
  };

  const findContactPartner = async (contact) => {
    let findContactPartner = await db.findOne({
      status: 1,
      partnerId: contact,
    });
    return findContactPartner;
  };

  const sortPartnerId = async () => {
    return await db.findOne().sort({
      status: 1
    });
  };

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
    findContact(lintof.chat.id)
    .then(async (res) => {
      let findContactResult = res;
      if (
        res.partnerId === lintof.chat.id ||
        (res.partnerId !== null && res.status === 0)
      ) {
        res.status = 0;
        res.partnerId = null;
        await res.save();
      }
      if (res.partnerId === null && res.status === 0)
        return bot.telegram.sendMessage(
        lintof.chat.id,
        config.mess.error.sessionNotFound, {parse_mode: "Markdown"});
      chatContact()
      .then(async (res) => {
        let contactResult = res;
        findContactPartner(contactResult.contactId)
        .then(async (res) => {
          //if (res.partnerId === from
          if (res.contactId === contactResult.partnerId) {
            if (isText) {
              bot.telegram.sendMessage(contactResult.partnerId, lintof.message.text, {parse_mode: "Markdown"});
            } else if (isSticker) {
              bot.telegram.sendSticker(contactResult.partnerId, lintof.message.sticker.file_id)
            } else if (isImage) {
              bot.telegram.sendPhoto(contactResult.partnerId, lintof.message.photo[2].file_id, {caption: lintof.message.caption, parse_mode: "Markdown"})
            } else if (isVideo) {
              bot.telegram.sendVideo(contactResult.partnerId, lintof.message.video.file_id, {caption: lintof.message.caption, parse_mode: "Markdown"})
            } else if (isAudio) {
              bot.telegram.sendAudio(contactResult.partnerId, lintof.message.audio.file_id)
            } else if (isContact) {
              bot.telegram.sendContact(contactResult.partnerId, lintof.message.contact.file_id)
            } else if (isDocument) {
              bot.telegram.sendDocument(contactResult.partnerId, lintof.message.document.file_id)
            } else if (isAnimation) {
              bot.telegram.sendAnimation(contactResult.partnerId, lintof.message.animation.file_id)
            }
          }
        })
        .catch(async (err) => {
          console.log(err)
          findContactResult.status = 0;
          findContactResult.partnerId = null;
          await findContactResult.save();
          bot.telegram.sendMessage(
            from,
            config.mess.error.isBrokenPartner, {parse_mode: "Markdown"});
        });
      })
      .catch(async () => {
        bot.telegram.sendMessage(from,
          config.mess.error.sessionNotFound, {parse_mode: "Markdown"}
        );
      });
    })
    .catch((err) => {
      console.log(err);

      return bot.telegram.sendMessage(
        from,
        config.mess.error.notRegistered, {parse_mode: "Markdown"});
    });
  }

  switch (command) {
    case "/register":
      await findContact(from)
      .then(async (res) => {
        if (res === null) {
          await db.create({
            contactId: from
          });
          bot.telegram.sendMessage(from, config.mess.registerSuccess, {parse_mode: "Markdown"})
        } else {
          bot.telegram.sendMessage(from, config.mess.error.isRegistered, {parse_mode: "Markdown"})
        }
      })
      .catch(() => {
        bot.telegram.sendMessage(from, config.mess.error.isRegistered, {parse_mode: "Markdown"});
      });
      break;
    case "/start":
      await findContact(from)
      .then(async (res) => {
        if (
          res.partnerId === from ||
          (res.partnerId !== null && res.status === 0)
        ) {
          res.status = 0;
          res.partnerId = null;
          await res.save();
          return;
        }
        const con = res;
        if (res.partnerId === null) {
          sortPartnerId()
          .then(async (res) => {
            if (res.partnerId === null) {
              con.status = 1;
              await con.save();
              sendsearch(lintof)
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
                const finder = await db.findOne({
                  contactId: from,
                });
                finder.partnerId = res.contactId;
                res.partnerId = finder.contactId;
                await finder.save();
                await res.save();
                bot.telegram.sendMessage(
                  res.contactId,
                  config.mess.partnerFound,
                {parse_mode: "Markdown"});
                bot.telegram.sendMessage(
                  res.partnerId,
                  config.mess.partnerFound, {parse_mode: "Markdown"}
                );
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
            }
          })
          .catch((err) => {
            console.log(err);
          });
        } else if (res.partnerId !== null) {
          const nonNullPartnerId = await db.findOne({
            contactId: res.partnerId,
          });
          if (nonNullPartnerId.partnerId !== res.partnerId) {
            res.status = 0;
            res.partnerId = null;
            await res.save();
            bot.telegram.sendMessage(
              from,
              config.mess.error.isBrokenPartner, {parse_mode: "Markdown"}
            );
          } else if (res.partnerId !== null && res.status !== 0) {
            return bot.telegram.sendMessage(
              from,
              config.mess.error.isSession, {parse_mode: "Markdown"}
            );
          }
        }
      })
      .catch(() => {
        bot.telegram.sendMessage(from, config.mess.error.notRegistered, {parse_mode: "Markdown"});
      });
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
  }
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
