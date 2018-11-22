module.exports = {
  aliases: ['invitelink', 'sendinvite'],
  desc: 'Sends a link to invite this bot to your server',
  usage: 'invite',
  run: (client, message) => {
    client.generateInvite().then(invite => message.channel.send(invite).catch(client.error));
  }
};