---
wave: 2
depends_on: ["1-PLAN.md"]
files_modified: ["backend/src/server.js", "backend/src/controllers/chatController.js"]
autonomous: true
requirements: ["REQ-01", "REQ-02"]
---

# Plan 2: Backend Socket.IO Configuration for Channels

## Objective
Configure Socket.IO to handle joining, leaving, and broadcasting messages to group channels.

## Tasks

<task>
<read_first>
- backend/src/server.js
- backend/src/controllers/chatController.js
</read_first>
<action>
Update the Socket.IO connection handler in `backend/src/server.js` to:
1. Handle a `join_channel` event that adds the socket to a room named `channel_${channel_id}`.
2. Handle a `leave_channel` event that removes the socket from the room.
3. Handle a `send_channel_message` event that broadcasts the message to the room `channel_${channel_id}`.
</action>
<acceptance_criteria>
- The Socket.IO connection block listens for `join_channel` and uses `socket.join()`.
- The Socket.IO connection block listens for `send_channel_message` and uses `io.to().emit()`.
</acceptance_criteria>
</task>
