const mongoose = require('mongoose');

module.exports = client => {
  mongoose.connect(process.env.MONGODB_URI);
  client.db = mongoose.connection;
  client.db.on('error', console.error.bind(console, 'Connection error: '));
  client.db.once('open', console.log.bind(console, 'Mongoose connected'));
};
