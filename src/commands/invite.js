module.exports = {
  aliases: ['invitelink', 'sendinvite'],
  desc: 'Sends a link to invite this bot to your server',
  run: (client, message) => {
    // We simply send an invite to the bot
    client.generateInvite().then(invite => message.channel.send(invite).catch(client.error));
  }
};