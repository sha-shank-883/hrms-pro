---
wave: 2
depends_on: ["1-PLAN.md", "2-PLAN.md"]
files_modified: ["mobile/src/screens/ChatRoomScreen.js", "mobile/src/navigation/index.js"]
autonomous: true
requirements: ["REQ-01", "REQ-02"]
---

# Plan 3: Chat Room Screen

## Objective
Build the conversation UI for sending and receiving messages in real-time.

## Tasks

<task>
<read_first>
- mobile/src/screens/ChatListScreen.js
</read_first>
<action>
1. Create `mobile/src/screens/ChatRoomScreen.js`.
2. Implement a `FlatList` (inverted) for message bubbles. Style bubbles to differentiate sender vs receiver (e.g., primary color for sender, gray for receiver).
3. Implement a fixed input bar at the bottom with a text input and send button, wrapped in a `KeyboardAvoidingView` for iOS/Android compatibility.
4. Connect to `useChat()` to send messages via socket (`send_message` or `send_channel_message`) and append incoming socket messages to the local state.
5. Register `ChatRoomScreen` in the stack navigator so users can navigate to it from `ChatListScreen`.
</action>
<acceptance_criteria>
- `ChatRoomScreen` displays the message history with custom bubble styling.
- Sending a message emits the socket event and optimistically updates the UI.
- Incoming socket messages append to the list.
</acceptance_criteria>
</task>
