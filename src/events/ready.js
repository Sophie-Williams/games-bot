module.exports = client => {
  client.on('ready', () => {
    client.log(`Logged in at ${client.user.tag}.`);
    client.user.setActivity('with my board games', { type: 'PLAYING' });
    client.guilds.forEach(guild => {
      assertGuildSettings(client, guild);
      guild.members.forEach(member => assertMember(client, member));
    });
  });
};

function assertMember(client, member) {
  client.mongodb.collection(member.guild.id).findOne({ _id: member.id }, (err, res) => {
    if (err) throw err;
    if (!res) addMember(client, member);
  });
}

function assertGuildSettings(client, guild) {
  client.mongodb.collection(guild.id).findOne({ _id: 0 }, (err, res) => {
    if (err) throw err;
    if (!res) client.mongodb.collection(guild.id).insertOne({
      _id: 0,
      prefix: process.env.DEFAULT_PREFIX || '.'
    });
  });
}

function addMember(client, member) {
  client.mongodb.collection(member.guild.id).insertOne({
    _id: member.id,
    games: [],
    score: 0
  });
}