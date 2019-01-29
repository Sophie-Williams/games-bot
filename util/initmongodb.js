// For clarification, I use "guild" &c to represent the Guild discord.js object, and "server" &c to represent how they are
// represented on the database

const mongoose = require('mongoose');

module.exports = () => {
  mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'Connection error: '));
  db.once('open', console.log.bind(console, 'Mongoose connected'));
};
