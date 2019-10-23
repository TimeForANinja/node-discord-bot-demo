const FS = require('fs');
const PATH = require('path');

const BLACKLIST = [];
// feel free to change this if you want
const CASE_SENSITIVE = false;

const loadText = () => {
  // read the context from 'blacklist.txt' file
  const filePath = PATH.resolve(__dirname, '../resources/blacklist.txt');
  // basic formatting
  const content = FS.readFileSync(filePath).toString().replace(/\r\n/, '\n').trim().split('\n');
  // for each line in that file
  for(const line of content) {
    // push it into our above defined array
    BLACKLIST.push(CASE_SENSITIVE ? line.trim() : line.trim().toLowerCase())
  }
}
loadText();

exports.run = async (msg) => {
  // this gets run on EVERY non-bot message
  const content = CASE_SENSITIVE ? msg.content : msg.content.toLowerCase();
  for(const blacklisted of BLACKLIST) {
    // for each item on our blacklist, we check whether our current message includes it
    if(content.includes(blacklisted)) {
      // might fail 'cause missing permissions
      msg.delete();
      msg.reply("behave yourself");
      return true;
    }
  }
  return false;
}
