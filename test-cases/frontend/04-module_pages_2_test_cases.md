# Frontend Module Pages - Part 2

## Payroll Page (`/payroll`)
| # | Test Case | Expected Result |
|---|---|---|
| PAY-F01 | Payroll records list renders | Records visible |
| PAY-F02 | Generate payroll buttons | Generation initiated |
| PAY-F03 | Process payment with method dropdown | Payment processed |
| PAY-F04 | View payslip modal | Payslip opens |
| PAY-F05 | Tax declarations tab | Tax declaration form works |
| PAY-F06 | Approve/reject tax declaration | Status updated |
| PAY-F07 | Payroll statistics cards | Stats load |
| PAY-F08 | Month/Year filter | Records filtered |
| PAY-F09 | Auto Generate modal for bulk | Modal works |
| PAY-F10 | Net salary calculator preview | Estimate shown |
| PAY-F11 | Apply/Reset filter buttons | Filters work |

## My Payslips (`/my-payslips`)
| # | Test Case | Expected Result |
|---|---|---|
| PAY-F12 | Employee payslips list | Visible |
| PAY-F13 | View/Download payslip | Opens/downloads |
| PAY-F14 | Tax declaration submission modal | Works |

## Recruitment Page (`/recruitment`)
| # | Test Case | Expected Result |
|---|---|---|
| REC-F15 | Job postings tab | Jobs list visible |
| REC-F16 | Create job posting | Job created |
| REC-F17 | Edit job posting | Job updated |
| REC-F18 | Applications tab | Applications list |
| REC-F19 | Update application status dropdown | Status updated inline |
| REC-F20 | Resume upload/parse | Resume parsed |
| REC-F21 | Delete job/application | Deleted |
| REC-F22 | Clear filters buttons | Filters reset |
| REC-F23 | Applicant filter by job role | Filtered |

## Documents Page (`/documents`)
| # | Test Case | Expected Result |
|---|---|---|
| DOC-F24 | Document list renders | Documents visible |
| DOC-F25 | Upload document with category | Document uploaded |
| DOC-F26 | Document category filter | Filtered |
| DOC-F27 | Delete document | Deleted |
| DOC-F28 | Download/View document | File opens |
| DOC-F29 | Confidential documents badge | Badge shows |
| DOC-F30 | Statistics cards (Total, Contracts, etc.) | Cards load |
| DOC-F31 | Search input | Filtered by keyword |
| DOC-F32 | Department/Employee/Document type filters | Filtered |
| DOC-F33 | Expiry date warnings | Warning shown |

## Chat Page (`/chat`)
| # | Test Case | Expected Result |
|---|---|---|
| CHT-F34 | Conversation list loads | Conversations visible |
| CHT-F35 | Select conversation -> messages load | Messages displayed |
| CHT-F36 | Send text message | Sent and displayed |
| CHT-F37 | Send attachment/file upload | File attached |
| CHT-F38 | Real-time message delivery | Appears without refresh |
| CHT-F39 | Typing indicator | "typing..." shows |
| CHT-F40 | Message reactions (emoji) | Reaction added |
| CHT-F41 | Star message | Starred |
| CHT-F42 | Edit message | Edited |
| CHT-F43 | Delete message | Redacted |
| CHT-F44 | Delete conversation | Removed |
| CHT-F45 | Online status indicators | Green dot on online |
| CHT-F46 | Search within chat | Searchable |
| CHT-F47 | Emoji picker | Opens and inserts |
| CHT-F48 | Voice/Video call buttons | Call signaling works |
| CHT-F49 | Employee search for new chat | Search works |
| CHT-F50 | Unread badge on conversation | Badge shows count |

## Performance Page (`/performance`)
| # | Test Case | Expected Result |
|---|---|---|
| PRF-F51 | Goals/OKRs display | Goals visible |
| PRF-F52 | Create goal | Goal created |
| PRF-F53 | Update goal progress | Progress tracked |
| PRF-F54 | Performance reviews list | Reviews visible |
| PRF-F55 | Performance cycles | Cycles management |

---

**Total: 55 test cases**
