module.exports = {
  aliases: ['ggg'],
  usage: 'greenglassdoors __item__',
  desc: 'Tells if you can bring an item through the green glass doors.',
  options: {
    item: {
      desc: 'The item you want to try and bring through the Green Glass Doors',
      required: true
    }
  },
  run: (client, message, args) => {
    let phrase = args.join(' ');
    if (!/[\sa-z]+/i.test(phrase))
      return message.channel.send('You need to choose something to bring!').catch(client.error);
      
    for (let i = 1; i < phrase.length; i++)
      if (phrase.charAt(i).toLowerCase() === phrase.charAt(i-1).toLowerCase())
        return message.channel.send(`Yes, you can bring ${phrase} through the Green Glass Doors.`).catch(client.error);
      
    message.channel.send(`No, you cannot bring ${phrase} through the Green Glass Doors.`).catch(client.error);
  }
};