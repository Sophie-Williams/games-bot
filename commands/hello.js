const languages = {
  Portuguese: 'Olá',
  Latin: 'Salve',
  Dutch: 'Hallo',
  Hawaiian: 'Aloha',
  Chinese: '你好',
  German: 'Hallo',
  Spanish: '¡Hola',
  Japanese: 'こんにちは',
  French: 'Bonjour',
  Greek: 'Χαίρετε',
  Hindi: 'नमस्ते',
  Hebrew: 'שלום',
  Russian: 'Здравствуйте',
  Korean: '여보세요',
  Thai: 'สวัสดี',
  English: 'Hello',
  Italian: 'Ciao'
};

module.exports = {
  aliases: ['hi', 'sayHi', 'sayHello'],
  desc: 'Says hello!',
  options: {
    language: {
      desc: 'The language to say hello in'
    }
  },
  run: (client, message, args) => {
    let lang;
    // If an argument is passed, we make sure it fits the same formatting as our languages
    if (args[0])
      lang = args[0].charAt(0).toUpperCase() + args[0].slice(1).toLowerCase();
		
    if (!Object.keys(languages).includes(lang)) // If there is no language, we randomly choose one with a bit of math
      lang = Object.keys(languages)[Math.floor(Math.random() * Object.keys(languages).length)];
    
    message.channel.send(`${languages[lang]}! (${lang})`); // And send it
  }
};
