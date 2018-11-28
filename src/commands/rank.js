module.exports = {
  aliases: ['me', 'myrank', 'score', 'myscore'],
  desc: 'Shows your score and rank',
  options: {
    '@player': {
      desc: 'The player to get info about'
    }
  },
  run: async (client, message) => {
    let queryID = message.mentions.members.size > 0 ? message.mentions.members.first() : message.member.id;
    let player = await client.mongodb.collection(message.guild.id).findOne({ _id: queryID });
    message.channel.send(`${message.member.displayName}'s score: ${player.score}`);

    // TODO: loop through members, sort them, rank them
  }
};