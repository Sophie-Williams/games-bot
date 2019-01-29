const { readFileSync } = require('fs');

// We read the digits of pi from a file
let piDigs = readFileSync('res/pidigits.txt');

module.exports = {
  desc: 'Gets the digits of pi',
  options: {
    digits: {
      desc: 'The number of digits'
    }
  },
  run: (client, message, args) => {
    let numdigs = parseInt(args[0]) || 5; // Get the number of digits (default 5), checks it fits the discord character limit, and sends it
    if (numdigs > 1999) return message.channel.send('Discord only lets you send text up to 2000 characters :(');
    message.channel.send(piDigs.substring(0, numdigs + 1)); // + 1 since the decimal point doesn't count as a digit
  }
};