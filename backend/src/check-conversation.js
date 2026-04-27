const { query } = require('./config/database');

async function checkConversation() {
    try {
        const email1 = 'atul123@gmail.com';
        const email2 = 'shashanksinghal883@gmail.com';

        

        // 1. Find User 1
        const user1Result = await query("SELECT * FROM tenant_default.users WHERE email = $1", [email1]);
        const user1 = user1Result.rows[0];

        if (!user1) {
            
        } else {
            
        }

        // 2. Find User 2
        const user2Result = await query("SELECT * FROM tenant_default.users WHERE email = $1", [email2]);
        const user2 = user2Result.rows[0];

        if (!user2) {
            
        } else {
            
        }

        // 3. If both exist, check messages
        if (user1 && user2) {
            
            const messages = await query(`
            SELECT * FROM tenant_default.chat_messages 
            WHERE (sender_id = $1 AND receiver_id = $2) 
               OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY created_at ASC
        `, [user1.user_id, user2.user_id]);

            if (messages.rows.length === 0) {
                
            } else {
                
                messages.rows.forEach(m => console.log(m));
            }
        } else {
            
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkConversation();
