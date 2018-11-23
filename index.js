/*
 * This is the entry point for GamesBot, a discord bot in javascript using the discord.js library.
 * It was first created by Alexander Cai in 2017.
 * It's main purpose is to provide entertainment to discord users by allowing them to play board games directly in discord.
 * Further information, such as the GitHub repo and installation instructions are in the README.
 * Feel free to make a pull request or post any errors you find, even if it's just messy code.
 */

const { Client, Collection } = require('discord.js');
const { readdir } = require('fs');
require('dotenv').load();

// We set up the client and the logger
const client = new Client();
require('./src/internal/logger')(client);
client.info('Client initialized');
client.info('Logger initialized');

require('./src/internal/initmongodb.js')(client);
client.info('Database initialized');

/** @type {Collection} a collection to store the commands under src/commands */
client.commands = new Collection();

// We load the files under src/commands and src/gameclasses
['commands', 'gameclasses', 'events'].forEach(fileType => {
  readdir(`./src/${fileType}`, (err, files) => {
    if (err) throw err;
    client.verbose(`Loading ${files.length} ${fileType}`);
    files.forEach(f => loadFile(fileType, f));
  });
});

function loadFile(fileType, file) {
  let name = file.split('.')[0];
  let data = require(`./src/${fileType}/${file}`);

  client.debug(`Loading ./src/${fileType}/${file}`);
  if (fileType === 'events') {
    client.on(name, data.bind(null, client));
    delete require.cache[require.resolve(`./src/events/${file}`)];
  } else {
    if (!data.run) return; // We quit if the file is not a command
    client.commands.set(name, data);
    if (data.aliases) data.aliases.forEach(alias => client.commands.set(alias, data));
  }
  client.debug(`Loaded ${name}`);
}

// We login with the token specified in .env
client.login(process.env.BOT_TOKEN);

/**
 * This exit handler simply makes sure the program terminates gracefully when
 * it is killed, nodemon restarts, or an error occurs.
 */
let exitHandler = exitCode => {
  client.dbclient.close();
  client.info('MongoDB closed');
  if (exitCode !== undefined) client.info(exitCode);
  client.info('Shutting down');
  process.exit();
};

process.on('SIGINT', exitHandler);
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);
process.on('uncaughtException', e => {
  client.info(e.stack);
  exitHandler('uncaughtException');
});
