const { MongoClient } = require('mongodb');
const uri = 'mongodb://root:cai15212@ds255403.mlab.com:55403/the-pi-guy';

MongoClient.connect(uri, (err, db) => {
  if (err) throw err;
  console.log('Database created!');
  let dbo = db.db('the-pi-guy');
  dbo.createCollection('servers', (err, res) => {
    if (err) throw err;
    console.log('Collection created!');
    db.close();
  });
});