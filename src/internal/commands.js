const { readdirSync } = require('fs');

module.exports.commands = {};
loadCommands();

/**
 * Loads each of the files under /src/commands into a command.
 * @member {Object} cmdData - whatever is exported by the file's module
 * @member {string} cmdName - the name of the file, minus the .js extension
 */
function loadCommands() {
  let cmdData, cmdName;
  
  // We loop through the files inside /src/commands and use the data exported by each one
  readdirSync('src/commands').forEach(file => {
    cmdData = require(`../commands/${file}`);
    cmdName = file.slice(0, -3);
    
    // We simply give the command data the cmd property, with its own name
    module.exports[cmdName] = new Command(Object.assign(cmdData, {cmd: cmdName}));
  });

  readdirSync('src/gameclasses').forEach(file => {
    cmdData = require(`../gameclasses/${file}`);
    // Not all of the files in /gameclasses will be a command, so we make sure it is before loading it into one
    if (cmdData.cmd) module.exports.commands[cmdData.cmd] = new Command(cmdData);
  });
}

/**
 * An object to store information about a command.
 * @param {Object} data - whatever is exported by the module.
 * @constructor
 */
function Command(data) {
  // We load all of the exported data into the command object
  Object.assign(this, data);
  // If the data has a gameClass property, we know it is a command to deal with a game,
  // so we set its run function as such
  if (data.gameClass)
    this.run = (message, args) => startGame(message, args, data.gameClass);
    
  this.usage = this.aliases ? `[${[this.cmd, ...this.aliases].join('|')}]` : this.cmd;
  if (this.options) this.usage += generateUsage(this.options);

  if (this.aliases) this.aliases.forEach(alias => Object.defineProperty(module.exports, alias, { get: () => this }));
}

/**
 * Generates the usage for a command.
 * @param {Object} cmdData the data that is passed
 * @method
 */
function generateUsage(options) {
  let usage = ' ';
  Object.keys(options).forEach(optName => {
    let optData = options[optName];
    
    if (optData.required) {
      // No brackets if it is required, and it's not going to need a switch in front
      usage += ` __${optName}__`;
    } else { // It is optional
      if (optData.noflag)
        usage += ` [__${optName}__]`;
      else // There is a flag, which is the name of the option TODO
        usage += ` [**${[optName, ...optData.aliases].join('|')}** __${optName}__]`;
    }
  });

  return usage;
}

/**
 * This function simply starts a game. It is called when a player types the prefix followed by
 * the name of the game.
 * @param gameClass the game class that the user is trying to create, e.x. TicTacToeGame
 */
function startGame(message, args, gameClass) {
  /** @type {collection} */
  let server = global.db.collection(message.guild.id); // We get the server from the database
  /** @type {String} */
  let playerGameID = server.findOne({ _id: message.author.id })[gameClass.cmd]; // We 

  if (playerGameID) { // If the game that he is trying to start already exists
    let playerGame = server.findOne({ _id: playerGameID });
    let argsPassed = false; // We initially set it to false, so that we can check if any are passed later
    for (let i = 0; i < args.length; i++) {
      if (module.exports[gameClass.cmd].options.hasOwnProperty(args[i])) { // If the game class that the user is trying to instantiate
        args[i].action.call(playerGame, message, args);
        argsPassed = true; 
        server.update({ _id: message.author.id }, playerGame); // We update the database of the user
      }
    }
    if (!argsPassed) {
      let prefix = server.findOne({_id: 0}).prefix;
      playerGame.channel.send(`You are already in a game! Type ${prefix}${gameClass.cmd} view to resend the message.`).catch(global.logger.error);
    }
  } else {
    let newGame = new gameClass(message, args);
    newGame.init(message, args);
    newGame.save();
  }
}