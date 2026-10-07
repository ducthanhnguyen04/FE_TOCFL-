const https = require('https');
https.get('https://nhaihsk.com/vocab/hsk1/lesson-1', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const regex = /\/_next\/static\/chunks\/[a-zA-Z0-9-]+\.js/g;
    const matches = data.match(regex) || [];
    const unique = Array.from(new Set(matches));
    
    unique.forEach(url => {
        https.get('https://nhaihsk.com' + url, (jsRes) => {
            let jsData = '';
            jsRes.on('data', chunk => jsData += chunk);
            jsRes.on('end', () => {
                const apiRegex = /https?:\/\/[a-zA-Z0-9.-]+\/[^\"\'\`\s]*/gi;
                const m = jsData.match(apiRegex) || [];
                const kws = ['audio', 'tts', 'voice', 'sound', 'translate', 'dict', 'fanyi', 'speech'];
                const f = m.filter(u => kws.some(kw => u.toLowerCase().includes(kw)));
                if(f.length > 0) {
                    console.log('Found in', url, ':', Array.from(new Set(f)));
                }
            });
        });
    });
  });
});
