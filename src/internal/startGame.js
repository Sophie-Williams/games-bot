'use strict';

const commands = require('./getCommands.js');

/*
 * This function simply starts the game. It is called when a player types the prefix followed by
 * the name of the game.
 * @param gameClass the game class that the user is trying to create, e.x. TicTacToeGame
 */
module.exports = async function (message, args, gameClass) {
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
    if (!argsPassed) playerGame.channel.send(`You are already in a game! Type ${process.env.DEFAULT_PREFIX || '.'}${playerGame.type} view to resend the message.`).catch(global.logger.error);
  } else {
    let newGame = new gameClass(message, args);
    newGame.init(message, args);
    newGame.update();
  }
};