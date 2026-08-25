const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REGION = 'us-east-1';
const BACKEND_DIR = path.resolve(__dirname, '../backend');
const BUNDLE_DIR = path.join(BACKEND_DIR, 'dist_bundle');

if (!fs.existsSync(BUNDLE_DIR)) {
  fs.mkdirSync(BUNDLE_DIR, { recursive: true });
}

const functions = [
  { name: 'lorcana-auth-login', src: 'auth/login.ts', out: 'auth/login.js', zip: 'auth-login.zip' },
  { name: 'lorcana-auth-register', src: 'auth/register.ts', out: 'auth/register.js', zip: 'auth-register.zip' },
  { name: 'lorcana-deck', src: 'deck/handler.ts', out: 'deck/handler.js', zip: 'deck.zip' },
  { name: 'lorcana-room', src: 'room/handler.ts', out: 'room/handler.js', zip: 'room.zip' },
  { name: 'lorcana-analyzer', src: 'analyzer/handler.ts', out: 'analyzer/handler.js', zip: 'analyzer.zip' }
];

console.log('⚡ Bundling & Deploying Lambdas via esbuild...');

for (const fn of functions) {
  const targetDir = path.join(BUNDLE_DIR, fn.name);
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });

  const entryPath = path.join(BACKEND_DIR, fn.src);
  const outPath = path.join(targetDir, fn.out);
  const zipPath = path.join(BACKEND_DIR, fn.zip);

  console.log('  Bundling ' + fn.name + '...');
  execSync('npx esbuild ' + entryPath + ' --bundle --platform=node --target=node20 --outfile=' + outPath, { stdio: 'inherit' });

  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  console.log('  Zipping ' + fn.name + '...');
  execSync('powershell -Command "Compress-Archive -Path \'' + targetDir + '/*\' -DestinationPath \'' + zipPath + '\' -Force"', { stdio: 'inherit' });

  console.log('  Uploading Lambda ' + fn.name + ' to AWS (' + REGION + ')...');
  const zipUri = 'fileb://' + zipPath.replace(/\\/g, '/');
  const out = execSync('aws lambda update-function-code --function-name ' + fn.name + ' --zip-file ' + zipUri + ' --region ' + REGION, { encoding: 'utf-8' });
  const parsed = JSON.parse(out);
  console.log('  ✅ ' + fn.name + ' updated: ' + parsed.LastModified);
}

console.log('\n🎉 All 5 Lambdas deployed and updated with TTL on AWS successfully!');
