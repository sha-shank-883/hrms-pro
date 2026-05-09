---
wave: 1
depends_on: []
files_modified: ["backend/src/scripts/add_chat_channels_tables.js", "backend/package.json"]
autonomous: true
requirements: ["REQ-01", "REQ-02"]
---

# Plan 1: Database Schema for Group Chats & Channels

## Objective
Create the PostgreSQL tables needed for group messaging and channels, and update `chat_messages` to support them.

## Tasks

<task>
<read_first>
- backend/package.json
- backend/src/controllers/chatController.js
</read_first>
<action>
Create a new migration script `backend/src/scripts/add_chat_channels_tables.js`. It should:
1. Create `chat_channels` table (id, tenant_id, name, description, is_private, created_by, created_at, updated_at).
2. Create `chat_channel_participants` table (channel_id, user_id, role, joined_at).
3. Alter `chat_messages` to add `channel_id` (foreign key to `chat_channels`, nullable).
4. Alter `chat_messages` to make `receiver_id` nullable (since group messages won't have a specific receiver).
Add `"migrate:chat-channels": "node src/scripts/add_chat_channels_tables.js"` to `backend/package.json` scripts.
</action>
<acceptance_criteria>
- `backend/src/scripts/add_chat_channels_tables.js` is created and contains the `CREATE TABLE` and `ALTER TABLE` statements.
- `backend/package.json` contains `"migrate:chat-channels"`.
</acceptance_criteria>
</task>
