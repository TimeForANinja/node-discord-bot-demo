const { MessageEmbed } = require('discord.js');

exports.triggers = ['server'];
exports.caseSensitive = false;
exports.run = async (msg, args) => {
  // wanna show you how to use embeds:
  const embed = new MessageEmbed();
  // you can just add field by field
  // check discord.js's documentation for all the cool thinks you can do
  embed.setTitle(`Stats for ${msg.guild.name}`);
  embed.setColor(0xFF0000);
  embed.setDescription(`Members: ${msg.guild.memberCount}`)
  embed.setImage(msg.guild.iconURL);
  msg.channel.send(embed);
}
exports.usage = {
  usage: '<prefix>server',
  short: 'Print general server info.',
};
