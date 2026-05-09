---
wave: 2
depends_on: ["1-PLAN.md"]
files_modified: ["mobile/src/screens/ChatListScreen.js", "mobile/src/navigation/index.js"]
autonomous: true
requirements: ["REQ-01", "REQ-02"]
---

# Plan 2: Chat List Screen

## Objective
Build a unified Chat List screen showing direct messages and channels, using custom "Industrial Utilitarian" styling.

## Tasks

<task>
<read_first>
- mobile/src/navigation/index.js
</read_first>
<action>
1. Create `mobile/src/screens/ChatListScreen.js` displaying a list of conversations using `FlatList`.
2. Implement a simple filter/toggle between "Direct" and "Channels". Use styles consistent with the HRMS app (e.g., using existing `Text` and `View` utilities).
3. Add a Floating Action Button (FAB) or header button to start a new chat/channel.
4. Integrate this screen into the main bottom tab navigator in `mobile/src/navigation` so it is accessible from the main dashboard.
</action>
<acceptance_criteria>
- `ChatListScreen.js` renders a list of fetched conversations and channels.
- The UI follows custom styling (no `react-native-gifted-chat`).
- The Chat tab is visible in the main app navigation.
</acceptance_criteria>
</task>
