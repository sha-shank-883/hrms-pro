# HRMS Pro — Advanced Dynamic Website Builder & CMS

This document outlines the architecture, database schema, API contracts, theme tokens, and content label dictionary system powering the HRMS Pro dynamic website.

---

## 1. Overview & Key Capabilities

The HRMS Pro marketing and public website is **100% dynamic**, driven entirely by PostgreSQL tables in the `shared` database schema. Super Admins and Admins can manage everything via the supercharged **Website Builder** UI at `/website-builder`.

### Key Features:
1. **Pages & SEO Management**: Create, edit, publish/draft, and delete pages with custom URL slugs, SEO metadata (meta title, description), and homepage flags.
2. **Visual Section Form Builder**: Sequentially order 20+ built-in section types (`hero`, `features`, `pricing`, `testimonials`, `faq`, `stats`, `team`, `gallery`, `contact_form`, `video`, `logos`, `timeline`, `banner`, `custom_html`). Each section type has structured form fields for headline, subtitle, buttons, image pickers, and dynamic item cards.
3. **Header Navigation Links Builder**: Visually add, edit, reorder, and remove navbar links and mega-menu items directly from the dashboard.
4. **Footer Columns Builder**: Visually organize footer categories and target links.
5. **Preset Design Themes & Parameter Tokens**: Switch between 6 curated preset design themes (`Indigo Pro`, `Emerald Growth`, `Ocean Trust`, `Midnight Luxe`, `Minimal Stone`, `Sunset Energy`) or customize CSS variables (`--colors-primary`, `--radii-radius-md`, `--colors-page-bg`, `--typography-font-family`, etc.) directly on `:root`.
6. **Content Labels Dictionary**: Edit **every single word** on the website from a central dictionary table grouped by namespaces (`nav`, `hero`, `features`, `pricing`, `about`, `contact`, `footer`, `cta`, `auth`, `common`).
7. **Media Asset Management**: Upload, store, and manage images, videos, and PDFs for website section assets.

---

## 2. Database Schema

Tables located in PostgreSQL `shared` schema:

### `shared.website_themes`
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | Unique ID |
| `name` | VARCHAR(100) | Theme display name |
| `slug` | VARCHAR(100) UNIQUE | Unique slug identifier |
| `parameters` | JSONB | Theme design tokens (colors, radii, typography, spacing, mode) |
| `is_active` | BOOLEAN | Singleton active theme indicator |
| `is_system` | BOOLEAN | Indicates system preset theme |

### `shared.website_labels`
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | Unique ID |
| `namespace` | VARCHAR(100) | Group namespace (`nav`, `hero`, `features`, `pricing`, etc.) |
| `label_key` | VARCHAR(255) | Unique key within namespace |
| `label_value` | TEXT | Editable string value |
| `description` | TEXT | Context description |

### `shared.website_global_settings`
| Column | Type | Description |
|---|---|---|
| `company_name` | VARCHAR(255) | Dynamic site branding title |
| `header_config` | JSONB | Dynamic array of header navigation links |
| `footer_config` | JSONB | Dynamic array of footer columns and links |
| `primary_color` | VARCHAR(50) | Custom primary accent hex color |

---

## 3. Public & Admin API Contracts

### Public Endpoints (No Auth Required)
- `GET /api/website/themes/active` — Active theme parameters & CSS token map.
- `GET /api/website/labels/public` — Key-value dictionary object of all content labels.
- `GET /api/website/pages/home` — Dynamic homepage data and section sequence.
- `GET /api/website/pages/public/:slug` — Published page data by slug.
- `GET /api/website/global-settings/public` — Global company settings (company name, logo, header_links, footer_columns).

### Admin Endpoints (`protect` + `authorize('admin', 'superadmin')`)
- `GET/POST/PUT/DELETE /api/website/pages` — Manage custom pages & SEO.
- `GET/POST/PUT/DELETE /api/website/pages/:pageId/sections` — Manage section sequence & visual settings.
- `GET/POST /api/website/themes` — Manage design themes.
- `POST /api/website/themes/:id/activate` — Set active theme across the website.
- `GET/POST /api/website/labels` & `POST /api/website/labels/bulk` — Edit content dictionary.
- `PUT /api/website/global-settings` — Save header, footer, branding & custom CSS.
- `POST /api/website/media/upload` — Upload media assets.
