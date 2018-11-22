module.exports = (client, member) => {
  client.mongodb.collection(member.guild.id).insertOne({
    _id: member.id,
    games: [],
    score: 0
  });
};
