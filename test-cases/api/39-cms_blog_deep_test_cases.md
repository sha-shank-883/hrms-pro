# CMS & Blog Module — Deep API Test Cases (105 tests)

## 1.1 Blog Posts — 20 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| B1 | Create blog post (admin) | POST | `/api/blog` | `{ title, content, excerpt, status, featured_image }` | 201 | Post created |
| B2 | Create with missing title | POST | `/api/blog` | No title | 400 | Required |
| B3 | Create with missing content | POST | `/api/blog` | No content | 400 | Required |
| B4 | Create with duplicate title | POST | `/api/blog` | Same as B1 | 409 | Duplicate slug |
| B5 | Create without auth | POST | `/api/blog` | No token | 401 | Unauthorized |
| B6 | Create as employee | POST | `/api/blog` | Employee | 403 | Forbidden |
| B7 | Create with SQL injection in content | POST | `/api/blog` | `{ content: "'; DROP TABLE blog; --" }` | 201 | Sanitized |
| B8 | Create with XSS in content | POST | `/api/blog` | `{ content: "<script>alert(1)</script>" }` | 201 | HTML-encoded |
| B9 | Create with status=draft | POST | `/api/blog` | `{ status: "draft" }` | 201 | Draft saved |
| B10 | Create with status=published | POST | `/api/blog` | `{ status: "published" }` | 201 | Published |
| B11 | List published posts (public) | GET | `/api/blog/published` | No auth | 200 | Array, published only |
| B12 | List all posts (admin) | GET | `/api/blog` | Admin token | 200 | All including drafts |
| B13 | List with category filter | GET | `/api/blog?category=tech` | Valid auth | 200 | Filtered |
| B14 | List with tag filter | GET | `/api/blog?tag=javascript` | Valid auth | 200 | Filtered |
| B15 | List with search | GET | `/api/blog?search=React` | Valid auth | 200 | Searched |
| B16 | List pagination | GET | `/api/blog?page=1&limit=10` | Valid auth | 200 | Paginated |
| B17 | Get post by slug (public) | GET | `/api/blog/slug/:slug` | No auth | 200 | Public view |
| B18 | Get post by ID (admin) | GET | `/api/blog/:id` | Admin | 200 | Full content |
| B19 | Update blog post | PUT | `/api/blog/:id` | `{ title: "Updated" }` | 200 | Updated |
| B20 | Delete blog post | DELETE | `/api/blog/:id` | Admin | 200 | Deleted |

## 1.2 CMS Pages — 20 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| B21 | Create CMS page | POST | `/api/cms` | `{ title, slug, content, sections, layout }` | 201 | Page created |
| B22 | Create with missing slug | POST | `/api/cms` | No slug | 400 | Required |
| B23 | Create with duplicate slug | POST | `/api/cms` | Same as B21 | 409 | Duplicate slug |
| B24 | Create without auth | POST | `/api/cms` | No token | 401 | Unauthorized |
| B25 | Create as employee | POST | `/api/cms` | Employee | 403 | Forbidden |
| B26 | Create with SQL injection | POST | `/api/cms` | `{ title: "'; DROP TABLE cms; --" }` | 201 | Sanitized |
| B27 | Create with sections JSON | POST | `/api/cms` | `{ sections: [{ type: "hero", data: {} }] }` | 201 | Sections stored |
| B28 | Create with status=draft | POST | `/api/cms` | `{ status: "draft" }` | 201 | Draft |
| B29 | Create with status=published | POST | `/api/cms` | `{ status: "published" }` | 201 | Published |
| B30 | Get published page by slug (public) | GET | `/api/cms/:slug` | No auth | 200 | Public view |
| B31 | Get non-existent slug (public) | GET | `/api/cms/:slug` | `slug: "nonexistent"` | 404 | Not found |
| B32 | Get draft by slug as public | GET | `/api/cms/:slug` | Draft status | 404 | Not visible |
| B33 | Get draft by slug as admin | GET | `/api/cms/:slug` | Draft, admin token | 200 | Visible to admin |
| B34 | List all CMS pages (admin) | GET | `/api/cms` | Admin token | 200 | All pages |
| B35 | List published pages only (public) | GET | `/api/cms/published` | No auth | 200 | Published only |
| B36 | Update CMS page | PUT | `/api/cms/:id` | `{ title: "Updated" }` | 200 | Updated |
| B37 | Update sections | PUT | `/api/cms/:id` | `{ sections: [{ type: "new_section" }] }` | 200 | Sections updated |
| B38 | Publish CMS page | PUT | `/api/cms/:id/publish` | Admin | 200 | Published |
| B39 | Unpublish CMS page | PUT | `/api/cms/:id/unpublish` | Admin | 200 | Unpublished |
| B40 | Delete CMS page | DELETE | `/api/cms/:id` | Admin | 200 | Deleted |

