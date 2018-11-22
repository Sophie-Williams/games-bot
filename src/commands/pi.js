const {readFileSync} = require('fs');

let piDigs = readFileSync('res/pidigits.txt', 'utf8');

module.exports = {
  desc: 'Gets the digits of pi',
  usage: 'pi [__digits__]',
  options: {
    digits: {
      desc: 'The number of digits',
      noflag: true
    }
  },
  run: (client, message, args) => {
    let numdigs = parseInt(args[0]) || 5;
    if (numdigs > 1999) message.channel.send('Discord only lets you send text up to 2000 characters :(').catch(client.error);
    message.channel.send(piDigs.substring(0, numdigs + 1)).catch(client.error);
  }
};