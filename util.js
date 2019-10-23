const FS = require('fs');
const PATH = require('path');
const DISCORD = require('discord.js');

// requireDir takes a path (and some arg's to pass through)
// it reads that directory, and searches for js files
// if it finds a js file, it requires it and adds it to the map
const requireDir = (path, uncache, arg) => {
  const map = new Map();
  const files = FS.readdirSync(path);
  for(const file of files) {
    const filePath = PATH.resolve(path, file);
    const stat = FS.statSync(filePath);
    if(!stat.isFile()) continue;
    if(PATH.extname(filePath).toLowerCase() !== '.js') continue;
    // this removes a required module, so that we can reload later on
    if(uncache) delete require.cache[require.resolve(filePath)];
    // might wanna wrap the require into a try/catch
    const cmd = require(filePath);
    if(cmd.hasOwnProperty('init')) cmd.init(arg)
    map.set(filePath, cmd);
  }
  return map;
}

// this is where we load the LoadInterceptors
// we save the method on the client so that we can use it in ./commands/reload
DISCORD.Client.prototype.interceptors = null;
DISCORD.Client.prototype.LoadInterceptors = function(path) {
  // the second argument is true, when interceptors are already defined
  this.interceptors = requireDir(path, !!this.interceptors, this);
}


// this is where we load the commands
// we save the method on the client so that we can use it in ./commands/reload
DISCORD.Client.prototype.commands = null;
DISCORD.Client.prototype.LoadCommands = function(path) {
  this.commands = requireDir(path, !!this.commands, this);
}
