const FS = require('fs');
const PATH = require('path');

const TEXTS = new Map();
// feel free to change this if you want
const CASE_SENSITIVE = false;

const loadText = () => {
  const filePath = PATH.resolve(__dirname, '../resources/call_response.txt');
  const content = FS.readFileSync(filePath).toString().replace(/\r\n/, '\n').trim().split('\n');
  for(const line of content) {
    const parts = line.trim().split('|');
    // that JSON.parse is a little trick to parse \n linebreaks
    TEXTS.set(
      CASE_SENSITIVE ? parts[0] : parts[0].toLowerCase(),
      JSON.parse(`"${parts[1]}"`)
    );
  }
}
loadText();

exports.run = async (msg) => {
  const content = CASE_SENSITIVE ? msg.content : msg.content.toLowerCase();
  // key val is needed, since we're using a map to store texts
  for(const [key, val] of TEXTS) {
    // key is the trigger, val the response (that's how we saved them above)
    if(content.startsWith(key)) {
      // so if the message starts with the key, just send val
      msg.channel.send(val);
      return true;
    }
  }
  return false;
}
