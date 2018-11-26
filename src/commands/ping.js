module.exports = {
  desc: 'Returns the ping time to the bot.',
  usage: 'ping',
  run: (client, message) => message.channel.send(`Pong! ${client.ping} ms`).catch(client.error) // We simply send the client's ping
};