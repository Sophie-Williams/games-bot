module.exports = {
  desc: 'Returns the ping time to the bot.',
  run: (client, message) => message.channel.send(`Pong! ${client.ping} ms`) // We simply send the client's ping
};