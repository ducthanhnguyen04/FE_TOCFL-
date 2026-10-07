const https = require('https');
https.get('https://nhaihsk.com/vocab/hsk1/lesson-1', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const regex = /https?:\/\/[a-zA-Z0-9.-]+\/[^\"\'\`\s]*/gi;
    const matches = data.match(regex) || [];
    const keywords = ['audio', 'tts', 'voice', 'sound', 'translate', 'dict', 'fanyi', 'speech'];
    const filtered = matches.filter(url => keywords.some(kw => url.toLowerCase().includes(kw)));
    console.log(Array.from(new Set(filtered)));
  });
});
