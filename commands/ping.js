// export means when you `require('/path/to/ping.js')` from somewhere else
// the exportet parts will bevome available
// means i can do `require('/path/to/ping.js').triggers` to get the triggers array
exports.triggers = ['ping'];
exports.caseSensitive = false;
// this way we can bring modularity into the bot,
// placing functions like the "run" func of a bot inside it's own file
exports.run = async (msg, args) => {
  msg.channel.send(`pong`);
}

exports.usage = {
  usage: '<prefix>ping',
  short: 'everyone\'s favorite',
};
