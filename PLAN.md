# PLAN — Fully Dynamic Website (Admin-Controlled Pages, Content & Design)

## Feasibility

**YES — 100% possible.** The backend infrastructure already exists (~80% of the plumbing).
What's missing is: (1) an admin UI to manage it, (2) a theme/design-parameter system,
(3) a content-labels system ("every word editable"), and (4) wiring the public site to
render dynamic data instead of hardcoded components.

---

## 1. What Already Exists (Reuse — don't rebuild)

| Piece | Location | Status |
|---|---|---|
| Pages CRUD | `websiteController.js` (getAllPages, createPage, updatePage, deletePage, getPublishedPage, getHomepage) | ✅ Done |
| Sections CRUD | `websiteController.js` (addSection, updateSection, reorderSections, deleteSection, getSections) | ✅ Done |
| Global settings CRUD | `websiteController.js` (getGlobalSettings, updateGlobalSettings, getPublicGlobalSettings) | ✅ Done |
| Media library | `websiteController.js` (uploadMedia, getAllMedia, deleteMedia) | ✅ Done |
| Tables | `shared.website_pages`, `shared.website_sections`, `shared.website_media`, `shared.website_global_settings` | ✅ Done |
| Section renderer | `frontend/src/components/common/SectionRendererV2.jsx` (hero, features, pricing, testimonials, faq, stats, team, gallery, tabs, blog_posts, contact_form, video, logos, timeline, banner, custom_html…) | ✅ Done (unused) |
| Global settings loader | `frontend/src/contexts/WebsiteBuilderContext.jsx` (loads colors/fonts/theme, injects custom CSS) | ✅ Done (partially wired) |
| Protected routes | `websiteRoutes.js` — all admin routes behind `protect` + `authorize('admin','superadmin')` | ✅ Done |
| Demo settings | `websiteSettingsController.js` (legacy fallback) | ✅ Done |

## 2. What's Missing (The actual work)

| Gap | Impact |
|---|---|
| ❌ No Super Admin UI to manage pages/sections/themes | Admin can't use the existing API |
| ❌ `SectionRendererV2` never imported by any page | Public site ignores all dynamic data |
| ❌ `Home.jsx` / `Features.jsx` / `Pricing.jsx` etc. are hardcoded JSX | Content is not editable |
| ❌ `PublicLayout.jsx` header/nav/footer hardcoded | Nav links & footer not editable |
| ❌ No theme presets / design-parameter table | Only 2 colors + font + light/dark |
| ❌ No labels dictionary (i18n) | "Each single word" can't be changed |
| ❌ No caching layer for public pages | Per-request DB hit on every pageview |
| ❌ No schema for themes/params/labels | DB work required |

---

## 3. Architecture — How a Dynamic Page Will Flow

```
Super Admin UI (frontend)
   │  manages
   ▼
shared.website_pages  →  shared.website_sections (JSONB settings)
shared.website_themes  →  theme params (colors, fonts, radii, shadows, spacing)
shared.website_labels   →  every word/string on the site (key → value)
shared.website_global_settings
   │
   ▼  public API (no auth, tenant-scoped, cached)
GET /api/website/pages/home           → homepage + sections
GET /api/website/pages/public/:slug   → any published page + sections
GET /api/website/global-settings/public → theme + colors + fonts
GET /api/website/labels/public        → all editable words
   │
   ▼
Public React site (marketing)
  PublicLayout.jsx          → dynamic header/nav/footer from settings + labels
  DynamicPage.jsx           → generic route: renders page.sections via SectionRendererV2
  WebsiteBuilderContext     → holds theme, labels, global settings (single fetch bundle)
  <style> CSS vars          → injected from theme parameters (designSystem.js pattern)
```

**Key design principle:** 1 dynamic route `/:slug` (for custom pages) + fixed routes for
home/features/pricing/etc. that read from the SAME data source. Hardcoded fallbacks keep
the site working even when no admin content exists yet.

---

## 4. Phases (Execution Order)

