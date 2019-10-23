const PATH = require('path');

exports.triggers = ['reload'];
exports.caseSensitive = false;
exports.run = async (msg, args) => {
  // let's do a simple permission check:
  if(!msg.member.hasPermission('KICK_MEMBERS')) {
    return msg.reply('missing kick members permission');
  }
  // makes no sense thou, to link "reload" to a guild permission
  // just so that you know how one would fetch guild permissions


  // not a lot to say
  // reloading commands and interceptors
  // most of this should be explained somewhere else
  msg.client.LoadInterceptors(msg.client.INTERCEPT_DIR);
  msg.client.LoadCommands(msg.client.CMD_DIR);
  // watch out, msg.client.commands is a Map and therefor it's not length but size
  msg.channel.send(`loaded ${msg.client.commands.size} commands and ${msg.client.interceptors.size} interceptors`)
}
exports.usage = {
  usage: '<prefix>reload',
  short: 'Reload all commands.',
};
