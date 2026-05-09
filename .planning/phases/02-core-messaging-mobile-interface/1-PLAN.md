---
wave: 1
depends_on: []
files_modified: ["mobile/src/api/chat.js", "mobile/src/context/ChatContext.js", "mobile/App.js"]
autonomous: true
requirements: ["REQ-01", "REQ-02"]
---

# Plan 1: Mobile Chat API & Socket Context

## Objective
Create the API service for chat endpoints and set up a global React Context to manage the Socket.IO connection.

## Tasks

<task>
<read_first>
- mobile/src/api/index.js
</read_first>
<action>
1. Create `mobile/src/api/chat.js` with Axios methods to call backend routes: `getChannels()`, `createChannel()`, `joinChannel()`, `getChannelMessages()`, `getConversations()`, `getMessages()`.
2. Create `mobile/src/context/ChatContext.js` that establishes a Socket.IO connection using the auth token and tenantId. It should expose the socket instance, connection status, and handle incoming message events (`receive_message`, `receive_channel_message`).
3. Wrap the main app tree in `mobile/App.tsx` (or `App.js`) with the `ChatProvider`.
</action>
<acceptance_criteria>
- `mobile/src/api/chat.js` exports the API methods.
- `mobile/src/context/ChatContext.js` exports `ChatProvider` and `useChat`.
- `App.tsx` includes `<ChatProvider>`.
</acceptance_criteria>
</task>
