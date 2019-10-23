const YTDL = require('ytdl-core');
const SONG_QUEUE = new Map();

exports.triggers = ['music'];
exports.caseSensitive = false;
exports.run = async (msg, args) => {
  // stop if not in a voice channel
  const voiceChannel = msg.member.voiceChannel;
  if (!voiceChannel) return msg.channel.send('you gotta be in a voice channel boy');
  // stop when permissions are missing
  const permissions = voiceChannel.permissionsFor(msg.client.user);
  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
      return msg.channel.send('I need the permissions to join and speak in your voice channel!');
  }
  // stop if main arg is not play & we're not playing music somewhere
  if((!args.startsWith('music play')) && !msg.guild.me.voiceChannel) {
    return msg.channel.send(`only \`${exports.usage.usage[0].replace('<prefix>', msg.client.prefix)}\` supported when not already playing music`);
  }
  // parse the songRef
  const songRef = args.substr(11);
  if(!songRef) return msg.channel.send(`Usage: \`${exports.usage.usage[0].replace('<prefix>', msg.client.prefix)}\``)
  // get the ytdl data
  YTDL.getInfo(songRef).then(songInfo => {
    if(!SONG_QUEUE.has(msg.guild.id)) {
      // cool function that let's you 'collect' the next messages in a channel
      // pretty much a dedicated hook to the client#message event
      const collector = msg.channel.createMessageCollector(a => true);
      collector.on('collect', onPlayingMsg);
      SONG_QUEUE.set(msg.guild.id, {
        id: msg.guild.id,
        songs: [],
        collector: collector,
        loop: false,
        volume: 5,
      });
      const q = SONG_QUEUE.get(msg.guild.id);
      q.songs.push({
        name: songInfo.title,
        ref: songInfo.video_url,
        requester: msg.member,
      });
      play(msg.guild, voiceChannel);
    } else {
      SONG_QUEUE.get(msg.guild.id).songs.push({
        name: songInfo.title,
        ref: songInfo.video_url,
        requester: msg.member,
      });
      msg.reply("👍 added to q");
    }
  }).catch(err => {
    // actually check whether ytdl finds that song
    return msg.channel.send(`Sorry, but i'm unable to fullfill that wish for ${songRef}`);
  });
}
exports.usage = {
  usage: [
    '<prefix>music play <youtube link>',
    'skip|stop|np|queue|loop|volume++|volume--|volume'
  ],
  short: 'Time to spice up that voice channel!!!',
};

const onPlayingMsg = (msg) => {
  const Q = SONG_QUEUE.get(msg.guild.id)
  switch (msg.content.toLowerCase()) {
    case 'skip': {
      Q.dispatcher.end();
      break;
    }
    case 'stop': {
      Q.songs = [];
      Q.dispatcher.end();
      break;
    }
    case 'np': {
      const song = Q.songs[0];
      return msg.reply(`Playing: \`${song.name}\` requested by ${song.requester}`);
    }
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
    case 'volume': {
      msg.reply(`currently playing at ${Q.volume}/80`);
      break;
    }
    case 'volume++': {
      // cap volume at 10;
      Q.volume = Math.min(Q.volume + 5, 80);
      Q.dispatcher.setVolumeDecibels(Q.volume / 5);
      break;
    }
    case 'volume--': {
      // cap volume at 1
      Q.volume = Math.max(Q.volume - 5, 5);
      Q.dispatcher.setVolumeDecibels(Q.volume / 5);
      break;
    }
  }
}

const play = (guild, voiceChannel) => {
  const Q = SONG_QUEUE.get(guild.id);
  if(Q.songs.length === 0) {
    voiceChannel.leave();
    Q.collector.stop();
    SONG_QUEUE.delete(guild.id);
    return;
  }
  if(voiceChannel.members.size === 0) {
    voiceChannel.leave();
    Q.collector.stop();
    SONG_QUEUE.delete(guild.id);
    return Q.collector.channel.send('And i thought you wanted me to play... Then freaking listen...');
  }
  voiceChannel.join().then(connection => {
    const dispatcher = connection.playStream(YTDL(Q.songs[0].ref, {filter: 'audioonly'}));
    dispatcher.on('end', () => {
      console.log('dispatcher end', Q);
      if(Q.loop && Q.songs.length) Q.songs.push(Q.songs.shift());
      else Q.songs.shift();
      play(guild, voiceChannel);
    });
    dispatcher.on('error', error => {
      // cleanup
      voiceChannel.leave();
      Q.collector.stop();
      SONG_QUEUE.delete(guild.id);
      return Q.collector.channel.send(`Uuups, something went wrong`);
    });
    dispatcher.setVolumeDecibels(Q.volume / 5);
    Q.dispatcher = dispatcher;
  });
}
