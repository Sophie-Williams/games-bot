const fs = require('fs');

module.exports = {
  desc: 'Gets the digits of pi',
  options: {
    digits: {
      desc: 'The number of digits',
      noflag: true
    }
  },
  run: (message, args) => {
    fs.readFile('res/pidigits.txt', 'utf8', (err, data) => {
      if (err) throw err;
      let numdigs = parseInt(args[0]) || 5;
      if (numdigs > 1999) message.channel.send('Discord only lets you send text up to 2000 characters :(').catch(global.logger.error);
      message.channel.send(data.substring(0, numdigs + 1)).catch(global.logger.error);
    });
  }
};