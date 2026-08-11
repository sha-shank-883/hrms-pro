# Chat Module — Deep API Test Cases (115 tests)

## 1.1 Direct Messages — 20 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| C1 | Send DM to existing user | POST | `/api/chat/send` | `{ receiver_id, message }` | 201 | Message sent |
| C2 | Send DM with empty message | POST | `/api/chat/send` | `{ receiver_id: 1, message: "" }` | 400 | Cannot be empty |
| C3 | Send DM to non-existent user | POST | `/api/chat/send` | `receiver_id: 99999` | 404 | Recipient not found |
| C4 | Send DM to self | POST | `/api/chat/send` | `receiver_id: same_as_sender` | 400 | Cannot self-message |
| C5 | Send DM without auth | POST | `/api/chat/send` | No token | 401 | Unauthorized |
| C6 | Send DM with SQL injection in message | POST | `/api/chat/send` | `{ message: "'; DROP TABLE messages; --" }` | 201 | Sanitized |
| C7 | Send DM with XSS in message | POST | `/api/chat/send` | `{ message: "<script>alert(1)</script>" }` | 201 | HTML-encoded |
| C8 | Send DM with message type | POST | `/api/chat/send` | `{ message: "Hello", type: "text" }` | 201 | Type set |
| C9 | Send DM with attachment | POST | `/api/chat/send` | With file_id | 201 | Attachment linked |
| C10 | Send DM with very long message (10K chars) | POST | `/api/chat/send` | Long message | 400 | Length limit |
| C11 | Send DM with emoji | POST | `/api/chat/send` | `{ message: "Hello 👋" }` | 201 | Emoji stored |
| C12 | Send DM to user in different tenant | POST | `/api/chat/send` | Cross-tenant recipient | 403 | Blocked |
| C13 | Send DM then get conversation | POST → GET | Send → list | After send | 201 → 200 | Visible in history |
| C14 | Send multiple DMs to same user | POST x5 | Same recipient | 5 messages | 201 each | All stored |
| C15 | Send DM with reaction added later | POST → PUT | Send → react | After send | 201 → 200 | Reactable |
| C16 | Send DM with read receipt | POST | `/api/chat/send` | Normal DM | 201 | `is_read: false` |
| C17 | Send DM to blocked user | POST | `/api/chat/send` | Recipient blocked sender | 403 | Blocked |
| C18 | Send DM with incorrect receiver_id type | POST | `/api/chat/send` | `receiver_id: "abc"` | 400 | Invalid type |
| C19 | Send DM with negative receiver_id | POST | `/api/chat/send` | `receiver_id: -1` | 400 | Invalid |
| C20 | Send DM with null receiver | POST | `/api/chat/send` | `receiver_id: null` | 400 | Required |

## 1.2 Conversations — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| C21 | List conversations | GET | `/api/chat/conversations` | Valid auth | 200 | Array |
| C22 | List conversations without auth | GET | `/api/chat/conversations` | No token | 401 | Unauthorized |
| C23 | List with unread count | GET | `/api/chat/conversations` | Valid auth | 200 | `unread_count` per conversation |
| C24 | List with last_message | GET | `/api/chat/conversations` | Valid auth | 200 | `last_message`, `last_message_time` |
| C25 | List empty (no conversations) | GET | `/api/chat/conversations` | New user | 200 | Empty array |
| C26 | List sorted by recent | GET | `/api/chat/conversations` | Valid auth | 200 | Most recent first |
| C27 | List conversations pagination | GET | `/api/chat/conversations?page=1&limit=20` | Valid auth | 200 | Paginated |
| C28 | Search conversations | GET | `/api/chat/conversations?search=John` | Valid auth | 200 | Filtered |
| C29 | Get single conversation with user | GET | `/api/chat/conversations/:userId` | Valid auth | 200 | Conversation object |
| C30 | Get conversation with non-existent user | GET | `/api/chat/conversations/:userId` | `userId: 99999` | 404 | Not found |

## 1.3 Messages History — 12 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| C31 | Get messages in conversation | GET | `/api/chat/messages/:userId` | Valid auth | 200 | Array of messages |
| C32 | Get messages with pagination | GET | `/api/chat/messages/:userId?page=1&limit=50` | Valid auth | 200 | Paginated |
| C33 | Get messages sorted ascending | GET | `/api/chat/messages/:userId` | Valid auth | 200 | Oldest first |
| C34 | Get messages without auth | GET | `/api/chat/messages/:userId` | No token | 401 | Unauthorized |
| C35 | Get messages after specific ID | GET | `/api/chat/messages/:userId?after=100` | Valid auth | 200 | Only newer |
| C36 | Get messages before specific ID | GET | `/api/chat/messages/:userId?before=50` | Valid auth | 200 | Only older |
| C37 | Get messages with unread_only | GET | `/api/chat/messages/:userId?unread_only=true` | Valid auth | 200 | Unread only |
| C38 | Get messages with search | GET | `/api/chat/messages/:userId?search=hello` | Valid auth | 200 | Filtered |
| C39 | Get messages with date range | GET | `/api/chat/messages/:userId?from=2025-01-01&to=2025-01-31` | Valid auth | 200 | Date filtered |
| C40 | Get messages from non-conversation partner | GET | `/api/chat/messages/:userId` | Not conversation with this user | 200 | Empty or blocked |
| C41 | Get messages count | GET | `/api/chat/messages/:userId?count_only=true` | Valid auth | 200 | Number only |
| C42 | Get messages with includes sender info | GET | `/api/chat/messages/:userId` | Valid auth | 200 | `sender_name`, `sender_avatar` |

