module.exports = {
  desc: 'Tests reactions',
  run: async (client, message) => {
    const msg = await message.channel.send('React to this message in the next minute to get information about emojis:');
    const collector = msg.createReactionCollector((r, user) => user.id === message.author.id, {maxUsers: 1, time: 60 * 1000});
    collector.on('end', collected => {
      client.info(collected.first().emoji.name);
    });
  }
};