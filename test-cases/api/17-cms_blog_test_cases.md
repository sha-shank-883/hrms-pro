# CMS & Blog Modules - Test Cases

## CMS (`/api/cms`)

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| CMS-001 | Get all CMS pages (admin) | GET | `/api/cms/pages` | 200 OK, page array | Admin JWT |
| CMS-002 | Get CMS pages without auth | GET | `/api/cms/pages` | 401 Unauthorized | None |
| CMS-003 | Get page by slug (public) | GET | `/api/cms/pages/:slug` | 200 OK, page data | None |
| CMS-004 | Get page by non-existent slug | GET | `/api/cms/pages/:slug` | 404 Not Found | None |
| CMS-005 | Get page by slug with layout | GET | `/api/cms/pages/:slug` | layout_template in response | None |
| CMS-006 | Create page with valid data | POST | `/api/cms/pages` | 201 Created | Admin JWT |
| CMS-007 | Create page without auth | POST | `/api/cms/pages` | 401 Unauthorized | None |
| CMS-008 | Create page as non-admin | POST | `/api/cms/pages` | 403 Forbidden | Employee JWT |
| CMS-009 | Create page with missing slug | POST | `/api/cms/pages` | 400 Validation error | Admin JWT |
| CMS-010 | Create page with missing title | POST | `/api/cms/pages` | 400 Validation error | Admin JWT |
| CMS-011 | Create duplicate slug | POST | `/api/cms/pages` | 409 Conflict | Admin JWT |
| CMS-012 | Create page with layout_template | POST | `/api/cms/pages` | 201, layout saved | Admin JWT |
| CMS-013 | Create page with invalid layout | POST | `/api/cms/pages` | 400 Validation error | Admin JWT |
| CMS-014 | Create page as published | POST | `/api/cms/pages` | 201, published_status=saved | Admin JWT |
| CMS-015 | Update page | PUT | `/api/cms/pages/:id` | 200 OK | Admin JWT |
| CMS-016 | Update page without slug | PUT | `/api/cms/pages/:id` | 400 or 200 | Admin JWT |
| CMS-017 | Update non-existent page | PUT | `/api/cms/pages/:id` | 404 Not Found | Admin JWT |
| CMS-018 | Update page layout_template | PUT | `/api/cms/pages/:id` | 200, layout updated | Admin JWT |
| CMS-019 | Update page custom_css | PUT | `/api/cms/pages/:id` | 200, CSS saved | Admin JWT |
| CMS-020 | Update page custom_js | PUT | `/api/cms/pages/:id` | 200, JS saved | Admin JWT |
| CMS-021 | Delete page | DELETE | `/api/cms/pages/:id` | 200 OK | Admin JWT |
| CMS-022 | Delete non-existent page | DELETE | `/api/cms/pages/:id` | 404 Not Found | Admin JWT |
| CMS-023 | Create + publish + verify public | POST + GET slug | workflow | Page visible publicly | Admin JWT |
| CMS-024 | Update title then GET by slug | PUT + GET | workflow | Updated title visible | Admin JWT |
| CMS-025 | Delete then GET by slug returns 404 | DELETE + GET | workflow | 404 Not Found | Admin JWT |
| CMS-026 | SQL injection in slug | POST | `/api/cms/pages` | Parameterized | Admin JWT |
| CMS-027 | XSS in title | POST | `/api/cms/pages` | Stored as literal | Admin JWT |
| CMS-028 | Tenant isolation | GET | `/api/cms/pages` | Own tenant only | Cross-tenant |
| CMS-029 | Page response includes sections | GET | `/api/cms/pages/:slug` | sections array in response | None |
| CMS-030 | Page response includes custom_css + custom_js | GET | `/api/cms/pages/:slug` | Code fields in response | None |

## Blog (`/api/blog`)

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| BLG-031 | Get published posts (public) | GET | `/api/blog/published` | 200 OK | None |
| BLG-032 | Get published post by slug | GET | `/api/blog/published/:slug` | 200 OK | None |
| BLG-033 | Get non-existent published slug | GET | `/api/blog/published/:slug` | 404 Not Found | None |
| BLG-034 | Get single post by ID (public) | GET | `/api/blog/:id` | 200 OK | None |
| BLG-035 | Get all posts (admin) | GET | `/api/blog` | 200 OK | Admin JWT |
| BLG-036 | Get posts without auth | GET | `/api/blog` | 401 Unauthorized | None |
| BLG-037 | Create post with valid data | POST | `/api/blog` | 201 Created | Admin JWT |
| BLG-038 | Create post with missing slug | POST | `/api/blog` | 400 Validation error | Admin JWT |
| BLG-039 | Create post with missing title | POST | `/api/blog` | 400 Validation error | Admin JWT |
| BLG-040 | Create duplicate slug | POST | `/api/blog` | 409 Conflict | Admin JWT |
| BLG-041 | Update post | PUT | `/api/blog/:id` | 200 OK | Admin JWT |
| BLG-042 | Update non-existent post | PUT | `/api/blog/:id` | 404 Not Found | Admin JWT |
| BLG-043 | Delete post | DELETE | `/api/blog/:id` | 200 OK | Admin JWT |
| BLG-044 | Delete non-existent post | DELETE | `/api/blog/:id` | 404 Not Found | Admin JWT |
| BLG-045 | Published posts exclude drafts | GET | `/api/blog/published` | Only published articles | None |
| BLG-046 | Published posts with pagination | GET | `/api/blog/published?page=1&limit=10` | 200 with pagination | None |
| BLG-047 | Create post with content_html | POST | `/api/blog` | 201, HTML saved | Admin JWT |
| BLG-048 | Create post with featured_image | POST | `/api/blog` | 201, image saved | Admin JWT |
| BLG-049 | Create post with tags | POST | `/api/blog` | 201, tags saved | Admin JWT |
| BLG-050 | Update post publish status | PUT | `/api/blog/:id` | 200, status changed | Admin JWT |
| BLG-051 | XSS in blog title | POST | `/api/blog` | Stored as literal | Admin JWT |
| BLG-052 | SQL injection in blog slug | POST | `/api/blog` | Parameterized | Admin JWT |
| BLG-053 | Tenant isolation on blog | GET | `/api/blog` | Own tenant only | Cross-tenant |
| BLG-054 | Create + publish + verify public | POST + GET published | workflow | Published post visible | Admin JWT |
| BLG-055 | Blog post includes author field | GET | `/api/blog/published/:slug` | author in response | None |

---

**Total: 55 test cases (CMS 30 + Blog 25)**
