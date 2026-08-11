# Support Module — Deep API Test Cases (110 tests)

## 1.1 Support Chat — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| S1 | Start support chat | POST | `/api/support/chat` | `{ message, department }` | 201 | Chat started |
| S2 | Start chat without message | POST | `/api/support/chat` | Empty message | 400 | Required |
| S3 | Start chat without auth | POST | `/api/support/chat` | No token | 401 | Unauthorized |
| S4 | Send message to support | POST | `/api/support/chat/:id/messages` | `{ message: "Need help" }` | 201 | Sent |
| S5 | Send empty message | POST | `/api/support/chat/:id/messages` | Empty | 400 | Required |
| S6 | Get support chat history | GET | `/api/support/chat/history` | Valid auth | 200 | Array |
| S7 | Get specific chat messages | GET | `/api/support/chat/:id/messages` | Valid auth | 200 | Messages |
| S8 | Close support chat | PUT | `/api/support/chat/:id/close` | Owner/admin | 200 | Closed |
| S9 | Close already closed chat | PUT | `/api/support/chat/:id/close` | Already closed | 400 | Already closed |
| S10 | Close chat not owned | PUT | `/api/support/chat/:id/close` | Different user | 403 | Forbidden |
| S11 | Resolve support chat | PUT | `/api/support/chat/:id/resolve` | Agent | 200 | Resolved |
| S12 | Get support stats | GET | `/api/support/chat/stats` | Admin/agent | 200 | Stats |
| S13 | Support chat with file attachment | POST | `/api/support/chat/:id/messages` | With file | 201 | Attachment |
| S14 | Rate limit support messages | POST x30 | Rapid messages | Same chat | 429 | Rate limited |
| S15 | Support chat cross-tenant | GET | `/api/support/chat/history` | Wrong tenant | 403 | Blocked |

## 1.2 FAQ — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| S16 | Create FAQ | POST | `/api/support/faq` | `{ question, answer, category }` | 201 | FAQ created |
| S17 | Create with missing question | POST | `/api/support/faq` | No question | 400 | Required |
| S18 | Create with missing answer | POST | `/api/support/faq` | No answer | 400 | Required |
| S19 | Create duplicate question | POST | `/api/support/faq` | Same question | 409 | Duplicate |
| S20 | Create without auth | POST | `/api/support/faq` | No token | 401 | Unauthorized |
| S21 | Create as employee | POST | `/api/support/faq` | Employee | 403 | Forbidden |
| S22 | Create with SQL injection | POST | `/api/support/faq` | `{ question: "'; DROP TABLE faq; --" }` | 201 | Sanitized |
| S23 | List FAQs (public) | GET | `/api/support/faq` | No auth | 200 | Array |
| S24 | List with category filter | GET | `/api/support/faq?category=billing` | Valid auth | 200 | Filtered |
| S25 | List with search | GET | `/api/support/faq?search=password` | Valid auth | 200 | Searched |
| S26 | List pagination | GET | `/api/support/faq?page=1&limit=20` | Valid auth | 200 | Paginated |
| S27 | Get FAQ categories | GET | `/api/support/faq/categories` | Valid auth | 200 | Array |
| S28 | Update FAQ | PUT | `/api/support/faq/:id` | `{ answer: "Updated" }` | 200 | Updated |
| S29 | Delete FAQ | DELETE | `/api/support/faq/:id` | Admin | 200 | Deleted |
| S30 | FAQ helpful feedback | POST | `/api/support/faq/:id/feedback` | `{ helpful: true }` | 200 | Feedback stored |

