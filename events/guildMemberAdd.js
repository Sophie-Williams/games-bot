module.exports = (client, member) => {
  client.debug(`User ${member.user.username} added to guild ${member.guild.name}`);
  client.mongodb.collection(member.guild.id).insertOne({
    _id: member.id,
    member: true,
    score: 0
  });
};
