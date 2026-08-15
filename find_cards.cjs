const fs = require('fs');

const data = JSON.parse(fs.readFileSync('D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/DISNEY_LORCANA_PLAYLAB_CLOUD/public/dataset/lorcana_set1_set2.json', 'utf8'));

console.log("Ruby/Amethyst Control targets:");
const rubyAmethystTargets = ["Be Prepared", "Dragon Fire", "Elsa - Spirit of Winter", "Elsa - Queen Regent", "Maleficent - Biding Her Time", "The Wardrobe", "Tinker Bell"]; // Need to find Elsa, Wardrobe, Tinker Bell
console.log(data.filter(c => c.name.includes('Elsa') || c.name.includes('Wardrobe') || c.name.includes('Tinker Bell') || rubyAmethystTargets.includes(c.name)).map(c => c.id + ": " + c.name + " (" + c.color + " " + c.cost + ")").join('\n'));

console.log("\nAmber/Steel Aggro Songs targets:");
console.log(data.filter(c => c.name.includes('Ariel') || c.name.includes('Cinderella') || c.name.includes('Goofy') || c.name.includes('Mickey Mouse') || c.name.includes('Rapunzel') || c.name.includes('Simba') || c.name.includes('Stitch')).map(c => c.id + ": " + c.name + " (" + c.color + " " + c.cost + ")").join('\n'));

console.log("\nSapphire/Steel targets:");
console.log(data.filter(c => c.name.includes('Pawpsicle') || c.name.includes('Maurice') || c.name.includes('Mufasa')).map(c => c.id + ": " + c.name + " (" + c.color + " " + c.cost + ")").join('\n'));