## 1.3 Resources — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| B41 | Create resource | POST | `/api/resources` | `{ title, content, type, category }` | 201 | Created |
| B42 | Create with missing title | POST | `/api/resources` | No title | 400 | Required |
| B43 | Create with file attachment | POST | `/api/resources` | Multipart with file | 201 | File stored |
| B44 | Create without auth | POST | `/api/resources` | No token | 401 | Unauthorized |
| B45 | Create as employee | POST | `/api/resources` | Employee | 403 | Forbidden |
| B46 | List published resources (public) | GET | `/api/resources/published` | No auth | 200 | Public |
| B47 | List all resources (admin) | GET | `/api/resources` | Admin | 200 | All |
| B48 | List by category | GET | `/api/resources?category=guides` | Valid auth | 200 | Filtered |
| B49 | List by type | GET | `/api/resources?type=pdf` | Valid auth | 200 | By type |
| B50 | Get resource by slug (public) | GET | `/api/resources/slug/:slug` | No auth | 200 | Public |
| B51 | Update resource | PUT | `/api/resources/:id` | `{ title: "Updated" }` | 200 | Updated |
| B52 | Delete resource | DELETE | `/api/resources/:id` | Admin | 200 | Deleted |
| B53 | Download resource file | GET | `/api/resources/:id/download` | Valid auth | 200 | File |
| B54 | Download without auth | GET | `/api/resources/:id/download` | No token | 401 | Unauthorized |
| B55 | Resources pagination | GET | `/api/resources?page=1&limit=20` | Valid auth | 200 | Paginated |

## 1.4 Website Builder — 20 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| B56 | Create website page | POST | `/api/website/pages` | `{ title, slug, sections, layout }` | 201 | Page created |
| B57 | Reorder pages | PUT | `/api/website/pages/reorder` | `{ page_ids: [3,1,2] }` | 200 | Reordered |
| B58 | List website pages | GET | `/api/website/pages` | Admin | 200 | Array |
| B59 | Get published homepage | GET | `/api/website/homepage` | No auth | 200 | Homepage |
| B60 | Get published page (public) | GET | `/api/website/published/:slug` | No auth | 200 | Public |
| B61 | Upload media | POST | `/api/website/media` | Multipart image | 201 | Media uploaded |
| B62 | Upload media without auth | POST | `/api/website/media` | No token | 401 | Unauthorized |
| B63 | Upload invalid file type | POST | `/api/website/media` | `.exe` file | 400 | Invalid |
| B64 | List media | GET | `/api/website/media` | Admin | 200 | Array |
| B65 | Delete media | DELETE | `/api/website/media/:id` | Admin | 200 | Deleted |
| B66 | Get global settings (public) | GET | `/api/website/global-settings` | No auth | 200 | Public |
| B67 | Update global settings | PUT | `/api/website/global-settings` | `{ site_name, tagline }` | 200 | Updated |
| B68 | Update without auth | PUT | `/api/website/global-settings` | No token | 401 | Unauthorized |
| B69 | Update as employee | PUT | `/api/website/global-settings` | Employee | 403 | Forbidden |
| B70 | Update section content | PUT | `/api/website/pages/:id/sections/:sectionId` | `{ data: {...} }` | 200 | Section updated |
| B71 | Delete website page | DELETE | `/api/website/pages/:id` | Admin | 200 | Deleted |
| B72 | Create nested page (child) | POST | `/api/website/pages` | `{ parent_id: 1 }` | 201 | Child page |
| B73 | Get nav structure | GET | `/api/website/navigation` | No auth | 200 | Nav tree |
| B74 | Update navigation | PUT | `/api/website/navigation` | `{ items: [...] }` | 200 | Nav updated |
| B75 | Clone website page | POST | `/api/website/pages/:id/clone` | Admin | 201 | Cloned |

