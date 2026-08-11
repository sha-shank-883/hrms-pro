const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite',
    systemInstruction: 'You are an HRMS support assistant. Answer concisely.'
  });

  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      console.log('Attempt', attempt, '...');
      const result = await model.generateContent('How do I apply for leave in the HRMS system?');
      const text = result.response.text();
      console.log('SUCCESS on attempt', attempt);
      console.log('Response:', text.substring(0, 300));
      process.exit(0);
    } catch (e) {
      const msg = e.message || '';
      // Extract wait time from error
      let wait = 30;
      const waitMatch = msg.match(/retry in (\d+)/i) || msg.match(/retryDelay\":\"?(\d+)/);
      if (waitMatch) {
        wait = Math.min(parseInt(waitMatch[1]) + 2, 65);
      }
      console.log('Attempt', attempt, 'failed:', msg.substring(0, 100));
      console.log('Waiting', wait, 'seconds...');
      await new Promise(r => setTimeout(r, wait * 1000));
    }
  }
  console.log('All attempts exhausted');
  process.exit(1);
}

test().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
