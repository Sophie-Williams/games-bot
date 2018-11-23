/**
 * The main command for handling messages. If the message starts with the prefix for the bot on the server, 
 * it will run the command they type
 * @event
 */
module.exports = async (client, message) => {
  // We don't respond to messages from bots, or for non-text channels
  if (message.author.bot || message.channel.type !== 'text') return;

  // We get the settings for the server, which contains the server prefix
  client.mongodb.collection(message.guild.id).findOne({ _id: 0 }, (err, res) => {
    if (err) throw err;

    // We don't respond to messages if they don't start with the server's prefix
    if (message.content.indexOf(res.prefix) !== 0) return;

    // We get the args regardless how much space is between them
    let args = message.content.slice(res.prefix.length).trim().split(/ +/g);
    let cmdName = args.shift().toLowerCase();

    if (!client.commands.has(cmdName))
      return message.channel.send('That is not a valid command. Please type .help to get help').catch(client.error);
    
    try {
      client.debug(`message responded from user ${message.author.username}. Content: "${message.content}"`);
      client.commands.get(cmdName).run(client, message, args);
    } catch (err) {
      message.channel.send('Beep boop error error').catch(client.error);
      client.error(err.stack);
    }
  });
};
