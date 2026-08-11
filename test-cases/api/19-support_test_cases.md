# Support Module - Test Cases (`/api/support`)

## Chat Endpoints

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| SUP-001 | Start support chat | POST | `/api/support/chat/start` | 201 Created / 200 Existing | JWT |
| SUP-002 | Start chat without auth | POST | `/api/support/chat/start` | 401 Unauthorized | None |
| SUP-003 | Get my support chats | GET | `/api/support/chat/my` | 200 OK, chat array | JWT |
| SUP-004 | Get chat history | GET | `/api/support/chat/history/:chatId` | 200 OK, messages | JWT |
| SUP-005 | Get history of another user's chat | GET | `/api/support/chat/history/:chatId` | 403 Forbidden | JWT |
| SUP-006 | Close support chat | PUT | `/api/support/chat/:chatId/close` | 200 OK | JWT |
| SUP-007 | Close non-existent chat | PUT | `/api/support/chat/:chatId/close` | 404 Not Found | JWT |
| SUP-008 | Resolve chat (admin) | PUT | `/api/support/chat/:chatId/resolve` | 200 OK | Admin JWT |
| SUP-009 | Resolve chat as employee | PUT | `/api/support/chat/:chatId/resolve` | 403 Forbidden | Employee JWT |
| SUP-010 | Get admin active chats | GET | `/api/support/admin/chats` | 200 OK | Admin JWT |
| SUP-011 | Get admin dashboard | GET | `/api/support/admin/dashboard` | 200 OK | Admin JWT |
| SUP-012 | Get agents | GET | `/api/support/admin/agents` | 200 OK | Admin JWT |
| SUP-013 | Add agent | POST | `/api/support/admin/agents` | 201 Created | Admin JWT |
| SUP-014 | Add non-existent user as agent | POST | `/api/support/admin/agents` | 404 Not Found | Admin JWT |
| SUP-015 | Update agent | PUT | `/api/support/admin/agents/:id` | 200 OK | Admin JWT |
| SUP-016 | Remove agent | DELETE | `/api/support/admin/agents/:id` | 200 OK | Admin JWT |

## FAQ Endpoints

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| SUP-017 | Get FAQ list | GET | `/api/support/faq` | 200 OK, FAQ array | JWT |
| SUP-018 | Get FAQ categories | GET | `/api/support/faq/categories` | 200 OK | JWT |
| SUP-019 | Get FAQ by ID | GET | `/api/support/faq/:id` | 200 OK | JWT |
| SUP-020 | Get non-existent FAQ | GET | `/api/support/faq/:id` | 404 Not Found | JWT |
| SUP-021 | Create FAQ (admin) | POST | `/api/support/faq` | 201 Created | Admin JWT |
| SUP-022 | Create FAQ as employee | POST | `/api/support/faq` | 403 Forbidden | Employee JWT |
| SUP-023 | Create FAQ with missing question | POST | `/api/support/faq` | 400 Validation error | Admin JWT |
| SUP-024 | Create FAQ with missing answer | POST | `/api/support/faq` | 400 Validation error | Admin JWT |
| SUP-025 | Update FAQ | PUT | `/api/support/faq/:id` | 200 OK | Admin JWT |
| SUP-026 | Delete FAQ | DELETE | `/api/support/faq/:id` | 200 OK | Admin JWT |
| SUP-027 | Submit FAQ feedback | POST | `/api/support/faq/:id/feedback` | 200 OK | JWT |
| SUP-028 | Create FAQ category | POST | `/api/support/faq/categories` | 201 Created | Admin JWT |
| SUP-029 | Update FAQ category | PUT | `/api/support/faq/categories/:id` | 200 OK | Admin JWT |
| SUP-030 | Delete FAQ category | DELETE | `/api/support/faq/categories/:id` | 200 OK | Admin JWT |

## Ticket Endpoints

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| SUP-031 | Get tickets | GET | `/api/support/tickets` | 200 OK, ticket array | JWT |
| SUP-032 | Get ticket stats | GET | `/api/support/tickets/stats` | 200 OK | Admin JWT |
| SUP-033 | Get ticket by ID | GET | `/api/support/tickets/:id` | 200 OK | JWT |
| SUP-034 | Get non-existent ticket | GET | `/api/support/tickets/:id` | 404 Not Found | JWT |
| SUP-035 | Create ticket | POST | `/api/support/tickets` | 201 Created | JWT |
| SUP-036 | Create ticket with missing subject | POST | `/api/support/tickets` | 400 Validation error | JWT |
| SUP-037 | Update ticket status | PUT | `/api/support/tickets/:id/status` | 200 OK | Admin JWT |
| SUP-038 | Assign ticket | PUT | `/api/support/tickets/:id/assign` | 200 OK | Admin JWT |
| SUP-039 | Add comment to ticket | POST | `/api/support/tickets/:id/comments` | 201 Created | JWT |
| SUP-040 | Add comment without auth | POST | `/api/support/tickets/:id/comments` | 401 Unauthorized | None |

## AI & Canned Replies

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| SUP-041 | Ask AI with valid message | POST | `/api/support/ai/ask` | 200 OK, AI response | JWT |
| SUP-042 | Ask AI with empty message | POST | `/api/support/ai/ask` | 400 Validation error | JWT |
| SUP-043 | Get canned replies | GET | `/api/support/canned-replies` | 200 OK | Admin JWT |
| SUP-044 | Create canned reply | POST | `/api/support/canned-replies` | 201 Created | Admin JWT |
| SUP-045 | Update canned reply | PUT | `/api/support/canned-replies/:id` | 200 OK | Admin JWT |
| SUP-046 | Delete canned reply | DELETE | `/api/support/canned-replies/:id` | 200 OK | Admin JWT |
| SUP-047 | Create canned as employee | POST | `/api/support/canned-replies` | 403 Forbidden | Employee JWT |
| SUP-048 | XSS in FAQ answer | POST | `/api/support/faq` | Stored as literal | Admin JWT |
| SUP-049 | SQL injection in ticket subject | POST | `/api/support/tickets` | Parameterized | JWT |
| SUP-050 | Tenant isolation | GET | `/api/support/tickets` | Own tenant only | Cross-tenant |
| SUP-051 | Pagination on tickets | GET | `/api/support/tickets?page=1&limit=10` | 200 with pagination | JWT |
| SUP-052 | Ticket status flow: open -> in_progress -> resolved -> closed | PUT | status updates | All transitions work | Admin JWT |
| SUP-053 | Get only own tickets as employee | GET | `/api/support/tickets` (employee) | Filtered by user | Employee JWT |
| SUP-054 | Start chat then verify in my chats | POST + GET | workflow | Chat in list | JWT |
| SUP-055 | Close chat then verify status | PUT + GET | workflow | Status=closed | JWT |

---

**Total: 55 test cases**
