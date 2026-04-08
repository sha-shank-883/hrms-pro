const { query } = require('./config/database');

async function dumpChatDB() {
    try {
        

        const result = await query('SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 20');

        if (result.rows.length === 0) {
            
        } else {
            
            result.rows.forEach(msg => {
                
            });
        }

    } catch (error) {
        console.error('Database dump failed:', error);
    } finally {
        process.exit();
    }
}

dumpChatDB();