### Phase 1 — Database: Themes, Labels, and Extended Settings
**Files:** new migration `backend/src/scripts/create_dynamic_website_tables.js`

1. Create `shared.website_themes`:
   - `id, name, slug, is_active, parameters JSONB, is_system, created_at, updated_at`
   - `parameters` holds the full design-token set (see §5)
2. Create `shared.website_labels`:
   - `id, namespace, label_key, label_value, description, created_at, updated_at`
   - `UNIQUE(namespace, label_key)`; seed ~400 keys for every current hardcoded string
3. `ALTER shared.website_global_settings` add:
   - `active_theme_id`, `theme_mode_auto BOOLEAN`, `content_dictionary_enabled BOOLEAN`
   - `favicon_url`, `primary_gradient` (if missing)
4. Seed **at least 6 preset themes** (§5) + labels for all public-site strings.
5. Migration must be idempotent (`CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO NOTHING`).

### Phase 2 — Backend: Themes & Labels API
**Files:** `websiteThemeController.js`, `websiteLabelController.js`, routes in `websiteRoutes.js`

- **Admin routes** (protect + superadmin):
  - `GET/POST /api/website/themes`, `PUT/DELETE /api/website/themes/:id`, `POST /api/website/themes/:id/activate`
  - `GET/POST /api/website/labels`, `PUT /api/website/labels/:id`, `POST /api/website/labels/bulk`, `DELETE /api/website/labels/:id`
- **Public routes** (no auth, tenant-scoped to `shared`, cached):
  - `GET /api/website/themes/active` → active theme parameters
  - `GET /api/website/labels/public` → `{ key: value }` map
- All queries parameterized (`$1…`), JSONB parameters validated against a schema allowlist,
  slug uniqueness enforced, `is_active` singleton enforced (only one active theme).

### Phase 3 — Super Admin Website Builder UI
**Files:** `frontend/src/pages/superadmin/WebsiteBuilder/` (new dir), route `super-admin/website`

One page with 4 tabs:
1. **Pages** — list/create/edit/delete pages; set homepage; publish toggle; per-page SEO + custom CSS/JS.
2. **Sections** — per-page section builder: add from 20+ types, edit JSONB settings via structured forms, reorder (drag), show/hide.
3. **Themes** — pick a preset theme (thumbnails + live preview), edit design parameters (color pickers, font select, radius/shadow sliders), duplicate/customize, activate.
4. **Content / Labels** — searchable dictionary grid: namespace + key + value + description; bulk save; "changed" highlight.
5. **Media** — upload library integrated into section image pickers.

- Add to `Layout` sidebar nav (visible to superadmin only) + `App.jsx` protected route.
- Reuse `hasAccess`/role gating; every mutation calls the admin API then refreshes context.

### Phase 4 — Wire Public Site to Dynamic Data
**Files:** `DynamicPage.jsx`, edits to `PublicLayout.jsx`, `App.jsx`, `WebsiteBuilderContext.jsx`, `Home.jsx` (and optionally Features/Pricing/About)

1. **`WebsiteBuilderContext` upgrade** — fetch one public bundle:
   `global-settings + active theme parameters + labels`. Inject theme parameters as CSS vars
   on `:root` (reuse `applyDesignSettings`-style logic from `utils/designSystem.js`).
   Provide `t(key)` translate function for labels.
2. **`PublicLayout.jsx`** — header nav links, CTA labels, logo, footer columns, social links,
   contact info, copyright, and the "every word" strings all read from labels/settings,
   with the existing hardcoded data as fallback defaults.
3. **`DynamicPage.jsx`** — generic component:
   - fetches page by slug from public API
   - renders `<SEO meta>` from page.meta_*
   - renders each section via `SectionRendererV2`
   - shows a styled 404 when unpublished/not found
4. **Routes in `App.jsx`**:
   - `/` → DynamicPage (homepage from API; fallback to existing `Home.jsx` when no CMS data)
   - `/features`, `/pricing`, `/about`, `/contact`, `/resources`, `/faq` → DynamicPage first,
     fallback to existing hardcoded page if no published CMS page
   - `/:slug` catch-all for custom pages (before `*` NotFound)