## 1.3 Tickets — 20 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| S31 | Create ticket | POST | `/api/support/tickets` | `{ subject, description, priority, category }` | 201 | Ticket created |
| S32 | Create with missing subject | POST | `/api/support/tickets` | No subject | 400 | Required |
| S33 | Create with missing description | POST | `/api/support/tickets` | No description | 400 | Required |
| S34 | Create without auth | POST | `/api/support/tickets` | No token | 401 | Unauthorized |
| S35 | Create with attachment | POST | `/api/support/tickets` | Multipart with file | 201 | Attached |
| S36 | Create with SQL injection | POST | `/api/support/tickets` | `{ description: "'; DROP TABLE tickets; --" }` | 201 | Sanitized |
| S37 | Create with XSS | POST | `/api/support/tickets` | `{ subject: "<script>alert(1)</script>" }` | 201 | HTML-encoded |
| S38 | List my tickets | GET | `/api/support/tickets` | Employee | 200 | Own tickets |
| S39 | List all tickets (admin) | GET | `/api/support/tickets?all=true` | Admin/agent | 200 | All |
| S40 | List with status filter | GET | `/api/support/tickets?status=open` | Valid auth | 200 | Open only |
| S41 | List with priority filter | GET | `/api/support/tickets?priority=high` | Valid auth | 200 | High priority |
| S42 | List with category filter | GET | `/api/support/tickets?category=technical` | Valid auth | 200 | Filtered |
| S43 | List pagination | GET | `/api/support/tickets?page=1&limit=10` | Valid auth | 200 | Paginated |
| S44 | Get single ticket | GET | `/api/support/tickets/:id` | Valid auth | 200 | Ticket object |
| S45 | Get ticket not owned (employee) | GET | `/api/support/tickets/:id` | Different user | 403 | Forbidden |
| S46 | Update ticket status | PUT | `/api/support/tickets/:id` | `{ status: "in_progress" }` | 200 | Updated |
| S47 | Assign ticket to agent | PUT | `/api/support/tickets/:id/assign` | `{ agent_id: 1 }` | 200 | Assigned |
| S48 | Assign non-existent agent | PUT | `/api/support/tickets/:id/assign` | `agent_id: 99999` | 404 | Not found |
| S49 | Delete ticket | DELETE | `/api/support/tickets/:id` | Admin | 200 | Deleted |
| S50 | Delete not owned | DELETE | `/api/support/tickets/:id` | Creator employee | 403 | Forbidden |

## 1.4 Ticket Comments — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| S51 | Add comment to ticket | POST | `/api/support/tickets/:id/comments` | `{ comment: "Here's the fix" }` | 201 | Comment added |
| S52 | Add empty comment | POST | `/api/support/tickets/:id/comments` | `{ comment: "" }` | 400 | Required |
| S53 | Add to non-existent ticket | POST | `/api/support/tickets/:id/comments` | `id: 99999` | 404 | Not found |
| S54 | Add without auth | POST | `/api/support/tickets/:id/comments` | No token | 401 | Unauthorized |
| S55 | Add with SQL injection | POST | `/api/support/tickets/:id/comments` | `{ comment: "'; DROP TABLE comments; --" }` | 201 | Sanitized |
| S56 | List ticket comments | GET | `/api/support/tickets/:id/comments` | Valid auth | 200 | Array |
| S57 | List with pagination | GET | `/api/support/tickets/:id/comments?page=1&limit=20` | Valid auth | 200 | Paginated |
| S58 | Update comment | PUT | `/api/support/tickets/:id/comments/:commentId` | `{ comment: "Edited" }` | 200 | Updated |
| S59 | Delete comment | DELETE | `/api/support/tickets/:id/comments/:commentId` | Owner | 200 | Deleted |
| S60 | Add comment with file attachment | POST | `/api/support/tickets/:id/comments` | With file | 201 | Attached |

## 1.5 AI Support — 6 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| S61 | Ask AI question | POST | `/api/support/ai/ask` | `{ question: "How to reset password?" }` | 200 | AI response |
| S62 | Ask without question | POST | `/api/support/ai/ask` | No question | 400 | Required |
| S63 | Ask without auth | POST | `/api/support/ai/ask` | No token | 401 | Unauthorized |
| S64 | Ask with very long question | POST | `/api/support/ai/ask` | 5000 chars | 400 | Too long |
| S65 | AI response format | POST | `/api/support/ai/ask` | Valid question | 200 | `answer` field |
| S66 | AI rate limiting | POST | `/api/support/ai/ask` x 10 | Rapid | 429 | Limited |

## 1.6 Canned Replies — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| S67 | Create canned reply | POST | `/api/support/canned-replies` | `{ title, body, category }` | 201 | Created |
| S68 | Create duplicate title | POST | `/api/support/canned-replies` | Same title | 409 | Duplicate |
| S69 | List canned replies | GET | `/api/support/canned-replies` | Valid auth | 200 | Array |
| S70 | List by category | GET | `/api/support/canned-replies?category=general` | Valid auth | 200 | Filtered |
| S71 | Update canned reply | PUT | `/api/support/canned-replies/:id` | `{ body: "Updated" }` | 200 | Updated |
| S72 | Delete canned reply | DELETE | `/api/support/canned-replies/:id` | Admin | 200 | Deleted |
| S73 | Use canned reply in ticket | POST | `/api/support/tickets/:id/comments` | `{ canned_reply_id: 1 }` | 201 | Auto-expanded |
| S74 | Create without auth | POST | `/api/support/canned-replies` | No token | 401 | Unauthorized |

