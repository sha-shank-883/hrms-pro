const fs = require('fs');
const logPath = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\4aa601b6-4084-4220-b883-a304176071c7\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.error('Log file does not exist');
  process.exit(1);
}

const lines = fs.readFileSync(logPath, 'utf8').split('\n');
console.log(`Total lines: ${lines.length}`);

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('console') || line.includes('Console') || line.includes('crashed') || line.includes('boundary')) {
    console.log(`\nLine ${i+1}:`);
    console.log(line.slice(0, 500));
    // Let's print if it contains the console logs
    if (line.includes('consoleLog') || line.includes('logs') || line.includes('text')) {
      const start = Math.max(0, line.indexOf('crashed') - 200);
      const end = Math.min(line.length, line.indexOf('crashed') + 500);
      console.log('--- CRASH LOG SUBSTRING ---');
      console.log(line.slice(start, end));
    }
  }
}
