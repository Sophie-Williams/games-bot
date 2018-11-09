'use strict';

const { RichEmbed } = require('discord.js');
const Game = require('./Game.js');
const BoardGameState = require('./BoardGameState.js');
const AIAction = require('./AIAction.js');

const options = {
  singleplayer: {
    short: 's',
    desc: 'Starts a singleplayer game.',
    action: function () {
      this.multiplayer = false;
    },
    flag: true
  },
  difficulty: {
    short: 'd',
    desc: 'Sets the difficulty to __difficulty__. Assumes **-s**.',
    action: function (m, ind, args) {
      let diff = args[ind+1];
      [/^e(?:asy)|1$/i, /^m(?:edium)|2$/i, /^h(?:ard)|3$/i].forEach((re, i) => {
        if (re.test(diff)) this.difficulty = i+1;
      });
    }
  },
  go: {
    short: 'g',
    desc: 'Begins the game with you as the __playernum__th player.',
    action: function (m, ind, args) {
      let goFirst = args[ind+1];
      if ((/^t(?:rue)|y(?:es)|1$/).test(goFirst))
        this.p1GoesFirst = true;
      else if ((/^f(?:alse)|n(?:o)|2$/).test(goFirst))
        this.p1GoesFirst = false;
    }
  }
};

module.exports = {
  cmd: 'tictactoe',
  aliases: ['ttt'],
  desc: 'Plays Tic Tac Toe! Type .help tictactoe for more info.',
  options: options,
  gameClass: TicTacToeGame
};

function TicTacToeGame (message) {
  Game.call(this, {
    channelID: message.channel.id,
    cmd: 'tictactoe',
    numPlayersRange: [2, 2],
    reactions: { '🇦': 0, '🇧': 1, '🇨': 2, '1⃣': 2, '2⃣': 1, '3⃣': 0 },
    currentState: new BoardGameState(3, 3)
  });
}
TicTacToeGame.prototype = Object.create(Game.prototype);
TicTacToeGame.prototype.constructor = TicTacToeGame;

/*
 * Starts the game, called from startGame.js when the user starts a message with the game's init command
 */
TicTacToeGame.prototype.init = async function (message, args) {
  Object.getPrototypeOf(TicTacToeGame.prototype).init.call(this, message, args);
  this.humanPlayer = this.addPlayer(message.author.id, {symbol: 'X'});
	
  if (this.multiplayer !== undefined && !this.multiplayer) {
    this.addPlayer(global.bot.user.id, {symbol: 'O'});
    return this.start();
  }

  if (message.mentions.users.size < 1)
    return this.getChannel().send('Please mention someone to challenge to Tic Tac Toe, or type .ttt s to play singleplayer.').catch(global.logger.error);
	
  let challengedMember = message.mentions.members.first();
  if (challengedMember.user.bot || challengedMember.id === message.author.id) {
    this.addPlayer(global.bot.user.id, {symbol: 'O'});
    this.multiplayer = false;
  } else {
    await this.prompt(`${challengedMember}, you have been challenged to play Tic Tac Toe! Tap 👍 to accept.`, {
      reactions : ['👍'],
      matchID: challengedMember.id
    });
    if (this.status === 'ended') return;
    this.addPlayer(challengedMember.id, {symbol: 'O'});
    this.multiplayer = true;
  }

  this.start();
};

TicTacToeGame.prototype.start = async function () {
  if (!this.multiplayer) await this.setDifficulty();
  await this.setP1GoesFirst();

  this.boardMessage = await this.getChannel().send({embed: this.boardEmbed()});

  if (!this.multiplayer && !(this.currentState.currentPlayerSymbol === this.humanPlayer.symbol)) this.aiMove();
  await this.resetReactions();

  this.resetCollector();
};

TicTacToeGame.prototype.setDifficulty = async function (difficulty) {
  let collected;
  if (typeof difficulty === 'undefined')
    collected = await this.prompt('Don\'t worry, I don\'t have friends either. Do you want me to go 🇪asy, 🇲edium, or 🇭ard?', {
      reactions: ['🇪', '🇲', '🇭'],
      matchID: this.humanPlayer._id
    });

  this.difficulty = { '🇪': 1, '🇲': 2, '🇭': 3 }[collected.first().emoji.name];
};

TicTacToeGame.prototype.setP1GoesFirst = async function (p1GoesFirst) {
  let collected;
  if (typeof p1GoesFirst === 'undefined')
    collected = await this.prompt('Do you want to go first or second?', {
      reactions: ['1⃣', '2⃣'],
      matchID: this.humanPlayer._id
    });

  this.currentPlayer = this.humanPlayer;
  if (!collected.has('1⃣')) this.switchPlayer();
	
  this.currentState.currentPlayerSymbol = this.currentPlayer.symbol;
  this.getChannel().send(`${this.currentPlayer.getUser()}, your turn! React with the coordinates of the square you want to move in, e.x. "🇧2⃣".`);
};

