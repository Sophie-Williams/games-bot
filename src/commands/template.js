module.exports = {
  desc: 'A general template for what the code for a command should look like',
  aliases: ['cmdtemp', 'template'],
  options: {
    'The name of the option': {
      desc: 'What passing this option does',
      aliases: ['other names', 'for the option'],
      required: 'A boolean. If it is true, we don\'t add its flag, e.x. [__section__]; otherwise: [**-m** __system__]'
    }
  },
  run: (message, args) => `What to do when the function gets called, with ${message} and ${args} as arguments`,
  gameClass: 'Usually an object containing data for a game. Commands with this property should be placed in the gameclasses folder.'
};