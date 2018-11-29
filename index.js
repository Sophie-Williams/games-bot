/**
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

require('./src/internal/initmongodb')(client);
client.info('Database initialized');

/** @type {Collection} a collection to store the commands under src/commands */
client.commands = new Collection();
/** @type {Collection} a collection to store the ongoing games in temporary memory, since their functions are hard to be stored in databases */
client.games = new Collection();

// We load the files under src/commands and src/gameclasses
['commands', 'gameclasses', 'events'].forEach(fileType =>
  readdir(`./src/${fileType}`, (err, files) => {
    if (err) return client.error(err);
    client.verbose(`Loading ${files.length} ${fileType}`);
    files.forEach(f => loadFile(fileType, f));
  })
);

/**
 * A function that loads commands into the client.commands collection and events.
 * @param {string} fileType one of commands, gameclasses, or events
 * @param {string} file 
 */
function loadFile(fileType, file) {
  let data = require(`./src/${fileType}/${file}`);
  let name = file.split('.')[0]; // If the command has a name, we set it to that, otherwise it's the filename without the extension

  client.debug(`Loading ./src/${fileType}/${file}`);
  if (fileType === 'events') {
    client.on(name, data.bind(null, client));
  } else { // Commands and game classes are treated separately
    if (!data.run) return; // We quit if the file is not a command
    data.usage = data.aliases ? [name, ...data.aliases].join('|') : name; // First joining the command name with its aliases
    
    data.options = data.options || {}; // We generate the usage for each option, setting it to an empty array to prevent needing to check before forEach loops later
    Object.keys(data.options).forEach(param => { // We go through its options and add each one accordingly
      let opt = data.options[param];
      if (opt.required) // If it's required, we underline it and the description
        data.usage += ` __${param}__`;
      else // It's optional, so we surround it with brackets
        data.usage += ` [${((opt.flag ? `**${opt.flag}** ` : '') + (opt.noParam ? '' : `__${param}__`)).trim()}]`;
    });

    client.commands.set(name, data);
    if (data.aliases) data.aliases.forEach(alias => // We set the aliases onto client.commands as well
      client.commands.set(alias, data)
    );
  }

  // We delete it from the cache
  delete require.cache[require.resolve(`./src/${fileType}/${file}`)];
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
  client.error(e.stack);
  exitHandler('uncaughtException');
});
