'use strict';

const fs = require('fs');
const startGame = require('./startGame.js');
const defineAliases = require('./defineAliases.js');

/*
 * Loads each file in the commands folder into an object,
 * and then loads each file in the gameclasses folder into the
 * same object if it has a command
 */

module.exports = getCommands();

function getCommands() {
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
  let defaults = gameClass ? {run: (message, args) => startGame(message, args, gameClass)} : {};
  let cmdData = Object.assign(defaults, data);
	
  cmdData.usage = cmdData.aliases ? `[${[cmdData.cmd, ...cmdData.aliases].join('|')}]` : cmdData.cmd;
  if (cmdData.options)
    generateUsage(cmdData);

  return cmdData;
}

function generateUsage(cmdData) {
  let flags = '';
  let optNames = Object.keys(cmdData.options);
  optNames.forEach(opt => {
    // Each option looks like this:
    // optName: {
    //   desc: "A brief description of the topic",
    //   short: "",
    //   noflag: bool, // If it is true, we don't add its short, e.x. [__section__]; otherwise: [**-m** __system__]
    //   required: bool, // if it is required, we don't add brackets, and it shouldn't need a flag, e.x. __name__
    // }
    let optData = Object.assign({}, cmdData.options[opt]);
    if (optData.short) Object.defineProperty(cmdData.options, optData.short, { get () { return optData; } });
    
    // No brackets if it is required
    if (optData.required) {
      cmdData.usage += ` __${opt}__`;
      return;
    }
    
    // We add it to the flags if it does not take a param
    if (optData.flag) {
      flags += `${optData.short}`;
      return;
    }
    
    if (optData.noflag) cmdData.usage += ` [__${opt}__]`;
    else cmdData.usage += ` [**${optData.short}** __${opt}__]`;
  });

  if (flags.length > 0) cmdData.usage += ` [-${flags}]`;
}