## 1.5 Authorization — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| B76 | Super admin full CRUD blog | ALL | Blog | Super admin | 200 | Full |
| B77 | Super admin full CRUD CMS | ALL | CMS | Super admin | 200 | Full |
| B78 | Super admin full CRUD website | ALL | Website | Super admin | 200 | Full |
| B79 | Admin can CRUD blog | ALL | Blog | Admin | 200 | Full |
| B80 | Admin cannot access super-admin features? | ALL | Website settings | Admin | 200/403 | Depends |
| B81 | Employee read-only published blog | GET | Blog published | Employee | 200 | Read |
| B82 | Employee cannot create blog | POST | Blog | Employee | 403 | Forbidden |
| B83 | Employee cannot update blog | PUT | Blog/:id | Employee | 403 | Forbidden |
| B84 | Employee cannot delete blog | DELETE | Blog/:id | Employee | 403 | Forbidden |
| B85 | Employee cannot access admin CMS | GET | CMS (all) | Employee | 403 | Forbidden |
| B86 | Public can view published only | GET | Published endpoints | No auth | 200 | Published |
| B87 | Public cannot view drafts | GET | Draft slug/ID | No auth | 404 | Not found |
| B88 | Public cannot create | POST | All | No auth | 401 | Unauthorized |
| B89 | Cross-tenant isolation | ALL | All | Wrong tenant | 403 | Blocked |
| B90 | SQL injection in slug | GET | `/api/cms/slug?slug=' UNION...` | Public | 200 | Sanitized |

## 1.6 Edge Cases — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| B91 | Blog with featured image upload | POST | Blog | With image | 201 | Image stored |
| B92 | Blog with very long title | POST | Blog | 500 chars | 400 | Too long |
| B93 | Blog with HTML in content | POST | Blog | HTML content | 201 | Sanitized/rendered |
| B94 | Blog slug generation from title | POST | Blog | Title → slug | 201 | Auto-slug |
| B95 | Duplicate slug auto-resolution | POST | Blog | Same title x2 | 409 | Or append -2 |
| B96 | CMS page with complex sections | POST | CMS | 20 sections | 201 | All stored |
| B97 | CMS page with empty sections | POST | CMS | `{ sections: [] }` | 201 | Empty OK |
| B98 | CMS page reorder validation | PUT | Reorder | Invalid IDs | 400 | Some not found |
| B99 | Media upload multiple files | POST | `/api/website/media/bulk` | Multiple files | 201 | All uploaded |
| B100 | Media with same filename | POST x2 | Media | Same filename | 201 both | Unique names |
| B101 | Website page with deep nesting | POST | Pages | Parent chain > 3 | 201 | Or limited |
| B102 | Website builder preview | GET | `/api/website/pages/:id/preview` | Admin | 200 | Preview renders |
| B103 | Blog with tags array | POST | Blog | `{ tags: ["react", "tutorial"] }` | 201 | Tags stored |
| B104 | Blog with SEO metadata | POST | Blog | `{ meta_title, meta_description }` | 201 | SEO fields |
| B105 | Blog scheduled publishing | POST | Blog | `{ published_at: "2025-06-01" }` | 201 | Scheduled |

Total: 20 + 20 + 15 + 20 + 15 + 15 = **105 tests**
