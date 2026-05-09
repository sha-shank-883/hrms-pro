---
wave: 2
depends_on: ["1-PLAN.md"]
files_modified: ["backend/src/routes/chatRoutes.js", "backend/src/controllers/chatController.js"]
autonomous: true
requirements: ["REQ-02"]
---

# Plan 3: REST API Routes for Channels & Groups

## Objective
Implement CRUD operations for channels and fetching channel message history.

## Tasks

<task>
<read_first>
- backend/src/routes/chatRoutes.js
- backend/src/controllers/chatController.js
</read_first>
<action>
1. In `backend/src/controllers/chatController.js`, add `createChannel`, `getChannels` (for the user's tenant), `joinChannel`, and `getChannelMessages` methods.
2. In `backend/src/routes/chatRoutes.js`, add the corresponding routes:
   - `POST /channels` -> `createChannel`
   - `GET /channels` -> `getChannels`
   - `POST /channels/:id/join` -> `joinChannel`
   - `GET /channels/:id/messages` -> `getChannelMessages`
Export the new methods from `chatController.js`.
</action>
<acceptance_criteria>
- `backend/src/controllers/chatController.js` exports `createChannel`, `getChannels`, `joinChannel`, `getChannelMessages`.
- `backend/src/routes/chatRoutes.js` registers the 4 new endpoints under `/channels` or `/messages/channels`.
</acceptance_criteria>
</task>
