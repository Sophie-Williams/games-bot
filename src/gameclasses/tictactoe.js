const { RichEmbed } = require('discord.js');
const Game = require('./Game.js');
const BoardGameState = require('./BoardGameState.js');
const AIAction = require('./AIAction.js');

module.exports = {
  aliases: ['ttt'],
  desc: 'Plays Tic Tac Toe! Type .help tictactoe for more info.',
  options: {
    singleplayer: {
      flag: 's',
      desc: 'Starts a singleplayer game.',
      action: function() {
        this.multiplayer = false;
      }
    },
    difficulty: {
      flag: 'd',
      desc: 'Sets the difficulty to __difficulty__. Assumes **-s**.',
      action: function(client, m, args, ind) {
        let diff = args[ind+1];
        [/^e(?:asy)|1$/i, /^m(?:edium)|2$/i, /^h(?:ard)|3$/i].forEach((re, i) => {
          if (re.test(diff)) this.difficulty = i+1;
        });
      }
    },
    startingturn: {
      flag: 't',
      desc: 'Begins the game with you as the __startingturn__th player.',
      action: function(client, m, args, ind) {
        let goFirst = args[ind+1];
        if ((/^t(?:rue)|y(?:es)|1$/).test(goFirst))
          this.p1GoesFirst = true;
        else if ((/^f(?:alse)|n(?:o)|2$/).test(goFirst))
          this.p1GoesFirst = false;
      }
    },
    view: {
      flag: 'v',
      usage: 'Resends the game board',
      action: async function () {
        const msg = await this.channel.send({embed: this.boardEmbed()});
        this.boardMessage = msg;
      }
    }
  },
  run: async (client, message, args) => { // This gets called by a message
    let game = client.games.find(game => game.players.find(player => player.userID === message.author.id) && game.type === 'tictactoe'); // In the database, we look for a game with the message's author as a player
    if (!game) { // If it doesn't exist,
      let id = Math.random().toString(36).substr(2, 9); // we randomly generate an id by getting a random float and mapping each digit to a char value
      client.games.set(id, new TicTacToeGame(id, message)); // and create one!
      game = client.games.get(id);
    }
    game.run(client, message, args);
  }
};

/**
 * Plays Tic Tac Toe
 */
class TicTacToeGame extends Game {
  constructor(id, message) {
    super(id, {
      channel: message.channel,
      type: 'tictactoe',
      numPlayersRange: [2, 2],
      reactions: { '🇦': 0, '🇧': 1, '🇨': 2, '1⃣': 2, '2⃣': 1, '3⃣': 0 },
      currentState: new BoardGameState(3, 3)
    });
  }

  run(client, message, args) {
    if (this.status === 'beginning') this.init(client, message, args);
    super.run(client, message, args);
  }

  /**
   * We essentially start the game, adding the original player
   * @param {Client} client 
   * @param {Message} message 
   */
  async init(client, message) {
    client.debug('New Tic Tac Toe game created');
    this.addPlayer(message.member, { symbol: 'X' });
    
    if (this.multiplayer !== undefined && !this.multiplayer) {
      this.addPlayer(this.channel.guild.members.get(client.user.id), { symbol: 'O' });
      return this.start(client);
    }

    if (message.mentions.users.size < 1) { // If nobody gets mentioned
      message.channel.send('Please mention someone to challenge to Tic Tac Toe, or type .ttt s to play singleplayer.');
      return this.end(client);
    }

    let challengedMember = message.mentions.users.first();
    if (challengedMember.user.bot || challengedMember.id === message.author.id) { // If they challenge a bot or themselves
      this.addPlayer(client.user.id, {symbol: 'O'}); // We add the bot
      this.multiplayer = false;
    } else { // They challenged another player, so we send the challenge to the channel
      await this.prompt(client, `${challengedMember}, you have been challenged to play Tic Tac Toe! Tap 👍 to accept.`, {
        reactions : ['👍'],
        matchID: challengedMember.id
      });

      this.addPlayer(challengedMember, {symbol: 'O'});
      this.multiplayer = true;
    }

    this.start(client);
  }

  async start(client) {
    if (!this.multiplayer) await this.setDifficulty();
    await this.setP1GoesFirst();
  
    this.boardMessage = await this.getChannel().send({embed: this.boardEmbed()});
  
    if (!this.multiplayer && !(this.currentState.currentPlayerSymbol === this.players.get(0).symbol)) this.aiMove();
    await this.resetReactions();
  
    this.nextMove(client);
  }

  async setDifficulty(client, difficulty) {
    let collected;
    if (typeof difficulty === 'undefined')
      collected = await this.prompt(client, 'Don\'t worry, I don\'t have friends either. Do you want me to go 🇪asy, 🇲edium, or 🇭ard?', {
        reactions: ['🇪', '🇲', '🇭'],
        matchID: this.players.get(0).userID
      });
  
    this.difficulty = { '🇪': 1, '🇲': 2, '🇭': 3 }[collected.first().emoji.name];
  }

