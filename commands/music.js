const YTDL = require('ytdl-core');
const SONG_QUEUE = new Map();

exports.triggers = ['music'];
exports.caseSensitive = false;
exports.run = async (msg, args) => {
  // stop if not in a voice channel
  const voiceChannel = msg.member.voice.channel;
  if (!voiceChannel) return msg.channel.send('you gotta be in a voice channel boy');
  // stop when permissions are missing
  const permissions = voiceChannel.permissionsFor(msg.client.user);
  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
      return msg.channel.send('I need the permissions to join and speak in your voice channel!');
  }
  // stop if main arg is not play & we're not playing music somewhere
  if((!args.startsWith('music play')) && !msg.guild.me.voice.channel) {
    return msg.channel.send(`only \`${exports.usage.usage[0].replace('<prefix>', msg.client.prefix)}\` supported when not already playing music`);
  }
  // parse the songRef
  const songRef = args.substr(11);
  if(!songRef) return msg.channel.send(`Usage: \`${exports.usage.usage[0].replace('<prefix>', msg.client.prefix)}\``)
  // get the ytdl data
  await YTDL.getInfo(songRef).then(songInfo => {
    const vid = {
      name: songInfo.videoDetails.title,
      ref: songInfo.videoDetails.videoId,
      requester: msg.member,
    };
    if(!SONG_QUEUE.has(msg.guild.id)) {
      // cool function that let's you 'collect' the next message(s) in a channel
      // pretty much a dedicated hook to the client#message event
      const collector = msg.channel.createMessageCollector(a => true);
      collector.on('collect', onPlayingMsg);
      SONG_QUEUE.set(msg.guild.id, {
        id: msg.guild.id,
        songs: [],
        collector: collector,
        loop: false,
        replay: false,
        volume: 5,
      });
      const q = SONG_QUEUE.get(msg.guild.id);
      q.songs.push(vid);
      msg.channel.send(`:+1: that looks good\nyou can now use\n${exports.usage.usage[1]}\nin this channel`);
      play(msg.guild, voiceChannel);
    } else {
      SONG_QUEUE.get(msg.guild.id).songs.push(vid);
      msg.reply(`👍 added "${vid.name}" to q`);
    }
  }).catch(err => {
    // actually check whether ytdl finds that song
    return msg.channel.send(`Sorry, but i'm unable to fullfill that wish for ${songRef}`);
  });
}
exports.usage = {
  usage: [
    '<prefix>music play <youtube link>',
    'skip|stop|np|queue|loop|volume++|volume--|volume|replay'
  ],
  short: 'Time to spice up that voice channel!!!',
};

// callback for the collector listening to modification commands
const onPlayingMsg = (msg) => {
  const Q = SONG_QUEUE.get(msg.guild.id)
  // check for the content of the msg...
  switch (msg.content.toLowerCase()) {
    case 'skip': {
      // finish the song and fire the dispatcher.on('close') event
      Q.dispatcher.end();
      break;
    }
    case 'stop': {
      // clear the playlist
      Q.songs = [];
      // finish the song and fire the dispatcher.on('close') event
      Q.dispatcher.end();
      break;
    }
    case 'now playing':
    case 'np': {
      const song = Q.songs[0];
      return msg.reply(`Playing: \`${song.name}\` requested by ${song.requester}`);
    }
    case 'q':
    case 'queue': {
      let respStr = `currently:\n\t\`${Q.songs[0].name}\` requested by ${Q.songs.requester}\n`;
      respStr += 'next up:\n';
      // loop over max 10 songs
      for(let i = 0 ; i < Math.min(Q.songs.length, 10); i++) {
        const song = Q.songs[i];
        respStr += `\t${i+1}: \`${song.name}\` requested by ${song.requester}\n`;
      }
      return msg.channel.send(respStr);
    }
    case 'loop': {
      // flip value
      Q.loop = !Q.loop;
      // that "bool ? first : second" is an inline if statement
      msg.reply(`looping now ${Q.loop ? 'enabled' : 'disabled'}`);
      break;
    }
    case 'replay': {
	    Q.replay = Q.replay;
      msg.reply(`replay now ${Q.replay ? 'enabled' : 'disabled'}`);
      break;
    }
    case 'volume': {
      msg.reply(`currently playing at ${Q.volume}/80`);
      break;
    }
    case '++volume':
    case 'volume++': {
      // cap volume at 10;
      Q.volume = Math.min(Q.volume + 5, 80);
      Q.dispatcher.setVolumeDecibels(Q.volume / 5);
      break;
    }
    case '--volume':
    case 'volume--': {
      // cap volume at 1
      Q.volume = Math.max(Q.volume - 5, 5);
      Q.dispatcher.setVolumeDecibels(Q.volume / 5);
      break;
    }
  }
}

// function handling play
// call's itself recursively
const play = async (guild, voiceChannel) => {
  const Q = SONG_QUEUE.get(guild.id);
  // no more songs to play
  if(Q.songs.length === 0) {
    return cleanupAfterPlay(voiceChannel);
  }
  // no more users listening
  if(voiceChannel.members.size === 0) {
    return cleanupAfterPlay(voiceChannel, 'And i thought you wanted me to play... Then freaking listen...');
  }
  // Joining the channel again does no harm
  // discord.js just returns the connection if one already exists
  Q.collector.channel.send(`starting to play "${Q.songs[0].name}"`)
  const connection = await voiceChannel.join();
  const stream = YTDL(Q.songs[0].ref, {filter: 'audioonly'});
  const dispatcher = connection.play(stream);
  // dispatcher.on('close', () => {
  dispatcher.on('finish', () => {
    // just restart with the same song at the beginning
    if(Q.replay) return play(guild, voiceChannel);
    // push the first song to the end
    if(Q.loop && Q.songs.length) Q.songs.push(Q.songs.shift());
    else Q.songs.shift(); // remove the first song
    play(guild, voiceChannel);
  });
  dispatcher.on('error', error => {
    cleanupAfterPlay(voiceChannel, `Uuups, something went wrong\n${error.message}\n${error.stack}`);
  });
  dispatcher.setVolumeDecibels(Q.volume / 5);
  Q.dispatcher = dispatcher;
}

// helper-function to do cleanup when playback is stopped
const cleanupAfterPlay = (voiceChannel, txt) => {
  voiceChannel.leave();
  const Q = SONG_QUEUE.get(voiceChannel.guild.id);
  Q.collector.stop();
  SONG_QUEUE.delete(voiceChannel.guild.id);
  if (txt) Q.collector.channel.send(txt)
  return;
}
