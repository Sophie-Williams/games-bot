module.exports = {
  desc: 'Sends a link to invite this bot to your server',
  run: message => {
    global.bot.generateInvite().then(invite => message.channel.send(invite).catch(global.logger.error));
  }
};