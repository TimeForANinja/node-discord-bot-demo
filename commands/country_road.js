exports.triggers = ['countryroads'];
exports.caseSensitive = false;
exports.run = async (msg, args) => {
  // like you can see, there's an option to break up large strings
  // they automaticly continue in the next line after a \
  msg.channel.send('initiating country roads...\n\
country roads intitiated\n\
you know the lyrics?\n\
sing with me...\n\
Almost heaven....🎵🎵');
}
exports.usage = {
  usage: '<prefix>countryroads',
  short: 'So you wanna hear a story?',
};
