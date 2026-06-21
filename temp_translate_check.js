const https = require('https');
const querystring = require('querystring');

const tests = [
  { target: 'ta', text: 'YourTube is a modern video-sharing platform inspired by YouTube.' },
  { target: 'en', text: 'இந்த மென்பொருள் சரியானது.' },
  { target: 'en', text: 'यह एक परीक्षण शीर्षक है।' },
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

(async () => {
  for (const { target, text } of tests) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${querystring.escape(text)}`;
    console.log('TARGET', target);
    console.log('URL', url);
    try {
      const body = await fetch(url);
      const data = JSON.parse(body);
      console.log('TYPE', typeof data, Array.isArray(data) ? 'array' : 'other');
      console.log('LEN', Array.isArray(data) ? data.length : 'n/a');
      if (Array.isArray(data) && data[0]) {
        console.log('DATA0', data[0].slice(0, 2));
      } else {
        console.log('DATA0', data[0]);
      }
      console.log('DETECTED', Array.isArray(data) && data.length > 2 ? data[2] : null);
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((seg) => Array.isArray(seg) ? seg[0] : '').join('');
        console.log('TRANSLATED', translated);
      } else {
        console.log('UNEXPECTED', data);
      }
    } catch (e) {
      console.error('ERROR', e.message || e);
    }
    console.log('-----');
  }
})();
