# Chat Module - Test Cases (`/api/chat`)

## Endpoints
- `GET /api/chat/conversations` - List conversations
- `GET /api/chat/messages` - Get messages
- `GET /api/chat/unread-count` - Unread count
- `POST /api/chat/messages` - Send message
- `POST /api/chat/messages/reaction` - Add reaction
- `PUT /api/chat/messages/read` - Mark as read
- `PUT /api/chat/messages/:id` - Edit message
- `DELETE /api/chat/messages/:id` - Delete message
- `DELETE /api/chat/conversations/:userId` - Delete conversation
- `POST /api/chat/channels` - Create channel
- `GET /api/chat/channels` - List channels
- `POST /api/chat/channels/:id/join` - Join channel
- `GET /api/chat/channels/:id/messages` - Channel messages

---

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| CHT-001 | Get conversations | GET | `/api/chat/conversations` | 200 OK, conversation array | JWT |
| CHT-002 | Get conversations without auth | GET | `/api/chat/conversations` | 401 Unauthorized | None |
| CHT-003 | Get conversations (empty list for new user) | GET | `/api/chat/conversations` | 200, empty array | JWT |
| CHT-004 | Get conversations with last message | GET | `/api/chat/conversations` | last_message field present | JWT |
| CHT-005 | Get messages between two users | GET | `/api/chat/messages?user2_id=X` | 200 OK, messages array | JWT |
| CHT-006 | Get messages without user2_id | GET | `/api/chat/messages` | 200, all user messages | JWT |
| CHT-007 | Get messages with non-existent user | GET | `/api/chat/messages?user2_id=99999` | 200, empty array | JWT |
| CHT-008 | Get messages with pagination | GET | `/api/chat/messages?user2_id=X&page=1&limit=20` | 200 with pagination | JWT |
| CHT-009 | Get messages without auth | GET | `/api/chat/messages` | 401 Unauthorized | None |
| CHT-010 | Get unread count | GET | `/api/chat/unread-count` | 200 OK, count number | JWT |
| CHT-011 | Get unread count (no unread) | GET | `/api/chat/unread-count` | 200, count=0 | JWT |
| CHT-012 | Send text message | POST | `/api/chat/messages` | 201 Created | JWT |
| CHT-013 | Send message without auth | POST | `/api/chat/messages` | 401 Unauthorized | None |
| CHT-014 | Send message with missing receiver_id | POST | `/api/chat/messages` | 400 Validation error | JWT |
| CHT-015 | Send message with missing message text | POST | `/api/chat/messages` | 400 Validation error | JWT |
| CHT-016 | Send message with empty message | POST | `/api/chat/messages` | 400 Validation error | JWT |
| CHT-017 | Send message with string receiver_id (not int) | POST | `/api/chat/messages` | 400 Validation error | JWT |
| CHT-018 | Send message with attachment | POST | `/api/chat/messages` | 201, attachment metadata saved | JWT |
| CHT-019 | Send message with reply_to_id | POST | `/api/chat/messages` | 201, reply context saved | JWT |
| CHT-020 | Send message to non-existent user | POST | `/api/chat/messages` | 400 or 404 | JWT |
| CHT-021 | Add reaction to message | POST | `/api/chat/messages/reaction` | 200 OK | JWT |
| CHT-022 | Add reaction without auth | POST | `/api/chat/messages/reaction` | 401 Unauthorized | None |
| CHT-023 | Add reaction to non-existent message | POST | `/api/chat/messages/reaction` | 404 Not Found | JWT |
| CHT-024 | Change reaction (different emoji) | POST | `/api/chat/messages/reaction` | 200, reaction updated | JWT |
| CHT-025 | Remove reaction (same emoji again - toggle) | POST | `/api/chat/messages/reaction` | 200, removed or idempotent | JWT |
| CHT-026 | Mark messages as read | PUT | `/api/chat/messages/read` | 200 OK | JWT |
| CHT-027 | Mark as read with empty array | PUT | `/api/chat/messages/read` | 200, no-op | JWT |
| CHT-028 | Mark as read without auth | PUT | `/api/chat/messages/read` | 401 Unauthorized | None |
| CHT-029 | Edit own message | PUT | `/api/chat/messages/:id` | 200, is_edited=true | JWT |
| CHT-030 | Edit another user's message | PUT | `/api/chat/messages/:id` | 403 Forbidden | JWT |
| CHT-031 | Edit non-existent message | PUT | `/api/chat/messages/:id` | 404 Not Found | JWT |
| CHT-032 | Delete own message | DELETE | `/api/chat/messages/:id` | 200, soft-deleted | JWT |
| CHT-033 | Delete another user's message | DELETE | `/api/chat/messages/:id` | 403 Forbidden | JWT |
| CHT-034 | Delete non-existent message | DELETE | `/api/chat/messages/:id` | 404 Not Found | JWT |
| CHT-035 | Delete conversation | DELETE | `/api/chat/conversations/:userId` | 200 OK | JWT |
| CHT-036 | Delete conversation without auth | DELETE | `/api/chat/conversations/:userId` | 401 Unauthorized | None |
| CHT-037 | Create channel | POST | `/api/chat/channels` | 201 Created | JWT |
| CHT-038 | Create channel with missing name | POST | `/api/chat/channels` | 400 Validation error | JWT |
| CHT-039 | Create channel without auth | POST | `/api/chat/channels` | 401 Unauthorized | None |
| CHT-040 | Get channels | GET | `/api/chat/channels` | 200 OK, channel list | JWT |
| CHT-041 | Join public channel | POST | `/api/chat/channels/:id/join` | 200 OK | JWT |
| CHT-042 | Join private channel (not invited) | POST | `/api/chat/channels/:id/join` | 403 Forbidden | JWT |
| CHT-043 | Join non-existent channel | POST | `/api/chat/channels/:id/join` | 404 Not Found | JWT |
| CHT-044 | Get channel messages (participant) | GET | `/api/chat/channels/:id/messages` | 200 OK | JWT |
| CHT-045 | Get channel messages (non-participant) | GET | `/api/chat/channels/:id/messages` | 403 Forbidden | JWT |
| CHT-046 | Messages encrypted at rest | GET | Check DB | Message column encrypted | - |
| CHT-047 | Tenant isolation: messages isolated | GET | `/api/chat/conversations` | Only own tenant | Cross-tenant |
| CHT-048 | SQL injection in message text | POST | `/api/chat/messages` | Parameterized, injection fails | JWT |
| CHT-049 | XSS in message text | POST | `/api/chat/messages` | Stored as literal/escaped | JWT |
| CHT-050 | Send message then verify in conversation list | POST + GET | workflow | Last message visible | JWT |
| CHT-051 | Delete conversation then GET returns empty | DELETE + GET | workflow | No conversations | JWT |
| CHT-052 | Unread count increases after new message | POST + GET | workflow | Count increments | JWT |
| CHT-053 | Mark as read decreases unread count | PUT + GET | workflow | Count decrements | JWT |
| CHT-054 | Channel messages pagination | GET | `/api/chat/channels/:id/messages?page=1&limit=20` | 200 with pagination | JWT |
| CHT-055 | Response format: success + data | GET | `/api/chat/conversations` | `{ success, data }` | JWT |

---

**Total: 55 test cases**
