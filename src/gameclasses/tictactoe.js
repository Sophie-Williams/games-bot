const { RichEmbed } = require('discord.js');
const Game = require('./Game.js');
const BoardGameState = require('./BoardGameState.js');

/**
 * Plays Tic Tac Toe!
 */
class TicTacToeGame extends Game {
  /**
   * 
   * @param {string} id 
   * @param {Message} message 
   */
  constructor(client, message, args, id) {
    super(id);
    this.channel = message.channel;
    this.reactions = { '🇦': 0, '🇧': 1, '🇨': 2, '1⃣': 2, '2⃣': 1, '3⃣': 0 };
    this.currentState = new BoardGameState();
  }

  static get type() { return 'tictactoe'; }

  static run(client, message, args) {
    let game = client.games.find(game => game.players.has(message.author.id) && game.type === 'tictactoe');
    if (!game) { // If the player is not in a game of this type
      let id = Math.random().toString(36).substr(2, 9); // We randomly generate an id by getting a random float and mapping each digit to a char value
      client.games.set(id, new TicTacToeGame(client, message, args, id));
      game = client.games.get(id);
      client.debug('New Tic Tac Toe Game created');
    }

    Object.values(this.options).forEach(opt => {
      opt.action.call(game, client, message, args);
    });

    if (game.status !== 'running') game.start(client, message);
  }

  /**
   * The players have all been added to the game, so now we are ready to start and confirm all of the settings.
   * @param {Client} client - The logged in client
   */
  async start(client, message) {
    this.status = 'running';
    this.addPlayer(message.member, { symbol: 'X' }); // The person who sends the message will always be x
    
    if (this.multiplayer === false) { // If the multiplayer has been *set* to false
      this.addPlayer(this.channel.guild.members.get(client.user.id), { symbol: 'O' }); // We add the bot and start the game
    } else {
      if (message.mentions.members.size < 1) { // If nobody gets mentioned
        message.channel.send('Please mention someone to challenge to Tic Tac Toe, or type .ttt s to play singleplayer.');
        return this.end(client);
      }

      let challengedMember = message.mentions.members.first();
      if (challengedMember.user.bot || challengedMember.id === message.author.id) { // If they challenge a bot or themselves
        this.addPlayer(this.channel.guild.members.get(client.user.id), { symbol: 'O' }); // We add the bot
        this.multiplayer = false;
      } else { // They challenged another player, so we send the challenge to the channel
        await this.prompt(client, `${challengedMember}, you have been challenged to play Tic Tac Toe! Tap 👍 to accept.`, {
          reactions : ['👍'],
          matchID: challengedMember.id
        });

        if (this.status === 'ended') return;
  
        this.addPlayer(challengedMember, { symbol: 'O' });
        this.multiplayer = true;
      }
    }

    if (!this.multiplayer && this.difficulty === undefined) { // We set the difficulty
      let difficulty = await this.prompt(client, this.channel, 'Do you want me to go 🇪asy, 🇲edium, or 🇭ard?', {
        reactions: ['🇪', '🇲', '🇭'],
        matchID: this.players.get(0).member.id
      });
    
      this.difficulty = { '🇪': 1, '🇲': 2, '🇭': 3 }[difficulty.first().emoji.name];
    }
    
    // eslint-disable-next-line no-empty
    if (this.p1GoesFirst) {
    } else if (this.p1GoesFirst === false) {
      this.nextPlayer();
    } else {
      let firstOrSecond = await this.prompt(client, this.channel, 'Do you want to go first or second?', {
        reactions: ['1⃣', '2⃣'],
        matchID: this.players.get(0).member.id
      });
    
      if (!firstOrSecond.has('1⃣')) this.nextPlayer(); // We simply set the current player to the next player  
    }
        
    this.channel.send(`${this.currPlayer.member.displayName}, your turn! React with the coordinates of the square you want to move in, e.x. "🇧2⃣".`);
    this.boardMessage = await this.channel.send({ embed: this.boardEmbed });
  
    if (!this.multiplayer && !(this.currPlayer.symbol === 'X')) this.aiMove();
    await this.resetReactions();
  
    this.nextMove(client);
  }
  
  /**
   * We reset the reactions on the board message so that the user can click to their next move.
   */
  async resetReactions() {
    await this.boardMessage.clearReactions(); // We clear the reactions
    for (let emoji of Object.keys(this.reactions)) await this.boardMessage.react(emoji);
  }

  async areReactionsReset(msg=this.boardMessage, reactions=Object.keys(this.reactions)) {
    const reactedEmojis = msg.reactions.map(re => re.emoji.name);
    return(reactions.every(emoji => reactedEmojis.includes(emoji)));
  }

  async nextMove(client) {
    let reactionFilter = (r, emoji) => r.message.reactions.get(emoji) ? r.message.reactions.get(emoji).users.has(this.currPlayer.member.id) : false;
  
    this.collector = this.boardMessage.createReactionCollector(r => {
      if (this.status !== 'running') return;
      if (this.currPlayer.member.id === client.user.id) return; // If the current player is the bot
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
        return this.channel.send('That is not a valid move!');

      this.move(client, ind);
      
      if (!this.multiplayer && !(this.currPlayer.symbol === 'X'))
        this.aiMove(client);
  
      this.resetReactions();
    });
  
    this.collector.on('end', (collected, reason) => {
      if (reason === 'game over') return;
      this.sendCollectorEndedMessage(client, reason);
      this.end(client); // Since there's no way for the users to create a new collector besides starting a new game
    });
  }

