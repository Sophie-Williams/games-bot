module.exports = {
  desc: 'change the prefix for this bot on your server',
  options: {
    newprefix: {
      desc: 'My new prefix',
      required: true
    }
  },
  run: (client, message, args) => {
    // If no args are passed, we break with an error message
    if (!args[0]) return message.channel.send('What do you want to set my prefix to?').catch(client.error);
    
    // We update the server settings and change the server prefix to the first argument passed
    client.mongodb.collection(message.guild.id).updateOne({ _id: 0 }, { $set: { prefix: args[0] } }, err => {
      if (err) return client.error(err);
      // and tell the user it's been updated
      message.channel.send(`Server prefix successfully changed to ${args[0]}.`);
    });
  }
};