const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { getAIResponse, getActiveProvider } = require('../src/services/aiService');
const { query, tenantStorage } = require('../src/config/database');

async function test() {
  console.log('=== Gemini AI Integration Test (with retry) ===\n');

  const active = getActiveProvider();
  console.log('Provider:', active.name);
  console.log('Model:', process.env.GEMINI_MODEL || 'default');
  console.log('');

  // Run within tenant context for DB logging
  const tenants = await query('SELECT tenant_id FROM shared.tenants LIMIT 1');
  const tenantId = tenants.rows[0].tenant_id;

  await tenantStorage.run(tenantId, async () => {
    const testQueries = [
      'How do I apply for leave?',
      'How to reset password?'
    ];

    for (const q of testQueries) {
      console.log(`Query: "${q}"`);
      let attempts = 0;
      const maxAttempts = 15;
      let success = false;

      while (attempts < maxAttempts && !success) {
        attempts++;
        try {
          const result = await getAIResponse(q, null, null);
          if (result.success) {
            console.log(`  ✅ Success (attempt ${attempts})`);
            console.log(`  Response: ${result.response.substring(0, 200)}`);
            success = true;
          } else if (result.retryable) {
            // Extract retry delay from error if available
            const retryMatch = result.error?.match(/(\d+)s/);
            const waitTime = retryMatch ? Math.min(parseInt(retryMatch[1]) + 2, 65) : 30;
            console.log(`  ⏳ Attempt ${attempts}/${maxAttempts}: rate limited, waiting ${waitTime}s...`);
            await new Promise(r => setTimeout(r, waitTime * 1000));
          } else {
            console.log(`  ❌ ${result.error}`);
            break;
          }
        } catch (e) {
          console.log(`  ❌ Error: ${e.message}`);
          attempts = maxAttempts;
        }
      }

      if (!success) {
        console.log('  ❌ All retries exhausted');
      }
      console.log('');
    }
  });

  console.log('=== Test Complete ===');
  process.exit(0);
}

test().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
