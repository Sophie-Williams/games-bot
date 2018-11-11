const RichEmbed = require('discord.js').RichEmbed;
const fs = require('fs');

const commands = loadCommands();

module.exports = {
  desc: 'sends help',
  aliases: ['help', 'info', 'command'],
  options: {
    command: {
      desc: 'The command to get help on.',
      noflag: true
    }
  },
  run: sendHelp,
  commands: loadCommands()
};

function sendHelp(message, args) {
  let prefix = global.db.collection(message.guild.id);
  if (args.length > 0) {
    if (commands.hasOwnProperty(args[0])) {
      let cmd = commands[args[0]];
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
      return message.channel.send({embed: help}).catch(global.logger.error);
    } else {
      return message.channel.send(`${args[0]} is not a valid command. Type ${prefix}help to get a list of valid commands.`).catch(global.logger.error);
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
	
  Object.values(commands).forEach(cmd => cmds.addField(prefix + cmd.usage, cmd.desc));

  message.channel.send({embed: help}).catch(global.logger.error);
  message.channel.send({embed: cmds}).catch(global.logger.error);
}

function loadCommands() {
  let commands = {};
  let cmdData, cmdName, game;
	
  fs.readdirSync('src/commands').forEach(file => {
    cmdData = require(`../commands/${file}`);
    cmdName = file.slice(0, -3);
    
    // We simply give the command data the cmd property, with its own name
    commands[cmdName] = generateCommand(Object.assign(cmdData, {cmd: cmdName}));
  });

  fs.readdirSync('src/gameclasses').forEach(file => {
    game = require(`../gameclasses/${file}`);
    if (game.cmd) commands[game.cmd] = generateCommand(game, game.gameClass);
  });

  return defineAliases(commands);
}

function generateCommand (data, gameClass) {
  let cmdData = Object.assign({}, data);
  if (gameClass) cmdData.run = (message, args) => startGame(message, args, gameClass);
	
  cmdData.usage = cmdData.aliases ? `[${[cmdData.cmd, ...cmdData.aliases].join('|')}]` : cmdData.cmd;
  if (cmdData.options) generateUsage(cmdData);

  return cmdData;
}

function generateUsage(cmdData) {
  Object.keys(cmdData.options).forEach(optName => {
    let optData = cmdData.options[optName];
    
    if (optData.required) {
      // No brackets if it is required, and it's not going to need a switch in front
      cmdData.usage += ` __${optName}__`;
    } else { // It is optional
      if (optData.noflag)
        cmdData.usage += ` [__${optName}__]`;
      else
        cmdData.usage += ` [**${[optName, ...optData.aliases].join('|')}** __${optName}__]`;
    }
  });
}

/*
* For an object that looks like this:
* 	foo: {
* 		bar: {
* 			aliases: []
* 		}
* 	}
* this function defines all of bar's aliases on foo
*/
function defineAliases(obj) {
  Object.values(obj).forEach(val => {
    if (val.aliases)
      val.aliases.forEach(alias => Object.defineProperty(obj, alias, { get: () => val }));
  });
  return obj;
}

/*
 * This function simply starts the game. It is called when a player types the prefix followed by
 * the name of the game.
 * @param gameClass the game class that the user is trying to create, e.x. TicTacToeGame
 */
function startGame(message, args, gameClass) {
  // If the player is already in a game, see if they call any arguments
  let server = global.db.collection(message.guild.id);
  let playerGameID = server.find({ _id: message.author.id })[gameClass.cmd];

  if (playerGameID) { // If the game that he is trying to start already exists
    let playerGame = server.find({ _id: playerGameID });
    let argsPassed = false;
    for (let i = 0; i < args.length; i++) {
      if (commands[gameClass.cmd].options.hasOwnProperty(args[i])) { // If the game class that the user is trying to instantiate
        args[i].action.call(playerGame, message, args);
        argsPassed = true;
        server.update({ _id: message.author.id }, playerGame);
      }
    }
    if (!argsPassed) playerGame.channel.send(`You are already in a game! Type ${server.find({_id: 0}).prefix}${gameClass.cmd} view to resend the message.`).catch(global.logger.error);
  } else {
    let newGame = new gameClass(message, args);
    newGame.init(message, args);
    newGame.save();
  }
}