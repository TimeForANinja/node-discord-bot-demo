exports.triggers = ['help'];
exports.caseSensitive = false;
exports.run = async (msg, args) => {
  // simple way to build strings:
  let str = '';
  // a \ is used to escape special characters, like "
  // i'm using a so called template string,
  // instead of doing
  // "hey" + var + "boy"
  // you can do
  // `hey${var}boy`
  str += `Usage: \`${exports.usage.usage.replace('<prefix>', msg.client.prefix)}\`\n`;
  // another good to know are control characters:
  // \n is a linebreak
  // \t is a tab
  str += 'other modules:\n';
  for(const [,cmd] of msg.client.commands) {
    // here we add to lines for each cmd
    // the first is the usage, programatically replacing the prefix
    let usage;
    if(Array.isArray(cmd.usage.usage)) usage = cmd.usage.usage
      .map(a => a.replace('<prefix>', msg.client.prefix))
      .join('\`\n\t\`');
    else usage = cmd.usage.usage.replace('<prefix>', msg.client.prefix);
    str += `\t\`${usage}\`\n`;
    // the second is the usage
    str += `\t\t=>${cmd.usage.short}\n`;
  }
  // trim just removes unneeded whitespaces at the front and end
  // with building the string using \n
  // we now managed to only need a single msg.channel.send
  // which is IMPORTANT to keep inside discords rate limits
  msg.channel.send(str.trim());
}
exports.usage = {
  usage: '<prefix>help',
  short: 'shows help for a command',
};
