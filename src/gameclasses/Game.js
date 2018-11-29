const { Collection } = require('discord.js');

/**
 * This is the parent class for all games in the program.
 * Javascript does not support abstract classes, but this class should never
 * be instantiated directly.
 */
class Game {
  /**
   * Creates a new game with some default properties.
   * @param {string} id - a unique, randomly generated string used to reference the game
   */
  constructor(id) {
    this.id = id;
    this.players = new Collection();
    this.status = 'beginning';
  }

  /**
   * Sends a prompt to the game's channel, with the given reactions as options.
   * @param {Client} client - The logged in client
   * @param {string} str - The simple message to send
   * @param {object} data - Possible properties: reactions, matchID
   * @returns {Collection<string, MessageReaction>} the collected data 
   */
  async prompt(client, channel, str, data) {
    let msg = await channel.send(str);
    if (data.reactions) for (let r of data.reactions) await msg.react(r);

    // If various parameters in data are passed, we check that they equal
    const filter = (r, user) => true && (data.matchID ? (user.id === data.matchID) : true) && (data.reactions ? data.reactions.includes(r.emoji.name) : true);

    const collected = await msg.awaitReactions(filter, { maxUsers: 1, time: 60 * 1000 });
    if (collected.size === 0) {
      this.sendCollectorEndedMessage(client, 'timed out');
      return this.end(client);
    }

    return collected;
  }

  /**
   * Sends a message to notify the user that the collector has ended. we end the game.
   * @param {Client} client - The logged in client
   * @param {string} reason - The reason the collector ended
   */
  sendCollectorEndedMessage(client, reason) {
    let settings = client.mongodb.collection(this.channel.guild.id).findOne({ _id: 0 });
    this.channel.send(`Collector ended. ${reason ? `Reason: ${reason}. ` : ''}Your game has been cancelled. Type \
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

      // If losing means their score goes below 0, we set it to 0, else we decrement it by the score change
      let score = (loserScore - scoreChange < 0) ? 0 : loserScore - scoreChange;
      server.updateOne({ _id: loser.id }, { $set: { score }});
    }

    this.status = 'ended';
    this.channel.send(`${this.players.map(p => p.member).join(', ')}, your ${this.type} games have ended.`);
    client.games.delete(this.id); // Deletes this game from the player's list of games and leaves it to be garbage collected
  }

  /**
   * We add a player to this game's players collection.
   * @param {Client} client 
   * @param {string} member - The member to be added
   * @param {object} otherProperties - Other properties to be added on the creation of the player
   * @returns The player that was added
   */
  addPlayer(member, otherProperties) {
    this.players.set(this.players.size, Object.assign({ member }, otherProperties)); // set to this.players.size is same as appending
    this.iter = this.players.values(); // Reset the iterator
    this.currPlayer = this.iter.next().value;
    return this.players.get(this.players.size - 1);
  }

  /** We move the iter for the players to the next index */
  nextPlayer() {
    this.currPlayer = this.iter.next().value;
    if (this.currPlayer === undefined) { // If it goes past
      this.iter = this.players.values(); // we restart it
      this.currPlayer = this.iter.next().value; // and start to loop around again
    }
    return this.currPlayer;
  }

  static createOptions(options) { // We simply assign the options onto the defaults
    return Object.assign({
      leave: {
        flag: 'l',
        usage: 'Leaves the game',
        action: function (client, message, args) {
          if (args.includes('l')) {
            this.channel.send(`${message.member} has left the game!`);
            this.players.sweep(player => player.userID === message.member.id); // We remove the player from the players collection
          }
        }
      },
      cancel: {
        flag: 'c',
        usage: 'If the user is in a game, cancels it',
        action: function (client, message, args) {
          if (args.includes('c') && client.games.find(game => game.players.members.find(m => m.id = message.member.id))) this.end(client);
        }
      }
    }, options);
  }
}

module.exports = Game;
