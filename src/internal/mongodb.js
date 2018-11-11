// For clarification, I use "guild" &c to represent the Guild discord.js object, and "server" &c to represent how they are
// represented on the database

const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;

let dbclient;

MongoClient.connect(uri, { useNewUrlParser: true }, (err, client) => {
  if (err) throw err;
  dbclient = client;
  global.db = client.db('the-pi-guy');
  global.logger.info('Database connected');
});

module.exports.closeDB = () => dbclient.close();

module.exports.initServers = () => {
  global.bot.guilds.forEach(guild => {    
    guild.members.forEach(member => {
      global.db.collection(guild.id).findOne({ _id: member.id }, (err, res) => {
        if (err) throw err;
        if (!res) addMember(member);
      });
    });

    global.db.collection(guild.id).findOne({ _id: 0 }, (err, res) => {
      if (err) throw err;
      if (!res) global.db.collection(guild.id).insertOne({
        _id: 0,
        prefix: process.env.DEFAULT_PREFIX || '.'
      });
    });
  });
};

module.exports.addMember = addMember;
module.exports.deleteMember = function (member) {
  global.db.collection(member.guild.id).deleteOne({_id: member.id});
};

function addMember(member) {
  global.db.collection(member.guild.id).insertOne({
    _id: member.id,
    games: [],
    score: 0
  });
}


