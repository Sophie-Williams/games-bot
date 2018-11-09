'use strict';

/*
 * This is the parent class for all games in the program.
 * Javascript does not support abstract classes, but this class should never
 * be instantiated directly.
 */

module.exports = Game;

// All of the actions are called with the game as the object. Parameters: (message, index, args)
const newGameData = {
  _id: Math.random().toString(36).substr(2, 9),
  players: {},
  status: 'beginning'
};

function Game(data) {
  Object.assign(this, newGameData, data);
}

Game.prototype.init = function (message, args) {
  this.status = 'running';
  const commands = require('../internal/getCommands.js');
  let opts = Object.getOwnPropertyNames(commands[this.cmd].options);
  for (let i = 0; i < args.length; i++)
    if (opts.includes(args[i]))
      commands[this.cmd].options[args[i]].action.call(this, message, i, args);
};

Game.prototype.getChannel = function() {
  return global.bot.channels.get(this.channelID);
};

// Sends a prompt to the game's channel, with the given reactions as options.
Game.prototype.prompt = async function (str, data) {
  let msg = await this.getChannel().send(str).catch(global.logger.error);
  if (data.reactions) for (let r of data.reactions) await msg.react(r);

  const filter = (r, user) => {
    let match = true;
    if (data.matchID) match = match && (user.id === data.matchID);
    if (data.reactions) match = match && data.reactions.includes(r.emoji.name);
    return match;
  };

  const collected = await msg.awaitReactions(filter, {maxUsers: 1, time: 60 * 1000});
  if (collected.size < 1) {
    this.status = 'ended';
    return this.sendCollectorEndedMessage('timed out').catch(global.logger.error);
  }
  return collected;
};

Game.prototype.sendCollectorEndedMessage = function (reason) {
  this.getChannel().send(`Collector ended. ${reason ? `Reason: ${reason}. ` : ''}Your game has been cancelled. Type "${process.env.DEFAULT_PREFIX || '.'}${this.cmd} cancel" to cancel this game \
	 and then type ${process.env.DEFAULT_PREFIX || '.'}${this.type} to start a new one.`).catch(global.logger.error);
};

/*
 * Deletes the game and removes it from its players' lists.
 */
Game.prototype.end = function () {
  this.status = 'ended';
  this.getChannel().send(`${Object.values(this.players).map(player => global.bot.users.get(player._id)).join(', ')}, your ${this.cmd} games have ended.`).catch(global.logger.error);
  global.db.collection(this.getChannel().guild.id).deleteOne({ _id: this.id });
};

Game.prototype.addPlayer = function (userID, otherProperties) {
  this.players[userID] = new Player(Object.assign({
    _id: userID,
    gameID: this._id
  }, otherProperties));

  // Adds this game's ID to the player's list of games
  global.db.collection(this.getChannel().guild.id).updateOne({_id: userID},
    { $push: {games: this._id} }, err => {
      if (err) throw err;
    });

  return this.players[userID];
};

Game.prototype.update = function() {
  global.db.collection(this.getChannel().guild.id).updateOne({_id: this._id}, {$set: this}, err => {
    if (err) throw err;
  });
};


function Player(data) {
  Object.assign(this, data);
}

Player.prototype.getUser = function() {
  return global.bot.users.get(this._id);
};

Player.prototype.leaveGame = function() {
  this.game.channel.send(`${this.user} has left the game!`);

  // Deletes this game from the player's list of games
  global.db.collection(this.game.channel.guild._id).update(
    { _id: this.id },
    { $pull: { games: this._id } });
};

Player.prototype.update = function() {
  global.db.collection(this.game.channel.guild.id).update({_id: this._id}, this);
};

// Static functions
// const defaultOptions = {
// 	leave: {
// 		aliases: ['leave', 'l', 'quit', 'q'],
// 		usage: 'Leaves the game',
// 		action: function (message) {
// 			this.leaveGame(message.author.id);
// 		}
// 	},
// 	cancel: {
// 		aliases: ['c'],
// 		usage: 'If the user is in a game, cancels it',
// 		action: function () {
// 			this.end();
// 		}
// 	},
// 	view: {
// 		aliases: ['v'],
// 		usage: 'Resends the game board',
// 		action: async function () {
// 			const msg = await this.getChannel().send({embed: this.boardEmbed()}).catch(global.logger.error);
// 			this.boardMessage = msg;
// 		}
// 	}
// };