## 1.4 Edit & Delete Messages — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| C43 | Edit own message | PUT | `/api/chat/messages/:id` | `{ message: "Edited text" }` | 200 | Updated |
| C44 | Edit to empty message | PUT | `/api/chat/messages/:id` | `{ message: "" }` | 400 | Cannot be empty |
| C45 | Edit message not owned | PUT | `/api/chat/messages/:id` | Different user | 403 | Forbidden |
| C46 | Edit non-existent message | PUT | `/api/chat/messages/:id` | `id: 99999` | 404 | Not found |
| C47 | Edit after allowed time expired | PUT | `/api/chat/messages/:id` | Old message (>24h) | 400 | Edit window expired |
| C48 | Delete own message | DELETE | `/api/chat/messages/:id` | Owner | 200 | Deleted (soft) |
| C49 | Delete message not owned | DELETE | `/api/chat/messages/:id` | Different user | 403 | Forbidden |
| C50 | Delete non-existent | DELETE | `/api/chat/messages/:id` | `id: 99999` | 404 | Not found |
| C51 | Delete message after edit | DELETE | `/api/chat/messages/:id` | Previously edited | 200 | Deleted |
| C52 | Deleted message shows "deleted" placeholder | GET | `/api/chat/messages/:userId` | After delete | 200 | Shows `[deleted]` |

## 1.5 Reactions — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| C53 | Add reaction to message | POST | `/api/chat/messages/:id/reactions` | `{ reaction: "👍" }` | 201 | Reaction added |
| C54 | Add reaction without auth | POST | `/api/chat/messages/:id/reactions` | No token | 401 | Unauthorized |
| C55 | Add reaction to non-existent message | POST | `/api/chat/messages/:id/reactions` | `id: 99999` | 404 | Not found |
| C56 | Add duplicate reaction (same user, same emoji) | POST | `/api/chat/messages/:id/reactions` | Already reacted | 409 | Already exists |
| C57 | Add multiple different reactions | POST x3 | Different emojis | Same message | 201 each | All stored |
| C58 | Remove reaction | DELETE | `/api/chat/messages/:id/reactions/:reactionId` | Owner | 200 | Removed |
| C59 | Remove reaction not owned | DELETE | `/api/chat/messages/:id/reactions/:reactionId` | Different user | 403 | Forbidden |
| C60 | Remove non-existent reaction | DELETE | `/api/chat/messages/:id/reactions/:reactionId` | `reactionId: 99999` | 404 | Not found |
| C61 | Get reactions for message | GET | `/api/chat/messages/:id/reactions` | Valid auth | 200 | Array of reactions |
| C62 | Reactions show users list | GET | `/api/chat/messages/:id/reactions` | Valid auth | 200 | `user_id`, `user_name` per reaction |

## 1.6 Mark as Read — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| C63 | Mark conversation as read | PUT | `/api/chat/conversations/:userId/read` | Valid auth | 200 | Messages marked read |
| C64 | Mark read without auth | PUT | `/api/chat/conversations/:userId/read` | No token | 401 | Unauthorized |
| C65 | Mark read for non-existent user | PUT | `/api/chat/conversations/:userId/read` | `userId: 99999` | 404 | Not found |
| C66 | Mark read updates unread count | GET | `/api/chat/conversations` | After mark read | 200 | `unread_count: 0` |
| C67 | Mark specific messages as read | PUT | `/api/chat/messages/read` | `{ message_ids: [1,2,3] }` | 200 | Specific marked |
| C68 | Mark read with empty array | PUT | `/api/chat/messages/read` | `{ message_ids: [] }` | 200 | No-op |
| C69 | Mark read with invalid IDs | PUT | `/api/chat/messages/read` | `{ message_ids: [99999] }` | 200 | Ignores non-existent |
| C70 | Get unread count total | GET | `/api/chat/unread-count` | Valid auth | 200 | `count` field |

