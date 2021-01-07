const PATH = require('path');

const SCREAM_FILE = '../resources/scream.mp3';

exports.triggers = ['scream'];
exports.caseSensitive = false;
exports.run = async (msg, args) => {
  msg.channel.send('AAAAAAAAAAA');
  // can't do this when we're playing sth somewhere else
  if(msg.guild.voiceConnection) return;
  // can't do this when the author is not in a voiceChannel
  if(!msg.member.voice.channel) return;

  // might still fail 'cause missing permissions
  msg.member.voice.channel.join().then(connection => {
    connection.play(PATH.resolve(__dirname, SCREAM_FILE));
  });
}
exports.usage = {
  usage: '<prefix>scream',
  short: 'Guess what this does🤓',
};
