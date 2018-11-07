/*
 * This is the entry point for GamesBot, a discord bot in javascript using the discord.js library.
 * It was first created by Alexander Cai in 2017.
 * It's main purpose is to provide entertainment to discord users by allowing them to play board games directly in discord.
 * Further information, such as the GitHub repo and installation instructions are in the README.
 * Feel free to make a pull request or post any errors you find, even if it's just messy code.
 */

const { Client } = require('discord.js');
const commands = require('./src/internal/getCommands.js');
const dotenv = require('dotenv');
dotenv.load();

let prefix = process.env.DEFAULT_PREFIX || '.';

// load in the logger and the database
require('./src/internal/logger.js');
const mongodb = require('./src/internal/mongodb.js');

global.logger.info('Initializing client');
const bot = new Client();
global.bot = bot;

// From the discord.js docs: "Emitted when the client becomes ready to start working."
bot.on('ready', () => {
  global.logger.info(`${bot.user.username} is connected.`);
  bot.user.setActivity('with my board games', { type: 'PLAYING' });
  mongodb.initServers();
});

/*
 * The main command for handling messages. If the message starts with the prefix for the bot on the server,
 * it will run the command they type
 */
let args, cmd;
bot.on('message', message => {
  if (message.author.bot) return;
  if (message.channel.type !== 'text') return;

  if (!(message.content.indexOf(prefix) === 0)) return;

  args = message.content.substring(1).split(' ');
  cmd = args.shift();

  if (!commands.hasOwnProperty(cmd))
    return message.channel.send('That is not a valid command. Please type .help to get help').catch(global.logger.error);
  try {
    global.logger.info(`message responded from user ${message.author.username}. Content: "${message.content}"`);
    commands[cmd].run(message, args);
  } catch (err) {
    message.channel.send('Beep boop error error').catch(global.logger.error);
    global.logger.error(err.stack);
  }
});

// bot.on('guildMemberAdd', () => {
// });
// bot.on('guildMemberRemove', () => {
// });

bot.login(process.env.BOT_TOKEN);

/*
 * This exit handler simply makes sure the program terminates gracefully when
 * it is killed, nodemon restarts, or an error occurs.
 */
let exitHandler = function (exitCode) {
  mongodb.closeDB();
  global.logger.info('MongoDB closed');
  if (exitCode !== undefined) global.logger.info(exitCode);
  process.exit();
};

process.on('SIGINT', exitHandler);
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);
process.on('uncaughtException', e => {
  global.logger.info(e.stack);
  exitHandler('uncaughtException');
});
