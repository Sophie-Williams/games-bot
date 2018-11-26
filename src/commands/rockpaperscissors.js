const reactions = {
  '🇷': 0,
  '🇵': 1,
  '🇸': 2
};

const words = ['Rock', 'Paper', 'Scissors'];

const results = [
  //Rock Paper Scissors
  [0,    1,    -1], // Rock
  [-1,   0,    1], // Paper
  [1,    -1,   0] // Scissors
];

module.exports = {
  aliases: ['rps'],
  desc: 'Plays rock paper scissors',
  options: {
    '@opponent': {
      desc: 'The person to play against'
    }
  },
  run: async (client, message) => {
    // If nobody gets mentioned, we play against the bot, otherwise we play against the first person mentioned
    let players = [message.member];
    players.push(message.mentions.members.size < 1 ? message.guild.members.get(client.user.id) : message.mentions.members.first());
    
    message.channel.send('Wait for a DM to tell me your choice').catch(client.error);
    let choices = [null, null];

    for (let i in players) {
      let player = players[i];
      if (player.id === client.id) {
        choices[i] = Object.values(reactions)[Math.floor(Math.random() * 3)];
        return;
      }

      // We prompt the user for their choice
      let msg = await player.user.send('Would you like to show 🇷ock, 🇵aper, or 🇸cissors?').catch(client.error);

      // We react with rock, paper, scissors
      for (let i = 0; i < 3; i++) await msg.react(Object.keys(reactions)[i]);

      // We send directly to the user, so we don't need to worry about checking their id
      let collected = await msg.awaitReactions(r => ['🇷', '🇵', '🇸'].includes(r.emoji.name), {maxUsers: 1, time: 60 * 1000});
      if (collected.size < 1) return this.sendCollectorEndedMessage().catch(client.error);

      player.user.send(`You chose ${reactions[collected.first().emoji.name]}.`);
      choices[i] = reactions[collected.first().emoji.name];
    }

    let result = '';
    [0, 1].forEach(ind => result += `${players[ind]} chose ${words[choices[ind]]}\n`);

    // We check if player 1 won using the array above
    let p1won = results[choices[0]][choices[1]];
    result += p1won ? `${(p1won === 1 ? players[0] : players[1])} won. GG!` : 'It was a draw. GG!';
  },
  dev: true
};
