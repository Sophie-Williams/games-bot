const RichEmbed = require('discord.js').RichEmbed;

module.exports = {
  aliases: ['help', 'info', 'command'],
  desc: 'sends help',
  usage: 'help [__command__]',
  options: {
    command: {
      desc: 'The command to get help on.',
      noflag: true
    }
  },
  run: (client, message, args) => {
    // TODO
    let prefix = client.mongodb.collection(message.guild.id).findOne({ _id: 0 }).prefix;
    if (args.length > 0) {
      if (client.commands.hasOwnProperty(args[0])) {
        let cmd = client.commands[args[0]];
        let help = new RichEmbed()
          .setTitle(`${args[0]}`)
          .setDescription(cmd.desc)
          .addField('Example', prefix + cmd.usage);
        
        let options = [];
        if (cmd.options) {
          let optionData;
          for (let option of Object.keys(cmd.options)) {
            optionData = cmd.options[option];
            if (optionData.required || optionData.noflag) options.push(`__${option}__\n  - ${optionData.desc}`);
            else options.push(`**-${optionData.aliases}**${option.noflag ? '' : `__${option}__`}\n  - ${optionData.desc}`);
          }
        }
        if (options.length > 0)
          help.addField('Options', options);
        return message.channel.send({embed: help}).catch(client.error);
      } else {
        return message.channel.send(`${args[0]} is not a valid command. Type ${prefix}help to get a list of valid commands.`).catch(client.error);
      }
    }

    const help = new RichEmbed()
      .setTitle('Help')
      .setDescription('Hi, I\'m the Games Bot! Are you having a fun time?')
      .addField('Info', 'Click [here](https://piguyinthesky.github.io/games-bot/) to visit GamesBot\'s site! \
      (It\'s a work in progress)')
      .addField('Contribute', 'I\'m a Node.js app written using discord.js. If you want to help out, \
      feel free to open up a pull request on my [github repo](https://github.com/piguyinthesky/games-bot)')
      .addField('Invite', 'Click [here](https://discordapp.com/oauth2/authorize?client_id=468534527573098506&permissions=8&scope=bot) \
      to invite GamesBot to your server!');

    const cmds = new RichEmbed()
      .setTitle('Commands')
      .setDescription(`A list of commands this bot listens to. Type ${prefix}help [__command__] for more info on a given command. \
      The values within the [brackets] are optional.`);
    
    Object.values(client.commands).forEach(cmd => cmds.addField(prefix + cmd.usage, cmd.desc));

    message.channel.send({embed: help}).catch(client.error);
    message.channel.send({embed: cmds}).catch(client.error);
  }
};
