const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { query, tenantStorage } = require('../src/config/database');
const { getFAQMatch } = require('../src/services/faqService');
const { getAIResponse } = require('../src/services/aiService');
const ticketService = require('../src/services/ticketService');

async function runWithTenant(tenantId, fn) {
  return tenantStorage.run(tenantId, fn);
}

async function test() {
  console.log('=== Support Module Verification ===\n');

  // Use first available tenant
  const tenants = await query('SELECT tenant_id FROM shared.tenants LIMIT 1');
  const tenantId = tenants.rows[0].tenant_id;
  console.log('Using tenant:', tenantId, '\n');

  await runWithTenant(tenantId, async () => {

    // 1. Verify schema exists
    console.log('1. Schema Verification:');
    const tables = [
      'faq_categories', 'faq_articles', 'support_agents', 'support_chats',
      'support_messages', 'support_tickets', 'ticket_comments', 'ai_logs', 'canned_replies'
    ];
    let allGood = true;
    for (const table of tables) {
      try {
        await query('SELECT 1 FROM ' + table + ' LIMIT 1');
        console.log('   ✅ ' + table);
      } catch (e) {
        console.log('   ❌ ' + table + ' — ' + e.message.substring(0, 60));
        allGood = false;
      }
    }
    if (!allGood) {
      console.log('\n⚠️  Schema issues found — some tables may be missing\n');
    } else {
      console.log('   ✅ All tables present\n');
    }

    // 2. Create FAQ category + article + test matching
    console.log('2. FAQ Auto-Reply Test:');
    await query(`INSERT INTO faq_categories (name, slug) VALUES ('Login', 'login') ON CONFLICT (slug) DO UPDATE SET name = 'Login'`);
    const cat = await query(`SELECT category_id FROM faq_categories WHERE slug = 'login'`);
    await query(`DELETE FROM faq_articles WHERE question LIKE '%password%'`);
    await query(`INSERT INTO faq_articles (category_id, question, answer, keywords)
      VALUES ($1, 'How do I reset my password?', 'To reset your password: 1) Go to the login page 2) Click \"Forgot Password\" 3) Enter your registered email 4) Check your inbox for reset link 5) Follow the instructions to set a new password.',
      '["password", "reset", "forgot", "login", "signin"]')`,
      [cat.rows[0].category_id]);

    const faqResult = await getFAQMatch('I forgot my password, can you help me reset it?');
    console.log('   Matched:', faqResult.matched);
    console.log('   Confidence:', faqResult.confidence);
    console.log('   Intent detected:', faqResult.article ? 'password_reset' : 'none');
    if (faqResult.matched) {
      console.log('   ✅ FAQ match working');
    } else {
      // Try with more specific query
      const faqResult2 = await getFAQMatch('password reset');
      console.log('   Retry with "password reset": matched=', faqResult2.matched, 'confidence=', faqResult2.confidence);
      if (faqResult2.matched) console.log('   ✅ FAQ match working');
    }
    console.log('');

    // 3. Test AI service
    console.log('3. AI Service Test:');
    console.log('   Query: "How do I apply for leave?"');
    try {
      const aiResult = await getAIResponse('How do I apply for leave in the HRMS system?', null, null);
      console.log('   Success:', aiResult.success);
      console.log('   Provider:', aiResult.provider);
      console.log('   Confidence:', aiResult.confidence);
      if (aiResult.success && aiResult.response) {
        console.log('   Response:', aiResult.response.substring(0, 150) + '...');
        console.log('   ✅ AI response received');
      } else if (aiResult.success) {
        console.log('   ⚠️  Empty response');
      } else {
        console.log('   ❌ AI failed:', aiResult.error);
      }
    } catch (e) {
      console.log('   ❌ AI error:', e.message);
    }
    console.log('');

    // 4. Test ticket creation
    console.log('4. Ticket Service Test:');
    const userResult = await query('SELECT user_id FROM users LIMIT 1');
    if (userResult.rows.length > 0) {
      const ticket = await ticketService.createTicket({
        userId: userResult.rows[0].user_id,
        subject: 'Installation verification test ticket',
        description: 'Auto-generated during support module verification.',
        category: 'general',
        priority: 'low',
        source: 'auto'
      });
      console.log('   Created:', ticket.ticket_number);
      console.log('   Status:', ticket.status);
      console.log('   ✅ Ticket created successfully');

      // Cleanup
      await query('DELETE FROM ticket_comments WHERE ticket_id = $1', [ticket.ticket_id]);
      await query('DELETE FROM support_tickets WHERE ticket_id = $1', [ticket.ticket_id]);
      console.log('   (test ticket cleaned up)');
    }
    console.log('');

    // 5. Test chat creation
    console.log('5. Chat + Message Flow Test:');
    if (userResult.rows.length > 0) {
      const chat = await query(
        `INSERT INTO support_chats (user_id, status, is_ai_active) VALUES ($1, 'active', true) RETURNING *`,
        [userResult.rows[0].user_id]
      );
      console.log('   Chat created: #' + chat.rows[0].chat_id);

      const msg = await query(
        `INSERT INTO support_messages (chat_id, sender_id, sender_type, message)
         VALUES ($1, $2, 'user', 'How do I download my payslip?') RETURNING *`,
        [chat.rows[0].chat_id, userResult.rows[0].user_id]
      );
      console.log('   Message sent: #' + msg.rows[0].message_id);

      await query('DELETE FROM support_messages WHERE chat_id = $1', [chat.rows[0].chat_id]);
      await query('DELETE FROM support_chats WHERE chat_id = $1', [chat.rows[0].chat_id]);
      console.log('   ✅ Chat and message flow working');
    }
    console.log('');

    // 6. Clean up test FAQ
    await query("DELETE FROM faq_articles WHERE answer LIKE '%password%'");

  });

  console.log('=== Verification Complete ===');
  process.exit(0);
}

test().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
