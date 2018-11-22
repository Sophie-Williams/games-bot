module.exports = (client, member) => {
  client.mongodb.collection(member.guild.id).deleteOne({ _id: member.id });
};