5. **SSR-safe**: keep client-side fetch (SPA), skeleton loaders via `animate-pulse`.

### Phase 5 — Performance & Caching
- Public website endpoints: in-memory cache (e.g., `node-cache`) with TTL ~60s, invalidated
  on admin write (bump `site_version` counter; frontend refetches when version changes).
- `SectionRendererV2`: memoize sections; lazy-load below-fold images.
- Bundle: keep marketing pages code-split (already lazy where possible).

### Phase 6 — Security (security-audit skill)
- All admin website routes: `protect` + `authorize('admin','superadmin')` (already in place — verify).
- Labels/section settings stored as JSONB → validate schema server-side (allowlist of keys).
- XSS: `custom_html` and `content` section types render HTML → sanitize with DOMPurify on the
  client; escape plain text fields. `dangerouslySetInnerHTML` only after sanitize.
- Rate limiting already global (1000/15min); public endpoints are read-only.
- Parameterized queries only; no string concat.
- Verify a non-superadmin (manager/employee) gets 403 on all `/api/website/*` writes.

### Phase 7 — Documentation & Test Cases (AGENTS.md golden rule)
- Add test cases to `TEST_PLAN.md` (Phase: Dynamic Website).
- Add a `DYNAMIC_WEBSITE.md` doc: how to add a theme, edit labels, build a page.
- Update `BACKEND_API_ENDPOINTS_SUMMARY.md` with the new endpoints.

---

## 5. Design Theme System (Presets + Parameters) — "set design themes and parameters"

### Preset themes (min 6, seed in Phase 1)
1. **Indigo Pro** (current look — indigo/purple, Inter, rounded-2xl, soft shadows)
2. **Emerald Growth** (emerald primary, dark sidebar, bold stat cards)
3. **Ocean Trust** (blue/cyan, rounded-xl, tighter spacing — enterprise/finance)
4. **Midnight Luxe** (near-black + gold accents, glassmorphism, serif display font)
5. **Minimal Stone** (monochrome gray, sharp corners, hairline borders — SaaS-minimal)
6. **Sunset Energy** (orange/rose gradient CTA, warm neutrals, playful radii)

### Theme parameters (each theme carries ALL of these in `parameters JSONB`)
| Group | Parameters |
|---|---|
| **Colors** | primary, primary_hover, secondary, accent, success, warning, danger, info, page_bg, card_bg, text_primary, text_secondary, text_muted, border, sidebar_bg, header_bg, primary_gradient (CSS string) |
| **Typography** | font_family, font_display, font_size_base, heading_weight, body_line_height, letter_spacing |
| **Radii** | radius_sm, radius_md, radius_lg (px) |
| **Shadows** | shadow_card, shadow_hover, shadow_modal |
| **Spacing** | spacing_unit, section_padding_y, card_padding, grid_gap |
| **Mode** | theme_mode (light/dark), glassmorphism_enabled (bool), layout_width (boxed/full) |
| **Branding** | logo_url, favicon_url, announcement_bar JSON, cookie_consent JSON |

Frontend maps each parameter → CSS variable (e.g., `--color-primary`, `--radius-lg`)
on `:root`, so every component using Tailwind theme colors / design tokens updates instantly.
Admin theme editor = form over this JSON with validation; duplicate-as-custom + activate.

---

## 6. Content Labels System — "each single word editable"

- `shared.website_labels` with `namespace + label_key → value`.
- Namespaces: `nav`, `hero`, `features`, `pricing`, `about`, `contact`, `footer`, `cta`,
  `demo`, `blog`, `faq`, `compare`, `auth`, `common`.
- `WebsiteBuilderContext` loads the full map; `t('nav.sign_in')` returns the admin-set string.
- Every hardcoded string in `PublicLayout`, `Home`, `Features`, `Pricing`, `About`, etc.
  gets converted to `t('...')` with the current hardcoded text as the seed/default value.
- Admin "Content" tab = searchable grid; bulk update; instant preview.

