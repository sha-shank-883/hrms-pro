const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { getAIResponse, getActiveProvider } = require('../src/services/aiService');

async function testGemini() {
  console.log('=== Gemini AI Integration Test ===\n');

  const active = getActiveProvider();
  if (!active) {
    console.log('❌ No AI provider configured');
    console.log('   Set GEMINI_API_KEY in .env');
    process.exit(1);
  }
  console.log('Active provider:', active.name);
  console.log('Model:', process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite');
  console.log('');

  const queries = [
    'How do I apply for leave in the HRMS system?',
    'What is the process for resetting my password?',
    'How can I download my payslip?'
  ];

  for (const query of queries) {
    console.log(`Query: "${query}"`);
    let retries = 3;
    let success = false;

    while (retries > 0 && !success) {
      try {
        const result = await getAIResponse(query, null, null);

        if (result.success) {
          console.log(`  ✅ Success (${result.provider})`);
          console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
          console.log(`  Response: ${result.response.substring(0, 200)}...`);
          success = true;
        } else if (result.retryable) {
          retries--;
          if (retries > 0) {
            const wait = 5000;
            console.log(`  ⏳ Rate limited, waiting ${wait/1000}s... (${retries} retries left)`);
            await new Promise(r => setTimeout(r, wait));
          } else {
            console.log(`  ❌ Failed after retries: ${result.error}`);
          }
        } else {
          console.log(`  ❌ ${result.error}`);
          retries = 0;
        }
      } catch (e) {
        console.log(`  ❌ Error: ${e.message}`);
        retries = 0;
      }
    }
    console.log('');
  }
}

testGemini().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