## 1.7 Support Dashboard & Agents — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| S75 | Get support dashboard | GET | `/api/support/admin/dashboard` | Admin/agent | 200 | Dashboard |
| S76 | Dashboard includes open tickets | GET | `/api/support/admin/dashboard` | Admin | 200 | Open count |
| S77 | Dashboard includes avg response time | GET | `/api/support/admin/dashboard` | Admin | 200 | Response time |
| S78 | Dashboard includes satisfaction rate | GET | `/api/support/admin/dashboard` | Admin | 200 | CSAT |
| S79 | Dashboard without auth | GET | `/api/support/admin/dashboard` | No token | 401 | Unauthorized |
| S80 | Dashboard as employee | GET | `/api/support/admin/dashboard` | Employee | 403 | Forbidden |
| S81 | List support agents | GET | `/api/support/admin/agents` | Admin | 200 | Agents list |
| S82 | Assign agent role | PUT | `/api/support/admin/agents/:id` | `{ role: "agent" }` | 200 | Role set |
| S83 | Remove agent | DELETE | `/api/support/admin/agents/:id` | Admin | 200 | Removed |
| S84 | Agent stats | GET | `/api/support/admin/agents/:id/stats` | Admin | 200 | Per agent |

## 1.8 Authorization — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| S85 | Admin full support access | ALL | All | Admin | 200 | Full |
| S86 | Manager can view tickets | GET | Tickets | Manager | 200 | All or team? |
| S87 | Manager cannot delete tickets | DELETE | Tickets/:id | Manager | 403 | Forbidden |
| S88 | Employee can create own ticket | POST | Tickets | Employee | 201 | Allowed |
| S89 | Employee can view own tickets | GET | Tickets | Employee | 200 | Own |
| S90 | Employee cannot view others' tickets | GET | Tickets/:id | Not owner | 403 | Forbidden |
| S91 | Employee cannot close others' tickets | PUT | Close | Not owner | 403 | Forbidden |
| S92 | Employee cannot manage FAQ | POST/PUT/DELETE | FAQ | Employee | 403 | Forbidden |
| S93 | Employee cannot access admin dashboard | GET | Admin dashboard | Employee | 403 | Forbidden |
| S94 | Agent can view all tickets | GET | Tickets all | Agent | 200 | All |
| S95 | Agent can assign tickets | PUT | Assign | Agent | 200 | Allowed |
| S96 | Agent can manage canned replies | POST/PUT/DELETE | Canned | Agent | 200 | Allowed |
| S97 | Cross-tenant isolation | ALL | All | Wrong tenant | 403 | Blocked |
| S98 | Super Admin bypasses | ALL | All | Super admin | 200 | Unrestricted |
| S99 | SQL injection in ticket search | GET | Tickets?search='UNION... | Valid | 200 | Sanitized |

## 1.9 Edge Cases — 11 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| S100 | Ticket with very long subject | POST | Tickets | 500 chars | 400 | Too long |
| S101 | Ticket with very long description | POST | Tickets | 10K chars | 201 | Long desc OK |
| S102 | FAQ with HTML in answer | POST | FAQ | HTML answer | 201 | Stripped/escaped |
| S103 | FAQ with code blocks | POST | FAQ | Code sample | 201 | Preserved |
| S104 | Ticket lifecycle (open→in_progress→resolved→closed) | PUT x4 | All transitions | Full flow | 200 | Complete |
| S105 | Reopen closed ticket | PUT | Tickets/:id | `{ status: "open" }` from "closed" | 400 | Can't reopen |
| S106 | Multiple comments on same ticket | POST x50 | Comments | Bulk | 201 each | All stored |
| S107 | Support chat with agent assignment | POST | Chat | Direct to agent | 201 | Agent assigned |
| S108 | Chat transfer to another agent | PUT | Chat/:id/transfer | `{ agent_id: 2 }` | 200 | Transferred |
| S109 | Ticket priority escalation | PUT | Tickets/:id | low→medium→high→critical | 200 | Escalated |
| S110 | Ticket satisfaction survey after resolve | POST | Tickets/:id/survey | `{ rating: 5, feedback: "Great" }` | 200 | Survey stored |

Total: 15 + 15 + 20 + 10 + 6 + 8 + 10 + 15 + 11 = **110 tests**