## 1.7 Channels — 18 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| C71 | Create channel | POST | `/api/chat/channels` | `{ name, description, type }` | 201 | Channel created |
| C72 | Create channel with empty name | POST | `/api/chat/channels` | `{ name: "" }` | 400 | Required |
| C73 | Create duplicate channel name | POST | `/api/chat/channels` | Same name as C71 | 409 | Duplicate |
| C74 | List channels | GET | `/api/chat/channels` | Valid auth | 200 | Array |
| C75 | List joined channels only | GET | `/api/chat/channels?joined_only=true` | Valid auth | 200 | Only joined |
| C76 | List public channels | GET | `/api/chat/channels?type=public` | Valid auth | 200 | Public only |
| C77 | Join channel | POST | `/api/chat/channels/:id/join` | Valid auth | 200 | Joined |
| C78 | Join non-existent channel | POST | `/api/chat/channels/:id/join` | `id: 99999` | 404 | Not found |
| C79 | Join private channel without invite | POST | `/api/chat/channels/:id/join` | Private channel | 403 | Cannot join |
| C80 | Leave channel | POST | `/api/chat/channels/:id/leave` | Member | 200 | Left |
| C81 | Send channel message | POST | `/api/chat/channels/:id/messages` | `{ message: "Hello everyone" }` | 201 | Sent to channel |
| C82 | Get channel messages | GET | `/api/chat/channels/:id/messages` | Member | 200 | Array |
| C83 | Get channel messages without membership | GET | `/api/chat/channels/:id/messages` | Non-member | 403 | Forbidden |
| C84 | Delete channel | DELETE | `/api/chat/channels/:id` | Admin/creator | 200 | Deleted |
| C85 | Delete channel as non-creator | DELETE | `/api/chat/channels/:id` | Member | 403 | Forbidden |
| C86 | Update channel | PUT | `/api/chat/channels/:id` | `{ name: "Renamed" }` | 200 | Updated |
| C87 | Add users to channel | POST | `/api/chat/channels/:id/members` | `{ user_ids: [1,2,3] }` | 200 | Added |
| C88 | Remove user from channel | DELETE | `/api/chat/channels/:id/members/:userId` | Admin | 200 | Removed |

## 1.8 Authorization — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| C89 | Employee can DM any employee | POST | `/api/chat/send` | Employee token | 201 | Allowed |
| C90 | Employee can view own conversations | GET | `/api/chat/conversations` | Employee | 200 | Own only |
| C91 | Employee cannot view others' conversations | GET | `/api/chat/messages/:userId` | Not conversation partner | 403 | Forbidden |
| C92 | Admin can view any? | GET | `/api/chat/conversations/:userId` | Admin, any user | 200 | Or 403 |
| C93 | Cross-tenant DM blocked | POST | `/api/chat/send` | Tenant A → Tenant B | 403 | Blocked |
| C94 | Channel creator can delete | DELETE | `/api/chat/channels/:id` | Creator | 200 | Allowed |
| C95 | Channel member can send | POST | `/api/chat/channels/:id/messages` | Member | 201 | Allowed |
| C96 | Non-member cannot send to channel | POST | `/api/chat/channels/:id/messages` | Non-member | 403 | Forbidden |
| C97 | Private channel visibility | GET | `/api/chat/channels` | Non-member | 200 | Not listed |
| C98 | Super Admin bypasses all chat restrictions | ALL | All endpoints | Super admin | 200 | Unrestricted |

## 1.9 Edge Cases — 17 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| C99 | Send 1000 messages to same user | POST x1000 | DM | Rapid fire | 201 each | All stored |
| C100 | Very long message (10K+) | POST | `/api/chat/send` | Max length | 400 | Truncated/rejected |
| C101 | Unicode/Double-byte message | POST | `/api/chat/send` | Japanese/Chinese | 201 | Stored |
| C102 | RTL message (Arabic) | POST | `/api/chat/send` | RTL text | 201 | Stored |
| C103 | Empty conversation between users | GET | `/api/chat/messages/:userId` | No messages sent | 200 | Empty array |
| C104 | User deleted account, conversation still shows | GET | `/api/chat/conversations` | Deleted user | 200 | Shows "Deleted User" |
| C105 | Channel with 100 members | POST | `/api/chat/channels/:id/members` | 100 user_ids | 200 | All added |
| C106 | Channel message formatting (bold, italic) | POST | Channel message | `{ message: "**bold** *italic*" }` | 201 | Markdown stored |
| C107 | Code block in message | POST | `/api/chat/send` | Code block | 201 | Preserved |
| C108 | Mention (@username) in message | POST | `/api/chat/send` | `@john` | 201 | Mention parsed |
| C109 | Link in message | POST | `/api/chat/send` | `https://example.com` | 201 | Link stored |
| C110 | Multiple file attachments | POST | `/api/chat/send` | Multiple file_ids | 201 | All attached |
| C111 | Reaction with custom emoji | POST | `/api/chat/messages/:id/reactions` | Custom emoji name | 201 | Or 400 if not supported |
| C112 | Channel with same name as DM | POST | Channel | Name = user's name | 201 | Disambiguated |
| C113 | Message edit shows "edited" indicator | GET | After edit | Edited message | 200 | `edited: true` |
| C114 | Delete message by admin (not owner) | DELETE | `/api/chat/messages/:id` | Admin token | 200 | Admin override |
| C115 | Rate limit (100 rapid sends) | POST | `/api/chat/send` x100 | Rapid | 429 | Rate limited |

Total: 20 + 10 + 12 + 10 + 10 + 8 + 18 + 10 + 17 = **115 tests**
