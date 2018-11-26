const Card = require('../gameclasses/Card.js');

module.exports.commands = {
  desc: 'shows what the __val__ of __suit__s looks like',
  options: {
    val: {
      desc: 'The card\'s value',
      required: true
    },
    suit: {
      desc: 'The card\'s suit',
      required: true
    }
  },
  run: (client, message, args) => {
    let card = new Card(args[0], args[1]);
    if (card) card.show(message);
  }
};
