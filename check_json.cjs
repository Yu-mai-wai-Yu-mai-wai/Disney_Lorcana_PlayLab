const fs = require('fs');

const data = JSON.parse(fs.readFileSync('public/dataset/lorcana_set1_set2.json', 'utf8'));

// find some cards by ink
const ruby = data.filter(c => c.ink_indicator === 'Ruby' || c.color === 'Ruby' || c.color === 'ruby' || (c.inkColors && c.inkColors.includes('Ruby')));
console.log("Ruby cards:", ruby.slice(0,5).map(c=>c.id));
