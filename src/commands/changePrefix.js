module.exports = {
  desc: 'change the prefix for this bot on your server',
  options: {
    prefix: {
      desc: 'My new prefix',
      required: true
    }
  },
  run: (message, args) => {
    if (args[0]) global.db.collection(message.guild.id).updateOne({ _id: 0 }, { $set: { prefix: args[0] } });
    else message.channel.send('What do you want to set my prefix to?').catch(global.logger.error);
  }
};