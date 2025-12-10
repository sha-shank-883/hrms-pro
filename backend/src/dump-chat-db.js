const { query } = require('./config/database');

async function dumpChatDB() {
    try {
        console.log('Dumping chat_messages table...');

        const result = await query('SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 20');

        if (result.rows.length === 0) {
            console.log('No messages found in database.');
        } else {
            console.log(`Found ${result.rows.length} messages:`);
            result.rows.forEach(msg => {
                console.log(`[${msg.message_id}] ${msg.created_at} | ${msg.sender_id} -> ${msg.receiver_id}: ${msg.message} (Read: ${msg.is_read})`);
            });
        }

    } catch (error) {
        console.error('Database dump failed:', error);
    } finally {
        process.exit();
    }
}

dumpChatDB();
