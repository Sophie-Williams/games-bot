const RichEmbed = require('discord.js').RichEmbed;
const Game = require('./Game.js');

const locations = {
  1: ['Airplane', 'Bank', 'Beach', 'Cathedral', 'Circus Tent', 'Corporate Party', 'Crusader Army', 'Casino', 'Day Spa', 'Embassy', 'Hospital', 'Hotel', 'Military Base', 'Movie Studio', 'Ocean Liner', 'Passenger Train', 'Pirate Ship', 'Polar Station', 'Police Station', 'Restaurant', 'School', 'Service Station', 'Space Station', 'Submarine', 'Supermarket', 'Theater', 'University', 'World War II Squad'],
  get one() { return this[1]; },
  2: ['Race Track', 'Art Museum', 'Vineyard', 'Baseball Stadium', 'Library', 'Cat Show', 'Retirement Home', 'Jail', 'Construction Site', 'The United Nations', 'Candy Factory', 'Subway', 'Coal Mine', 'Cemetery', 'Rock Concert', 'Jazz Club', 'Wedding', 'Gas Station', 'Harbor Docks', 'Sightseeing Bus'],
  get two() { return this[2]; },
  get 3() { return this[1].concat(this[2]); },
  get both() { return this[3]; }
};

/**
 * We play the identity guessing game Spyfall, based off https://spyfall.crabhat.com/
 */
class SpyfallGame extends Game {
  /**
   * 
   * @param {Client} client - the logged in client
   * @param {message} message - the message to respond to
   * @param {string[]} args - the passed args
   * @param {string} id - the id of the 
   */
  constructor(client, message, args, id) {
    super(id);
    this.channel = message.channel;
    this.type = 'spyfall';
    this.locations = this.locations || locations[1];
  }

  /**
   * Responds to a message. Remember, since this is static, this does NOT refer to the game; it refers to the TicTacToeGame object.
   * @param {Client} client - The logged in client
   * @param {Message} message - The message to respond to
   * @param {args} args - The arguments passed by the user
   */
  static run(client, message, args) {
    super.generateRunCommand(client, message, args, SpyfallGame);
  }

  /**
   * 
   * @param {Client} client - The logged in client
   * @param {string[]} pIDs 
   */
  async start(client, pIDs) {
    this.spyID = pIDs[Math.floor(Math.random() * pIDs.length)];
    for (let id of pIDs)
      this.addPlayer(id, {isSpy: id === this.spyID, scratched: []});

    Object.values(this.players).forEach(async player => {
      player.message = await player.user.send({embed: this.locationEmbed(player)});
      player.collector = player.user.dmChannel.createMessageCollector(m => (parseInt(m.content) > 0) && (parseInt(m.content) <= this.locations.length), {time: this.gameTime});
    
      player.collector.on('collect', msg => {
        let toScratch = parseInt(msg) - 1;
        if (player.scratched.includes(toScratch))
          player.scratched.splice(player.scratched.indexOf(toScratch), 1);
        else player.scratched.push(toScratch);
        player.message.edit({embed: this.locationEmbed(player)});
      });
    });

    this.startingTime = new Date().getTime();
    this.boardMessage = await this.getChannel().send(`Time remaining: ${this.gameTime}`);

    client.setInterval(() => {
      let remaining = this.gameTime - (new Date().getTime() - this.startingTime);
      if (remaining <= 0) return this.boardMessage.edit('Time\'s up!');
      let minutes = Math.floor(remaining / 1000 / 60);
      let seconds = Math.floor((remaining / 1000) % 60);
      let embed = new RichEmbed()
        .setTitle('Spyfall')
        .setDescription(`Time remaining: ${minutes}:${seconds}`)
        .addField('Players', Object.values(this.players).map(p => p.user).join('\n'))
        .setFooter(`Type .help spyfall to get help about the game. Game ID: ${this.id}`)
        .setTimestamp();
      this.boardMessage.edit({embed: embed});
    }, 5000);
  }

  locationEmbed(player) {
    let embed = new RichEmbed()
      .setTitle(`You are ${player.isSpy ? '' : '**not**'} the spy!`)
      .addField('Location Reference', this.locations.map((loc, ind) => `${player.scratched.includes(ind) ? '~~' : ''}[${ind+1}] ${loc}${player.scratched.includes(ind) ? '~~' : ''}`))
      .setFooter('To cross /un-cross out a location, type its number.');
    return embed;
  }
}

SpyfallGame.type = 'spyfall';
SpyfallGame.desc = 'Play the hidden identity game Spyfall!';
SpyfallGame.options = Game.createOptions({
  version: {
    flag: 'v',
    action (client, message, args) {
      args.forEach((arg, idx) => {
        if (['version', 'v'].includes(args[idx]))
          this.locations = locations[args[idx+1]];
      });
    }
  }
});

module.exports = SpyfallGame;
