// For clarification, I use "guild" &c to represent the Guild discord.js object, and "server" &c to represent how they are
// represented on the database

const { MongoClient } = require('mongodb');
const uri = 'mongodb://root:cai15212@ds255403.mlab.com:55403/the-pi-guy';

let dbclient;

MongoClient.connect(uri, { useNewUrlParser: true }, (err, client) => {
  if (err) throw err;
  dbclient = client;
  global.db = client.db('the-pi-guy');
  global.logger.info('Database connected');
});

module.exports.initServers = () => {
  global.bot.guilds.forEach(guild => {    
    guild.members.forEach(member => {
      global.db.collection(guild.id).findOne({ _id: member.id }, (err, res) => {
        if (err) throw err;
        if (!res) addMember(member);
      });
    });
  });
};

module.exports.closeDB = () => {
  dbclient.close();
};

function addMember(member) {
  global.db.collection(member.guild.id).insertOne({
    _id: member.id,
    games: [],
    score: 0
  });
}