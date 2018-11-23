module.exports = (client, member) => {
  client.debug(`User ${member.user.username} removed from guild ${member.guild.name}`);
  client.mongodb.collection(member.guild.id).deleteOne({ _id: member.id });
};
