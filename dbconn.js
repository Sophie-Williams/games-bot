// For clarification, I use "guild" &c to represent the Guild discord.js object, and "server" &c to represent how they are
// represented on the database

const { MongoClient } = require('mongodb');
const uri = 'mongodb://root:cai15212@ds255403.mlab.com:55403/the-pi-guy';

let dbclient;
let db;

MongoClient.connect(uri, { useNewUrlParser: true }, (err, client) => {
  if (err) throw err;
  dbclient = client;
  db = client.db('the-pi-guy');
  global.logger.info('Database connected');
});

module.exports.initServers = () => {
  global.bot.guilds.forEach(guild => {
    db.collection(guild.id);
    global.logger.info(`Created guild ${guild.id}`);
    guild.members.forEach(addMember);
  });
};

module.exports.closeDB = () => {
  dbclient.close();
};

function addMember(member) {
  db.collection(member.guild.id).updateOne({ _id: member.id }, {
    _id: member.id,
    games: []
  }, { upsert: true });
}
