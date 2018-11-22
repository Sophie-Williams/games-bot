// For clarification, I use "guild" &c to represent the Guild discord.js object, and "server" &c to represent how they are
// represented on the database

const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;

module.exports = client => {
  MongoClient.connect(uri, { useNewUrlParser: true }, (err, dbclient) => {
    if (err) throw err;
    client.dbclient = dbclient;
    client.mongodb = dbclient.db('the-pi-guy');
    client.log('Database connected');
  });
};
