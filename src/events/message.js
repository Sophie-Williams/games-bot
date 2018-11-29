/**
 * The main command for handling messages. If the message starts with the prefix for the bot on the server, 
 * it will run the command they type
 * @event
 */
module.exports = async (client, message) => {
  // We don't respond to messages from bots, or for non-text channels
  if (message.author.bot || message.channel.type !== 'text') return;

  // We get the settings for the server, which contains the server prefix
  let settings = await client.mongodb.collection(message.guild.id).findOne({ _id: 0 });
  
  // Checks if the bot was mentioned, with no message after it, returns the prefix.
  const prefixMention = new RegExp(`^<@!?${client.user.id}>( |)$`);
  if (message.content.match(prefixMention))
    return message.reply(`My prefix on this guild is \`${settings.prefix}\``);

  // We don't respond to messages if they don't start with the server's prefix
  if (message.content.indexOf(settings.prefix) !== 0) return;

  // We get the args regardless how much space is between them
  let args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
  let cmdName = args.shift().toLowerCase();

  if (!client.commands.has(cmdName))
    return message.channel.send('That is not a valid command. Please type .help to get help').catch(client.error);
  
  try {
    client.debug(`message responded from user ${message.author.username}. Content: "${message.content}"`);
    client.commands.get(cmdName).run(client, message, args);
  } catch (err) {
    message.channel.send('An unexpected error occurred. Your game may have ended or I might be missing permissions.').catch(client.error);
    client.error(err.stack);
  }
};
