const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { getAIResponse } = require('../src/services/aiService');
const { getFAQMatch } = require('../src/services/faqService');
const { query } = require('../src/config/database');

async function test() {
  console.log('=== Testing Support Module ===\n');

  // 1. Test FAQ matching
  console.log('1. Testing FAQ matching...');
  // First insert a test FAQ
  try {
    const existing = await query('SELECT article_id FROM faq_articles LIMIT 1');
    if (existing.rows.length === 0) {
      // Create a test category and FAQ
      await query(`INSERT INTO faq_categories (name, slug) VALUES ('Login', 'login') ON CONFLICT (slug) DO NOTHING`);
      const cat = await query(`SELECT category_id FROM faq_categories WHERE slug = 'login'`);
      await query(`INSERT INTO faq_articles (category_id, question, answer, keywords)
        VALUES ($1, 'How do I reset my password?', 'To reset your password, go to login page and click Forgot Password. Enter your email and follow the instructions sent to your inbox.',
        '["password", "reset", "forgot", "login"]')`, [cat.rows[0].category_id]);
    }
    const faqResult = await getFAQMatch('I forgot my password, how can I reset it?');
    console.log('   Matched:', faqResult.matched);
    console.log('   Confidence:', faqResult.confidence);
    if (faqResult.matched) console.log('   Answer:', faqResult.article.answer.substring(0, 80) + '...');
    console.log('   ✅ FAQ Service OK\n');
  } catch (e) {
    console.error('   ❌ FAQ Service Error:', e.message, '\n');
  }

  // 2. Test AI service
  console.log('2. Testing AI service with OpenRouter...');
  try {
    const aiResult = await getAIResponse('How do I apply for leave in the HRMS system?', null, null);
    console.log('   Success:', aiResult.success);
    console.log('   Provider:', aiResult.provider);
    console.log('   Confidence:', aiResult.confidence);
    console.log('   Response:', aiResult.response ? aiResult.response.substring(0, 120) + '...' : 'NO RESPONSE');
    if (aiResult.success && aiResult.response) {
      console.log('   ✅ AI Service OK\n');
    } else {
      console.log('   ⚠️  AI returned but no response text\n');
    }
  } catch (e) {
    console.error('   ❌ AI Service Error:', e.message);
    const details = e.cause || '';
    console.error('   Details:', details, '\n');
  }

  // 3. Test ticket creation
  console.log('3. Testing ticket service...');
  try {
    const ticketService = require('../src/services/ticketService');
    const userResult = await query('SELECT user_id FROM users LIMIT 1');
    if (userResult.rows.length > 0) {
      const ticket = await ticketService.createTicket({
        userId: userResult.rows[0].user_id,
        subject: 'Test support ticket',
        description: 'This is a test ticket created during installation verification.',
        category: 'general',
        priority: 'low',
        source: 'auto'
      });
      console.log('   Ticket created:', ticket.ticket_number);
      console.log('   ✅ Ticket Service OK\n');

      // Clean up test ticket
      await query('DELETE FROM support_tickets WHERE ticket_id = $1', [ticket.ticket_id]);
    }
  } catch (e) {
    console.error('   ❌ Ticket Service Error:', e.message, '\n');
  }

  // 4. Check schema is complete
  console.log('4. Verifying schema...');
  const tables = [
    'faq_categories', 'faq_articles', 'support_agents', 'support_chats',
    'support_messages', 'support_tickets', 'ticket_comments', 'ai_logs', 'canned_replies'
  ];
  for (const table of tables) {
    try {
      await query('SELECT 1 FROM ' + table + ' LIMIT 1');
      console.log('   ✅ ' + table);
    } catch (e) {
      console.log('   ❌ ' + table + ' - ' + e.message);
    }
  }

  console.log('\n=== Test Complete ===');
  process.exit(0);
}

test().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
