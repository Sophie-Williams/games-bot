module.exports = Game;

const newGameData = {
  _id: Math.random().toString(36).substr(2, 9),
  players: [],
  currPlayer: 0,
  status: 'beginning'
};

/**
 * This is the parent class for all games in the program.
 * Javascript does not support abstract classes, but this class should never
 * be instantiated directly.
 * @param {Object} data 
 */
function Game(data) {
  Object.assign(this, newGameData, data);
}

/**
 * This is the function called when a user sends a message beginning with this command.
 */
Game.prototype.run = function (client, message, args) {
  this.status = 'running';
  for (let i = 0; i < args.length; i++)
    if (this.options.hasOwnProperty(args[i]))
      this.options[args[i]].action.call(this, client, message, i, args);
};

Game.prototype.getChannel = function (client) {
  return client.channels.get(this.channelID);
};

// Game.prototype.send = function (client, msg) {
//   this.getChannel().send(msg).catch(client.error);
// };

/** 
 * Sends a prompt to the game's channel, with the given reactions as options.
 */
Game.prototype.prompt = async function (client, str, data) {
  let msg = await this.getChannel().send(str).catch(client.error);
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
    return this.sendCollectorEndedMessage('timed out').catch(client.error);
  }
  return collected;
};

Game.prototype.sendCollectorEndedMessage = function (reason) {
  this.send(`Collector ended. ${reason ? `Reason: ${reason}. ` : ''}Your game has been cancelled. Type \
  "${process.env.DEFAULT_PREFIX || '.'}${this.cmd} cancel" to cancel this game \
	 and then type ${process.env.DEFAULT_PREFIX || '.'}${this.cmd} to start a new one.`);
};

/*
 * Deletes the game and removes it from its players' lists.
 */
Game.prototype.end = function (client) {
  this.status = 'ended';
  this.send(`${this.players.map(p => client.users.get(p._id)).join(', ')}, your ${this.cmd} games have ended.`);
  client.mongodb.collection(this.getChannel().guild.id).deleteOne({ _id: this.id });
};

Game.prototype.addPlayer = function (client, userID, otherProperties) {
  let ind = this.players.length;
  this.players[ind] = new Player(Object.assign({
    _id: userID,
    gameID: this._id
  }, otherProperties));

  console.log(`Adding player ${userID}`);
  // Adds this game's ID to the player's list of games
  client.mongodb.collection(this.getChannel().guild.id).updateOne({_id: userID},
    { $push: { games: this._id } },err => {
      if (err) throw err;
    });

  return this.players[ind];
};

Game.prototype.save = function (client) {
  client.mongodb.collection(this.getChannel().guild.id).updateOne({_id: this._id}, {$set: this}, err => {
    if (err) throw err;
  });
};

Game.prototype.nextPlayer = function () {
  this.currPlayer = (this.currPlayer + 1) % this.players.length;
};


function Player(data) {
  Object.assign(this, data);
}

Player.prototype.getUser = function (client) {
  return client.users.get(this._id);
};

Player.prototype.leaveGame = function (client) {
  this.game.channel.send(`${this.user} has left the game!`);

  // Deletes this game from the player's list of games
  client.mongodb.collection(this.game.channel.guild._id).updateOne(
    { _id: this.id },
    { $pull: { games: this._id } });
};

Player.prototype.save = function (client) {
  client.mongodb.collection(this.game.channel.guild.id).update({_id: this._id}, this);
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
// 			const msg = await this.getChannel().send({embed: this.boardEmbed()}).catch(client.error);
// 			this.boardMessage = msg;
// 		}
// 	}
// };
