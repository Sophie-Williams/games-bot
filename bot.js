/*
 * This is the entry point for GamesBot, a discord bot in javascript using the discord.js library.
 * It was first created by Alexander Cai in 2017.
 * It's main purpose is to provide entertainment to discord users by allowing them to play board games directly in discord.
 * Further information, such as the GitHub repo and installation instructions are in the README.
 * Feel free to make a pull request or post any errors you find, even if it's just messy code.
 */

const { Client } = require('discord.js');
const dotenv = require('dotenv');
dotenv.load();

// load in the logger and the database
require('./src/internal/logger.js');
const mongodb = require('./src/internal/mongodb.js');
const commands = require('./src/internal/commands.js');

global.logger.info('Initializing client');
const bot = new Client();
global.bot = bot;

// From the discord.js docs: "Emitted when the client becomes ready to start working."
bot.on('ready', () => {
  global.logger.info(`Logged in at ${bot.user.tag}.`);
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

  global.db.collection(message.guild.id).findOne({ _id: 0 }, (err, res) => {
    if (err) throw err;

    let prefix = res.prefix;
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
});

bot.on('guildMemberAdd', mongodb.addMember);
bot.on('guildMemberRemove', mongodb.deleteMember);

bot.on('warn', global.logger.warn);
bot.on('error', global.logger.error);

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
