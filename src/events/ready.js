module.exports = client => {
  client.info(`Logged in at ${client.user.tag}.`);
  client.user.setActivity('with my board games', { type: 'PLAYING' });
  client.guilds.forEach(guild => {
    client.debug(`Asserting guild ${guild.name} settings`);
    assertGuildSettings(client, guild);
    client.debug(`Asserting ${guild.members.size} members`);
    guild.members.forEach(member => assertMember(client, member));
  });
};

/**
 * 
 * @param {Client} client - the logged in client
 * @param {GuildMember} member - the guild member being asserted
 */
function assertMember(client, member) {
  client.debug(`Asserting member ${member.user.username}`);
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
    member: true,
    score: 0
  });
}
