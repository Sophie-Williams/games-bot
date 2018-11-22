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
require('./src/internal/logger.js')(client);
client.log('Initializing client');

/** @type {Collection} a collection to store the commands under src/commands */
client.commands = new Collection();

// We load the files under src/commands and src/gameclasses
['commands', 'gameclasses'].forEach(fileType => {
  readdir(`./src/${fileType}`, (err, files) => {
    if (err) throw err;
    client.log(`Loading ${files.length} ${fileType}s`);
    files.forEach(f => loadFile(fileType, f));
  });
});

// We load the events under src/events
readdir('./src/events/', (err, files) => {
  if (err) throw err;
  files.forEach(file => {
    let evtName = file.split('.')[0];
    let event = require(`./src/events/${file}`);
    
    // We make sure client is the first argument passed
    client.on(evtName, event.bind(null, client));
    delete require.cache[require.resolve(`./events/${file}`)];
  });
});

function loadFile(fileType, file) {
  let name = file.split('.')[0];
  let data = require(`./src/${fileType}/${file}`);
  if (!data.run) return; // We quit if the file is not a command

  client.commands.set(name, data);
  data.aliases.forEach(alias => client.commands.set(alias, data));
}

// We login with the token specified in .env
client.login(process.env.BOT_TOKEN);

/**
 * This exit handler simply makes sure the program terminates gracefully when
 * it is killed, nodemon restarts, or an error occurs.
 */
let exitHandler = exitCode => {
  client.dbclient.close();
  client.log('MongoDB closed');
  if (exitCode !== undefined) client.log(exitCode);
  process.exit();
};

process.on('SIGINT', exitHandler);
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);
process.on('uncaughtException', e => {
  client.log(e.stack);
  exitHandler('uncaughtException');
});