  async setP1GoesFirst(client, p1GoesFirst) {
    let collected;
    if (typeof p1GoesFirst === 'undefined')
      collected = await this.prompt(client, 'Do you want to go first or second?', {
        reactions: ['1⃣', '2⃣'],
        matchID: this.players.get(0).user.id
      });
  
    if (!collected.has('1⃣')) this.nextPlayer();
    
    this.currentState.currentPlayerSymbol = this.currentPlayer.symbol;
    this.channel.send(`${this.currPlayer.user.displayName}, your turn! React with the coordinates of the square you want to move in, e.x. "🇧2⃣".`);
  }
  
  async resetReactions(client, msg=this.boardMessage, emojis=Object.keys(this.reactions)) {
    await msg.clearReactions();
    for(let emoji of emojis)
      await msg.react(emoji);
  }

  async areReactionsReset(msg=this.boardMessage, reactions=Object.keys(this.reactions)) {
    const reactedEmojis = msg.reactions.map(re => re.emoji.name);
    return(reactions.every(emoji => reactedEmojis.includes(emoji)));
  }

  async nextMove(client) {
    let reactionFilter = (r, emoji) => r.message.reactions.get(emoji).users.has(this.currPlayer.user.id);
  
    this.collector = this.boardMessage.createReactionCollector(r => {
      if (this.status !== 'running') return;
      if (this.currPlayer.user.id === client.user.id) return; // If the current player is the bot
      if (!this.areReactionsReset(r.message)) return; // If reactions have not yet been reset
      const rowSelected = ['1⃣', '2⃣', '3⃣'].some(row => reactionFilter(r, row));
      const colSelected = ['🇦', '🇧', '🇨'].some(col => reactionFilter(r, col));
      return rowSelected && colSelected;
    }, {time: 5 * 60 * 1000});
  
    this.collector.on('collect', r => {
      let row = this.reactions[['1⃣', '2⃣', '3⃣'].filter(row => reactionFilter(r, row))[0]];
      let col = this.reactions[['🇦', '🇧', '🇨'].filter(col => reactionFilter(r, col))[0]];
  
      let ind = row * 3 + col;
      if (this.currentState.contents[ind] !== ' ')
        return this.getChannel().send('That is not a valid move!');
      let next = new BoardGameState(this.currentState);
      next.contents[ind] = this.currentState.currentPlayerSymbol;
      next.currentPlayerSymbol = next.currentPlayerSymbol === 'X' ? 'O' : 'X';
      this.advanceTo(next);
  
      if (!this.multiplayer && !(this.currentState.currentPlayerSymbol === this.players.get(0).symbol))
        this.aiMove();
  
      this.resetReactions();
    });
  
    this.collector.on('end',(collected, reason) => {
      if (reason === 'game over') return;
      this.sendCollectorEndedMessage(client, reason);
    });
  }

  /**
   * The embed displaying the current board state
   */
  get boardEmbed() {
    const embed = new RichEmbed()
      .setTimestamp()
      .setTitle('Tic Tac Toe')
      .addField('Players', `${this.players.map(p => `${p.user}(${p.symbol})`).join(' vs ')}`)
      .addField('Grid', this.currentState.grid())
      .setFooter('Type ".ttt help" to get help about this function.');
    return embed;
  }
  
  /**
   * Advances the game to a game state
   * @param {Client} client 
   * @param {BoardGameState} state 
   */
  advanceTo(client, state) {
    this.currentState = state;
    this.boardMessage.edit({embed: this.boardEmbed()});
    const term = this.currentState.isTerminal();
    this.currentState.result = term ? term : 'running';
    this.nextPlayer();
    if (/(?:X|O)-won|draw/i.test(this.currentState.result)) {
      this.status = 'ended';
      this.getChannel().send(`${this.currPlayer.user} won! GG`);
      this.collector.stop('game over');
      this.boardMessage.clearReactions();
      this.end(client, this.currPlayer, this.iter.next().value);
    }
  }

  /**
   * Makes a move for the bot.
   */
  aiMove() {
    const available = this.currentState.emptyCells;
    let action;
  
    if (this.difficulty === 1) { // We randomly choose a cell
      let randomCell = available[Math.floor(Math.random() * available.length)];
      action = new AIAction(randomCell);
    } else {
      // We create an array of the available actions, applying each one to the current state
      let availableActions = available.map(pos => {
        let availableAction = new AIAction(pos); // We create a new AIAction for the given position
        let nextState = availableAction.applyTo(this.currentState, this.switchSymbol(this.players.get(0).symbol));
        availableAction.minimaxVal = AIAction.minimaxValue(nextState, this.players.get(0).symbol);
        return availableAction;
      });
  
      // Descending if it is currently the human player's turn
      availableActions.sort(AIAction.sort(this.currentState.currentPlayerSymbol === this.players.get(0).symbol ? -1 : 1));
  
      action = (this.difficulty === 2 ?
        ((Math.random() * 100 <= 40) ? // A 40% chance of choosing the best move
          availableActions[0] :
          ((availableActions.length >= 2) ? availableActions[1] : availableActions[0])) : // Otherwise we choose the second-best move, if there is one
        availableActions[0]); // If the difficulty is 3, we always choose the best move
    }
  
    let next = action.applyTo(this.currentState, this.switchSymbol(this.players.get(0).symbol));
    this.advanceTo(next);
  }

  /** Simply returns the other symbol */
  switchSymbol(symbol) {
    return symbol === 'X' ? 'O' : 'X';
  }
}
