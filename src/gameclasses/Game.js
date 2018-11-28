const { Collection } = require('discord.js');

const newGameData = {
  currPlayer: {},
  status: 'beginning',
  options: {
    leave: {
      flag: 'l',
      usage: 'Leaves the game',
      action: function (client, message) {
        this.channel.send(`${message.author} has left the game!`);
        this.players.sweep(player => player.userID === message.member.id); // We remove the player from the players collection
      }
    },
    cancel: {
      flag: 'c',
      usage: 'If the user is in a game, cancels it',
      action: function (client) {
        this.end(client);
      }
    }
  }
};

/**
 * This is the parent class for all games in the program.
 * Javascript does not support abstract classes, but this class should never
 * be instantiated directly.
 * @param {Object} data 
 */
class Game {
  /**
   * Creates a new game.
   * @param {string} id - a unique, randomly generated string used to reference the game
   * @param {object} data - an object containing all of the new data added to the game
   */
  constructor(id, data) {
    this.id = id;
    this.players = new Collection();
    Object.assign(this, newGameData, data);
  }

  /**
   * This is the function called when a user sends a message beginning with this command. We go through the args and see
   * if any of them match an option, and if they do we call it.
   * @param {Client} client - the logged in client
   * @param {Message} message - the message
   * @param {string[]} args - the arguments passed
   */
  run(client, message, args) {
    this.status = 'running';
    for (let i = 0; i < args.length; i++)
      if (this.options.hasOwnProperty(args[i]))
        this.options[args[i]].action.call(this, client, message, args, i);
  }

  /**
   * Sends a prompt to the game's channel, with the given reactions as options.
   * @param {Client} client 
   * @param {string} str 
   * @param {object} data - Possible properties: reactions, matchID
   */
  async prompt(client, channel, str, data) {
    let msg = await channel.send(str);
    if (data.reactions) for (let r of data.reactions) await msg.react(r);

    // If various parameters in data are passed, we check that they equal
    const filter = (r, user) => true && (data.matchID ? (user.id === data.matchID) : true) && (data.reactions ? data.reactions.includes(r.emoji.name) : true);

    const collected = await msg.awaitReactions(filter, { maxUsers: 1, time: 60 * 1000 });
    if (collected.size < 1) {
      this.status = 'ended';
      return this.sendCollectorEndedMessage(client, 'timed out');
    }

    return collected;
  }

  /**
   * Sends a message to notify the user that the collector has ended. we end the game.
   * @param {Client} reason 
   * @param {string} reason 
   */
  sendCollectorEndedMessage(client, reason) {
    let settings = client.mongodb.collection(this.channel.guild.id).findOne({ _id: 0 });
    this.send(`Collector ended. ${reason ? `Reason: ${reason}. ` : ''}Your game has been cancelled. Type \
    "${settings.prefix}${this.type} cancel" to cancel this game \
    and then type ${settings.prefix}${this.type} to start a new one.`);

    this.end(client);
  }

  /**
   * Deletes the game and removes it from its players' lists. If there is a winner and loser, we update their scores.
   * @param {Client} client 
   * @param {GuildMember} winner 
   * @param {GuildMember} loser 
   */
  async end(client, winner, loser) {
    if (winner && loser) { // If the game finished with a winner and loser
      // We update the database with their new scores
      let server = client.mongodb.collection(this.channel.guild.id);
      let winnerScore = await server.findOne({ _id: winner.id });
      let loserScore = await server.findOne({ _id: loser.id });
      
      // A little algorithm so that if a strong person beats a weak person, they don't win as much, and vice versa
      let scoreChange = (winnerScore - loserScore) / 10 + this.defaultWinScore;
      if (scoreChange < 0) scoreChange = 0; // Make sure someone can't gain points by losing
      if (scoreChange > this.defaultWinScore * 2) scoreChange = this.defaultWinScore * 2; // Make sure they can't win insanely

      server.updateOne({ _id: winner.id }, { $inc: { score: scoreChange }});

      // If losing means their score goes below 0, we set it to 0
      let score = (loserScore - scoreChange < 0) ? 0 : loserScore - scoreChange;
      server.updateOne({ $set: { score }});
    }

    this.status = 'ended';
    this.send(`${this.players.map(p => client.users.get(p.id)).join(', ')}, your ${this.cmd} games have ended.`);
    client.games.delete(this.id); // Deletes this game from the player's list of games and leaves it to be garbage collected
  }

  /**
   * We add a player to this game's players collection.
   * @param {Client} client 
   * @param {string} userID - The user ID of the Discord user to be added
   * @param {object} otherProperties - Other properties to be added on the creation of the player
   * @returns The player that was added
   */
  addPlayer(client, user, otherProperties) {
    this.players.set(this.players.size, Object.assign(user, otherProperties));
    this.iter = this.players.values();
    return this.players.get(this.players.size - 1);
  }

  /** We move the iter for the players to the next index */
  nextPlayer() {
    this.currPlayer = this.iter.next().value;
    if (this.currPlayer === undefined) {
      this.iter = this.players.values();
      this.currPlayer = this.iter.next().value;
    }
  }
}

module.exports = Game;
