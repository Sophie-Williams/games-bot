const Game = require('./Game');

const reactions = {
  '🇷': 0,
  '🇵': 1,
  '🇸': 2
};

const words = ['Rock :black_circle:', 'Paper :newspaper:', 'Scissors :scissors:'];

const P1 = 0, P2 = 1, TIE = -1;
const results = [ // The row represents the first player's choice, the column represents the second's. The value represents who won.
  //Rock  Paper  Scissors
  [TIE,   P2,    P1], // Rock
  [P1,    TIE,   P2], // Paper
  [P2,    P1,    TIE] // Scissors
];

/**
 * Plays the classic game rock paper scissors.
 */
class RockPaperScissorsGame extends Game {
  /**
   * We start a game. If anybody is mentioned, we go multiplayer and prompt both players for an answer. Otherwise,
   * the player simply plays against the bot.
   * @param {Client} client 
   * @param {Message} message 
   * @param {string[]} args 
   */
  static async run(client, message, args) {
    super.run(client, message, args);
    
    if (message.mentions.members.size > 0) {// If someone gets mentioned, we play against the first mention
      let players = [message.member, message.mentions.members.first()];
      message.channel.send('Wait for a DM to tell me your choice'); // We can do this async

      try {
        let choices = await Promise.all([
          this.prompt(client, players[0].dmChannel),
          this.prompt(client, players[1].dmChannel)
        ]);

        let result = '';
        [0, 1].forEach(i => result += `${players[i].displayName} chose ${words[choices[i]]}\n`);

        // The index of the winner is found using the array above. If it is a tie, we break out of the function and nobody changes score
        let winner = results[choices[0]][choices[1]];
        if (winner === TIE) return message.channel.send(result + 'It was a draw. GG!');
        
        // Then someone wins
        result += `${players[winner]} won. GG!`;
        message.channel.send(result);

        this.end(client, players[winner], players[1 - winner]);
      } catch (err) { // Catch if the collector timed out or other errors occurred
        return this.sendCollectorEndedMessage(client, err);
      }
    } else { // Otherwise we play against the bot
      let botChoice = Math.floor(Math.random() * 3); // We simply get a random reaction
      let playerChoice = await this.prompt(client, message.channel, message.author.id); // Prompt the channel for the player's choice
      let result = `I chose ${words[botChoice]}.\nYou chose ${words[playerChoice]}.\n`; // Create a string storing the choices

      let winner = results[playerChoice][botChoice]; // Find the result
      if (winner === TIE) result += 'It was a draw. GG!';
      if (winner === P1) result += 'I won! GG!';
      if (winner === P2) result += 'You won! GG!';

      message.channel.send(result);
    }
  }

  static init(client, message, args, id) {
    client.games.set(id, new RockPaperScissorsGame());
  }

  async prompt(client, channel, matchID) {
    let collected = await super.prompt(client, channel, 'Would you like to show 🇷ock, 🇵aper, or 🇸cissors?', { reactions: Object.keys(reactions), matchID });
    await channel.send(`You chose ${words[reactions[collected.first().emoji.name]]}.`);
    return reactions[collected.first().emoji.name];
  }
}

RockPaperScissorsGame.aliases = ['rps'];
RockPaperScissorsGame.desc = 'Plays rock paper scissors';
RockPaperScissorsGame.type = 'rockpaperscissors';
RockPaperScissorsGame.options = Game.createOptions({
  '@opponent': {
    desc: 'The person to play against'
  }
});

module.exports = RockPaperScissorsGame;
