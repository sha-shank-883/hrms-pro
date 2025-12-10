const { query } = require('./config/database');

async function checkConversation() {
    try {
        const email1 = 'atul123@gmail.com';
        const email2 = 'shashanksinghal883@gmail.com';

        console.log(`Checking tenant_default for:\n1. ${email1}\n2. ${email2}`);

        // 1. Find User 1
        const user1Result = await query("SELECT * FROM tenant_default.users WHERE email = $1", [email1]);
        const user1 = user1Result.rows[0];

        if (!user1) {
            console.log(`\n❌ User ${email1} NOT found in tenant_default.`);
        } else {
            console.log(`\n✅ Found ${email1} in tenant_default: ID ${user1.user_id}`);
        }

        // 2. Find User 2
        const user2Result = await query("SELECT * FROM tenant_default.users WHERE email = $1", [email2]);
        const user2 = user2Result.rows[0];

        if (!user2) {
            console.log(`\n❌ User ${email2} NOT found in tenant_default.`);
        } else {
            console.log(`\n✅ Found ${email2} in tenant_default: ID ${user2.user_id}`);
        }

        // 3. If both exist, check messages
        if (user1 && user2) {
            console.log(`\nChecking messages in tenant_default.chat_messages between ID ${user1.user_id} and ${user2.user_id}...`);
            const messages = await query(`
            SELECT * FROM tenant_default.chat_messages 
            WHERE (sender_id = $1 AND receiver_id = $2) 
               OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY created_at ASC
        `, [user1.user_id, user2.user_id]);

            if (messages.rows.length === 0) {
                console.log('No messages found between these users in tenant_default.');
            } else {
                console.log(`Found ${messages.rows.length} messages:`);
                messages.rows.forEach(m => console.log(`[${m.created_at}] ${m.sender_id} -> ${m.receiver_id}: ${m.message}`));
            }
        } else {
            console.log('\nCannot check messages because one or both users are missing from tenant_default.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkConversation();