TicTacToeGame.prototype.resetReactions = async function (msg=this.boardMessage, emojis=Object.keys(this.reactions)) {
  await msg.clearReactions().catch(global.logger.error);
  for (let emoji of emojis)
    await msg.react(emoji);
};

TicTacToeGame.prototype.areReactionsReset = function (msg=this.boardMessage, reactions = Object.keys(this.reactions)) {
  const reactedEmojis = msg.reactions.map(re => re.emoji.name);
  return (reactions.every(emoji => reactedEmojis.includes(emoji)));
};

TicTacToeGame.prototype.resetCollector = function () {
  let reactionFilter = (r, emoji) => r.message.reactions.get(emoji).users.has(this.currentPlayer._id);

  this.collector = this.boardMessage.createReactionCollector(r => {
    if (this.status !== 'running') return;
    if (this.currentPlayer._id === global.bot.user.id) return;
    if (!this.areReactionsReset(r.message)) return;
    const rowSelected = ['1⃣', '2⃣', '3⃣'].some(row => reactionFilter(r, row));
    const colSelected = ['🇦', '🇧', '🇨'].some(col => reactionFilter(r, col));
    return rowSelected && colSelected;
  }, {time: 5 * 60 * 1000});

  this.collector.on('collect', r => {
    let row = this.reactions[['1⃣', '2⃣', '3⃣'].filter(row => reactionFilter(r, row))[0]];
    let col = this.reactions[['🇦', '🇧', '🇨'].filter(col => reactionFilter(r, col))[0]];

    let ind = row * 3 + col;
    if (this.currentState.contents[ind] !== ' ')
      return this.getChannel().send('That is not a valid move!').catch(global.logger.error);
    let next = new BoardGameState(this.currentState);
    next.contents[ind] = this.currentState.currentPlayerSymbol;
    next.currentPlayerSymbol = switchSymbol(next.currentPlayerSymbol);
    this.advanceTo(next);

    if (!this.multiplayer && !(this.currentState.currentPlayerSymbol === this.humanPlayer.symbol))
      this.aiMove();

    this.resetReactions();
  });

  this.collector.on('end', (collected, reason) => {
    if (reason === 'game over') return;
    this.sendCollectorEndedMessage(reason);
  });
};

TicTacToeGame.prototype.switchPlayer = function () {
  let playerIDs = Object.keys(this.players);
  playerIDs.splice(playerIDs.indexOf(this.currentPlayer.id), 1);
  this.currentPlayer = Object.assign({}, this.players[playerIDs[0]]);
};

TicTacToeGame.prototype.boardEmbed = function () {
  const embed = new RichEmbed()
    .setTimestamp()
    .setTitle('Tic Tac Toe')
    .addField('Players', `${Object.values(this.players).map(p => `${p.user} (${p.symbol})`).join(' vs ')}`)
    .addField('Grid', this.currentState.grid())
    .setFooter('Type ".ttt help" to get help about this function.');
  return embed;
};

TicTacToeGame.prototype.advanceTo = function (state) {
  this.currentState = state;
  this.boardMessage.edit({embed: this.boardEmbed()});
  const term = this.currentState.isTerminal();
  this.currentState.result = term ? term : 'running';
  this.switchPlayer();
  if (/(?:X|O)-won|draw/i.test(this.currentState.result)) {
    this.status = 'ended';
    this.getChannel().send(`${this.currentPlayer.getUser()} won! GG`).catch(global.logger.error);
    this.collector.stop('game over');
    this.boardMessage.clearReactions();
    this.end();
  }
};

TicTacToeGame.prototype.aiMove = function () {
  if (this.status !== 'running') return;
  const available = this.currentState.emptyCells();
  let action;
  const turn = this.currentState.currentPlayerSymbol === 'X';

  if (this.difficulty === 1) {
    let randomCell = available[Math.floor(Math.random() * available.length)];
    action = new AIAction(randomCell);
  } else {
    let availableActions = available.map(pos => {
      let availableAction = new AIAction(pos);
      let nextState = availableAction.applyTo(this.currentState, switchSymbol(this.humanPlayer.symbol));
      availableAction.minimaxVal = AIAction.minimaxValue(nextState, this.humanPlayer.symbol);
      return availableAction;
    });

    availableActions.sort((turn === this.humanPlayer.symbol) ? AIAction.DESCENDING : AIAction.ASCENDING);

    action = (this.difficulty === 2 ?
      ((Math.random() * 100 <= 40) ?
        availableActions[0] :
        ((availableActions.length >= 2) ? availableActions[1] : availableActions[0])) :
      availableActions[0]);
  }

  let next = action.applyTo(this.currentState, switchSymbol(this.humanPlayer.symbol));
  this.advanceTo(next);
};

TicTacToeGame.prototype.score = function (state) {
  if (state.result === `${this.humanPlayer.symbol}-won`)
    return 10 - state.aiMovesCount;
  if (state.result === `${switchSymbol(this.humanPlayer.symbol)}-won`)
    return -10 + state.aiMovesCount;
  return 0;
};

function switchSymbol(sym) {
  return (sym === 'X') ? 'O' : 'X';
}