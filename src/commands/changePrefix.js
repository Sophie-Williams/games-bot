module.exports = {
  desc: 'change the prefix for this bot on your server',
  usage: 'changePrefix __newPrefix__',
  options: {
    prefix: {
      desc: 'My new prefix',
      required: true
    }
  },
  run: (client, message, args) => {
    if (args[0]) client.mongodb.collection(message.guild.id).updateOne({ _id: 0 }, { $set: { prefix: args[0] } });
    else message.channel.send('What do you want to set my prefix to?').catch(client.error);
  }
};