---

## 7. Agent / Skill Usage (AGENTS.md — every task phase)

| Phase | Skills (auto-loaded) | What they enforce |
|---|---|---|
| 1 DB schema | `database-design`, `code-quality` | snake_case, JSONB, indexes, idempotent migrations |
| 2 Backend API | `backend-architecture`, `security-audit`, `code-quality` | route→controller→query, `{success,data}`, validation, tenant scope, parameterized SQL |
| 3 Admin UI | `ui-design`, `code-quality` | 8px spacing grid, cards `p-6 rounded-2xl`, indigo theme, tables, modals, dark mode |
| 4 Public wiring | `ui-design`, `code-quality` | section spacing, skeleton loaders, responsive, accessibility |
| 5 Performance | `performance-optimization` | caching, memoization, bundle splitting |
| 6 Security | `security-audit` | auth, sanitize HTML (DOMPurify), XSS, allowlist validation |
| 7 Tests/docs | `testing-protocol`, `deploy` | TEST_PLAN entries, endpoint tests via PowerShell, no secrets |
| All | `code-quality` (always) | lint, logging, status codes, no dead code |

---

## 8. Test Plan (added to TEST_PLAN.md — summary)

**Backend**
- CRUD pages/sections/themes/labels (happy path + validation + 404s)
- Auth: unauthenticated → 401; manager/employee on admin routes → 403
- Public endpoints return data without token; theme singleton; slug uniqueness
- XSS payload stored as literal; `custom_html` sanitized client-side
- Cache invalidation after theme/label write

**Frontend**
- Admin builder: create page → add sections → reorder → publish → appears on public site
- Theme switch: activate preset → colors/fonts/radii change on public site instantly
- Labels: change a word → site reflects it; missing key falls back to default
- DynamicPage renders all 20+ section types; unpublished slug → styled 404
- Responsive: builder + public site at mobile widths; dark mode

**Manual acceptance checklist (from AGENTS.md)**
- [ ] Lint passes (`npm run lint`)
- [ ] Backend typecheck/build passes
- [ ] No secrets committed
- [ ] Public site works even with empty CMS DB (fallbacks)
- [ ] Non-admin cannot mutate any website content

---

## 9. File Manifest (create/modify)

**Backend**
- `backend/src/scripts/create_dynamic_website_tables.js` (new migration + seeds)
- `backend/src/controllers/websiteThemeController.js` (new)
- `backend/src/controllers/websiteLabelController.js` (new)
- `backend/src/routes/websiteRoutes.js` (add theme + label routes)
- `backend/src/server.js` (mount new routes if needed)

**Frontend**
- `frontend/src/pages/superadmin/WebsiteBuilder/` (Pages, Sections, Themes, Labels, Media tabs — new)
- `frontend/src/pages/marketing/DynamicPage.jsx` (new)
- `frontend/src/contexts/WebsiteBuilderContext.jsx` (upgrade: bundle + labels + theme CSS vars)
- `frontend/src/components/layout/PublicLayout.jsx` (dynamic nav/footer/labels)
- `frontend/src/App.jsx` (dynamic routes + superadmin route)
- `frontend/src/services/api.js` or new `frontend/src/services/website.js` (API client methods)

**Docs**
- `TEST_PLAN.md`, `TEST_ERRORS.md`, `BACKEND_API_ENDPOINTS_SUMMARY.md`, `DYNAMIC_WEBSITE.md` (new)

---

## 10. Rollout Order (recommended sprint plan)

1. **Sprint 1** — Phase 1 (DB + seeds) + Phase 2 (backend API) → test with PowerShell/psql
2. **Sprint 2** — Phase 3 (Super Admin builder UI: Pages + Sections + Themes + Labels + Media)
3. **Sprint 3** — Phase 4 (public site wiring: DynamicPage, PublicLayout, routes, context)
4. **Sprint 4** — Phase 5 (cache) + Phase 6 (security) + Phase 7 (tests + docs + demo)

Estimate: ~2–3 weeks of focused work using the skills/agents for each phase.
