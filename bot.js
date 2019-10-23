// good practise to define global vars in caps
const PATH = require('path');
const DISCORD = require('discord.js');
// don't need anything out of it, only need to require it
require('./util.js');

const {
    prefix,
    token,
} = require('./config.json');

const client = new DISCORD.Client();
// we can already login since it's a asynchronous web request
client.login(token);
client.prefix = prefix;

// load Commands & Interceptors
const CMD_DIR = './commands/';
client.CMD_DIR = PATH.resolve(__dirname, CMD_DIR);
client.LoadCommands(client.CMD_DIR);
const INTERCEPT_DIR = './interceptors';
client.INTERCEPT_DIR = PATH.resolve(__dirname, INTERCEPT_DIR);
client.LoadInterceptors(client.INTERCEPT_DIR);
console.log(`loaded ${client.commands.size} commands and ${client.interceptors.size} interceptors`)

client.once('ready', () => {
  console.log('Client ready!');
});

client.on('error', err => {
  console.error(err);
})

// don't use once here, since reconnecting may happen multiple times
client.on('reconnecting', () => {
    console.log('Client reconnecting!');
});

// don't use once here since it uses more storage
client.on('disconnect', () => {
    console.log('Client disconnected!');
    // exit the process since there's nothing more we can do
    process.exit();
});

client.on('message', async (msg) => {
  // always return when it's a bot or self
  if (msg.author.bot) return;
  if (msg.author.equals(client.user)) return;
  // dm's would currently crash the bot
  if (!msg.guild) return;

  // interceptors are messages like call-response and blacklist
  // interceptors return a bool whether the message was intercepted
  // if one of these does return true we stop handling this as a command
  // that's why we run those before the regular commands
  // Promise.all is used to execute all interceptors in parallel
  if(client.interceptors) {
    const q = [];
    for(const [, interceptor] of client.interceptors) q.push(interceptor.run(msg))
    const results = await Promise.all(q);
    if (results.some(a => a)) return;
  }

  // if client.LoadCommands wasn't called this will be null...
  if(!client.commands) return;

  if (!msg.content.startsWith(prefix)) return;
  const rawArgString = msg.content.substr(prefix.length);

  for(const [, cmd] of client.commands) {
    const argString = cmd.caseSensitive ? rawArgString : rawArgString.toLowerCase();
    const args = argString.split(' ');
    // commands can be 3 types: function, regex or array
    if(typeof cmd.triggers === 'function') {
      if ( !cmd.triggers(argString, args) ) continue;
    } else if(cmd.triggers instanceof RegExp) {
      if ( !cmd.triggers.test(argString) ) continue;
    } else {
      if ( !cmd.triggers.includes(args[0]) ) continue;
    }
    // if we reach this point and none of the continue statements was executed
    // we found our command
    return cmd.run(msg, rawArgString);
  }
  msg.channel.send(`Are you talking to me? 🤔\nIf so look up the commands scrup: ${prefix}help`)
});
