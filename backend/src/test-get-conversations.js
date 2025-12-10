const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function testGetConversations() {
    const client = await pool.connect();
    try {
        // Set search path to tenant_default
        await client.query('SET search_path TO tenant_default');

        const userId = 4; // Shashank's ID
        console.log(`Getting conversations for user: ${userId}`);

        const queryText = `
      SELECT DISTINCT ON (other_user_id) 
              other_user_id,
              other_user_email,
              last_message,
              last_message_time,
              unread_count
       FROM (
         SELECT 
           CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_user_id,
           CASE WHEN sender_id = $1 THEN ur.email ELSE us.email END as other_user_email,
           cm.message as last_message,
           cm.created_at as last_message_time,
           COUNT(CASE WHEN receiver_id = $1 AND is_read = false THEN 1 END) OVER (PARTITION BY 
             CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END) as unread_count
         FROM chat_messages cm
         JOIN users us ON cm.sender_id = us.user_id
         JOIN users ur ON cm.receiver_id = ur.user_id
         WHERE sender_id = $1 OR receiver_id = $1
         ORDER BY cm.created_at DESC
       ) conversations
       ORDER BY other_user_id, last_message_time DESC
    `;

        const result = await client.query(queryText, [userId]);
        console.log('Conversations found:', result.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

testGetConversations();