  /**
   * The embed displaying the current board state
   */
  get boardEmbed() {
    const embed = new RichEmbed()
      .setTimestamp()
      .setTitle('Tic Tac Toe')
      .addField('Players', `${this.players.map(p => `${p.member} (${p.symbol})`).join(' vs ')}`)
      .addField('Grid', this.currentState.grid)
      .setFooter('Type ".ttt help" to get help about this function.');
    return embed;
  }
  
  /**
   * Advances the game to a game state
   * @param {Client} client 
   * @param {BoardGameState} state 
   */
  move(client, ind) {
    this.currentState.insert(ind, this.currPlayer.symbol);
    this.boardMessage.edit({ embed: this.boardEmbed });
    const term = this.currentState.isTerminal;
    this.nextPlayer();

    // If somebody won
    if (/(?:X|O)-won|draw/i.test(term)) {
      this.channel.send(`${this.currPlayer.member} won! GG`);
      this.collector.stop('game over');
      this.boardMessage.clearReactions();
      this.end(client, this.currPlayer, this.iter.next().value);
    }
  }

  /**
   * Makes a move for the bot.
   */
  aiMove(client) {
    const available = this.currentState.emptyCells;
    let bestMove;
  
    if (this.difficulty === 1) { // We randomly choose a cell
      bestMove = available[Math.floor(Math.random() * available.length)];
    } else {
      // We create an array of the available actions, applying each one to the current state
      let availableActions = available.map(pos => {
        let nextState = this.currentState.clone().insert(pos, 'O');
        return { idx: pos, minimaxVal: this.alphabeta(nextState, available.length, -Infinity, Infinity, true) };
      });
  
      // If it is currently the human player's turn, we want the move with the lowest, so we sort descending;
      availableActions.sort(this.sort(this.currPlayer.symbol === 'X' ? -1 : 1));
  
      bestMove = (this.difficulty === 2 ?
        ((Math.random() * 100 <= 40) ? // A 40% chance of choosing the best move
          availableActions[0] :
          ((availableActions.length >= 2) ? availableActions[1] : availableActions[0])) : // Otherwise we choose the second-best move, if there is one
        availableActions[0]); // If the difficulty is 3, we always choose the best move
    }
  
    this.move(client, bestMove.idx);
  }

  /**
   * Basically, if the next player is human we want to minimize the value, and if it is the AI we want to maximize the value.
   * This is mostly ripped off the pseudocode example on the Wikipedia page on alpha-beta pruning
   * @param {BoardGameState} node - the current state
   * @param {number} depth 
   * @param {number} a 
   * @param {number} b 
   * @param {boolean} maximizingPlayer 
   */
  alphabeta(node, depth, a, b, maximizingPlayer) {
    if (depth === 0 || node.isTerminal)
      return node.score;
    if (maximizingPlayer) {
      let value = -Infinity;
      for (let child of node.emptyCells.map(idx => node.clone().insert(idx, 'O'))) {
        value = Math.max(value, this.alphabeta(child, depth - 1, a, b, false));
        a = Math.max(a, value);
        if (a >= b)
          break; // (* b cut-off *)
      }
      return value;
    } else {
      let value = Infinity; //TODO: human or bot symbol?
      for (let child of node.emptyCells.map(idx => node.clone().insert(idx, 'X'))) {
        value = Math.min(value, this.alphabeta(child, depth - 1, a, b, true));
        b = Math.min(b, value);
        if (a >= b)
          break; // (* a cut-off *)
      }
      return value;
    }
  }

  /**
   * @param {number} direction - 1 for ascending, -1 for descending
   * @returns a function that can be passed to the Array.sort method to sort actions by their minimax values
   */
  sort(direction) {
    return (firstAction, secondAction) => {
      if (firstAction.minimaxVal < secondAction.minimaxVal) return -direction;
      else if (firstAction.minimaxVal > secondAction.minimaxVal) return direction;
      else return 0;
    };
  }

  /** Simply returns the other symbol */
  switchSymbol(symbol) {
    return symbol === 'X' ? 'O' : 'X';
  }
}

TicTacToeGame.aliases = ['ttt'];
TicTacToeGame.desc = 'Plays Tic Tac Toe! Type .help tictactoe for more info.';
TicTacToeGame.options = Game.createOptions({
  singleplayer: {
    flag: 's',
    desc: 'Starts a singleplayer game.',
    action: function(client, m, args) {
      if (args.includes('s')) this.multiplayer = false;
    }
  },
  difficulty: {
    flag: 'd',
    desc: 'Sets the difficulty to __difficulty__. Assumes **-s**.',
    action: function(client, m, args) {
      args.forEach((arg, idx) => {
        if (arg !== 'd') return;

        let diff = args[idx+1];
        [/^e(?:asy)|1$/i, /^m(?:edium)|2$/i, /^h(?:ard)|3$/i].forEach((re, i) => {
          if (re.test(diff)) this.difficulty = i+1;
        });
      });
    }
  },
  startingturn: {
    flag: 't',
    desc: 'Begins the game with you as the __startingturn__th player.',
    action: function(client, m, args) {
      args.forEach((arg, idx) => {
        if (arg !== 't') return;

        let goFirst = args[idx+1];
        if ((/^t(?:rue)|y(?:es)|1$/).test(goFirst))
          this.p1GoesFirst = true;
        else if ((/^f(?:alse)|n(?:o)|2$/).test(goFirst))
          this.p1GoesFirst = false;
      });
    }
  },
  view: {
    flag: 'v',
    usage: 'Resends the game board',
    action: async function (client, message, args) {
      if (args.includes('v'))
        this.boardMessage = await this.channel.send({ embed: this.boardEmbed });
    }
  }
});

module.exports = TicTacToeGame;
