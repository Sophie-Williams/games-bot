const { RichEmbed } = require('discord.js');

module.exports = {
  aliases: ['help', 'info', 'command'],
  desc: 'sends help',
  options: {
    command: {
      desc: 'The command to get help on.'
    }
  },
  run: async (client, message, args) => {
    // We fetch the server settings from the database and get the prefix
    let settings = await client.mongodb.collection(message.guild.id).findOne({ _id: 0 });
    let prefix = settings.prefix;

    // If any arguments are passed
    if (args.length > 0) {
      // If the first argument is not a command, se tell the user and break
      if (!client.commands.has(args[0]))
        return message.channel.send(`${args[0]} is not a valid command. Type ${prefix}help to get a list of valid commands.`);

      // We get the command data
      let cmd = client.commands.get(args[0].toLowerCase());
      let help = new RichEmbed()
        .setTitle(cmd.aliases ? [args[0], ...cmd.aliases].join('|') : args[0]) // We join the aliases with | if it has any
        .setDescription(cmd.desc)
        .addField('Example', prefix + cmd.usage);
      
      // We get the options of the command and add their usages into an array
      if (cmd.options) {
        let options = [];
        Object.keys(cmd.options).forEach(param => {
          let data = cmd.options[param]; // If it's required, we underline it; if there's a flag, we bold it; if there's not no param, we add the param
          options.push(`${data.required ? `__${param}__` : `${data.flag ? `**${data.flag}**` : ''} ${data.noParam ? '' : `__${param}__`}`}
            - ${data.desc}`);
        });
        help.addField('Options', options); // Add the array of these commands to the embed
      }
        
      return message.channel.send({embed: help}); // and finally send it
    }

    // The user has not passed any arguments, so we show a generic help message with a list of the commands

    const help = new RichEmbed()
      .setTitle('Help')
      .setDescription('Hi, I\'m the Games Bot! Are you having a fun time?')
      .addField('Contribute', 'I\'m a Node.js app written using discord.js. If you want to help out, \
      feel free to open up a pull request on my [github repo](https://github.com/piguyinthesky/games-bot)')
      .addField('Invite', 'Click [here](https://discordapp.com/oauth2/authorize?client_id=468534527573098506&permissions=8&scope=bot) \
      to invite GamesBot to your server!');

    const cmds = new RichEmbed()
      .setTitle('Commands')
      .setDescription(`A list of commands this bot listens to. Type ${prefix}help [__command__] for more info on a given command. \
      The values within the [brackets] are optional.`);
    
    const games = new RichEmbed().setTitle('Games');

    // For each command, if it is not already in the embed, we add the prefix followed by the description
    client.commands.forEach(cmd => {
      if (cmds.fields.some(field => field.name === prefix + cmd.usage)) return;
      // A game is identified by its "type" property
      (cmd.type ? games : cmds).addField(prefix + cmd.usage, cmd.desc);
    });

    // Finally, we send the messages
    message.channel.send({ embed: help });
    message.channel.send({ embed: cmds });
    message.channel.send({ embed: games });
  }
};
