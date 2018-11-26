module.exports = {
  aliases: ['ggg'],
  desc: 'Tells if you can bring an item through the green glass doors.',
  options: {
    item: {
      desc: 'The item you want to try and bring through the Green Glass Doors',
      required: true
    }
  },
  run: (client, message, args) => {
    let phrase = args.join(' ').trim();
    // If the phrase does not consist of only alphanumeric characters, we return an error message
    if (!/^[\sa-z]+$/i.test(phrase)) return message.channel.send('You need to choose something to bring!').catch(client.error);
    
    // We loop through the characters of the phrase. If two consecutive ones are equal (which is the rule), we can bring it through.
    for (let i = 1; i < phrase.length; i++)
      if (phrase.charAt(i).toLowerCase() === phrase.charAt(i-1).toLowerCase())
        return message.channel.send(`Yes, you can bring ${phrase} through the Green Glass Doors.`).catch(client.error);
      
    message.channel.send(`No, you cannot bring ${phrase} through the Green Glass Doors.`).catch(client.error);
  }
};