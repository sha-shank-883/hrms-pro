---
name: ui-design
description: >
  Use when designing or reviewing UI layouts, styling, component spacing, typography,
  color systems, animations, and visual aesthetics for the frontend (React/Tailwind)
  and mobile (React Native) apps. Covers modern fintech/SaaS admin dashboard design,
  public marketing websites, landing pages, pricing pages, client-facing portals,
  and award-winning mobile app UI with premium spacing system, visually balanced
  layouts, elegant typography hierarchy, soft shadows, smooth micro animations,
  rounded components, clean onboarding flow, intuitive UX, modern glassmorphism
  effects, responsive mobile-first design, and polished app-store-ready aesthetics
  inspired by Stripe, Linear, and Apple design systems.
---

# UI Design System — HRMS Pro

## Design Philosophy
Modern fintech dashboard with professional spacing, generous padding, premium typography, balanced card layout, soft shadows, responsive sections, clean alignment, smooth animations, and polished SaaS aesthetics.

## Spacing System (8px Grid)
All spacing must follow: `0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80`.

| Context | Spacing | Notes |
|---|---|---|
| Card inner padding | `p-6` (24px) | Default for all cards |
| Card grid gap | `gap-6` (24px) | Consistent grid gap |
| Section top/bottom | `py-8` to `py-12` | Vertical breathing room |
| Form field stacks | `space-y-5` | Comfortable field spacing |
| Page edge padding | `px-6` to `px-8` | Generous page margins |
| Between sidebar/content | `gap-8` | Clear visual separation |

**Anti-patterns:** ❌ `p-2`, `p-3` on cards, ❌ `gap-1` on form stacks, ❌ mixed spacing off 8px grid, ❌ zero padding on containers.

## Typography
- **Font**: `Inter, system-ui, -apple-system, sans-serif`
- **Scale**: h1=`text-3xl`/bold, h2=`text-2xl`/semibold, h3=`text-lg`/semibold, body=`text-base`, secondary=`text-sm`, caption=`text-xs`, stat=`text-4xl`/bold, button=`text-sm`/semibold
- **Colors**: Primary=`text-gray-900`/`white`(dark), secondary=`text-gray-500`, caption=`text-gray-400`, links=`text-primary-600`
- **Anti-patterns:** ❌ `font-thin` for body, ❌ line-height below 1.4 for body, ❌ `text-justify`, ❌ >3 font sizes per page

## Color System
### Primary (Indigo)
```css
--color-primary-50: #eef2ff; --color-primary-100: #e0e7ff; --color-primary-200: #c7d2fe;
--color-primary-500: #6366f1; --color-primary-600: #4f46e5; --color-primary-700: #4338ca;
```

### Semantic Colors
| Token | Light | Dark | Usage |
|---|---|---|---|
| Success | `#10b981` | `#34d399` | Approved, active |
| Warning | `#f59e0b` | `#fbbf24` | Pending |
| Error | `#ef4444` | `#f87171` | Rejected |
| Info | `#3b82f6` | `#60a5fa` | Informational |

### Surfaces
- **Light**: page=`bg-gray-50`, card=`bg-white`, sidebar=`bg-white`, input=`bg-white`, overlay=`bg-black/40`
- **Dark**: page=`bg-gray-950`, card=`bg-gray-900`, sidebar=`bg-gray-900`, input=`bg-gray-800`, overlay=`bg-black/60`

### Principles
- Neutral grays keep focus on content; avoid saturated backgrounds
- Indigo primary, muted accents — never neon/toy-like colors
- True dark mode (gray-900 cards, gray-950 page), not inverted light
- Minimum 4.5:1 contrast ratio at all times (WCAG AA)
- Gradients only for hero sections / chart fills — 2-3 stop subtle blends

## Cards
```tsx
<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
```
- **Radius**: `rounded-2xl` (16px) for cards, buttons=`rounded-xl` (12px), inputs=`rounded-xl`, badges=`rounded-lg`, avatars=`rounded-full`
- **Shadows**: `shadow-xs` (stat cards), `shadow-sm` (default), `shadow-md` (dropdowns), `shadow-lg` (modals)
- Cards in a grid must use `h-full` for equal heights

## Buttons
- **Primary**: `px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-sm`
- **Secondary/Outline**: `px-6 py-3 border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50`
- **Ghost**: `px-4 py-2 text-gray-600 font-medium text-sm rounded-xl hover:bg-gray-100`
- **Sizes**: default=`px-6 py-3 text-sm` (40px), small=`px-4 py-2 text-xs` (32px), large=`px-8 py-4 text-base` (48px)

## Tables
- Header: `text-xs font-semibold text-gray-500 uppercase tracking-wider` on `bg-gray-50` row
- Cells: `px-6 py-4 text-sm`
- Row hover: `hover:bg-gray-50 transition-colors`
- Dividers: `divide-y divide-gray-100`

## Marketing Website Pages

### Hero Section
Must have: eyebrow tag → headline → subheadline → CTA buttons → social proof. Use `py-24 lg:py-32` with gradient background. Headline: `text-4xl sm:text-5xl lg:text-6xl font-bold`.

### Feature Grid
3-column grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`) with icon + title + description pattern. Cards use `p-8 rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5`.

### Pricing Table
3 tiers with featured tier highlighted (`border-2 border-primary-500`, `scale-105`, "Most Popular" badge). Each card: `p-8 rounded-2xl border-2`.

### Testimonials
Stars + quote + author avatar + name + role. 3-column grid on `bg-gray-50` background.

### CTA Section
Gradient background (`bg-gradient-to-br from-primary-600 to-primary-800`), headline + subtext + two buttons (white primary + ghost).

### FAQ
Accordion with chevron rotation. Rounded cards with `space-y-4`.

### Navigation
Sticky header with `bg-white/80 backdrop-blur-xl border-b`. Logo left, links center, CTAs right. Mobile hamburger menu.

### Footer
Brand column + link columns + awards bar + bottom bar with copyright and legal links. Dark background (`bg-gray-950`).

### Mobile-First Grid
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
```

### Section Structure Pattern
Every section: `py-24` vertical padding. Header: eyebrow label (`text-xs font-semibold text-primary-600 uppercase tracking-widest`) → h2 (`text-3xl sm:text-4xl font-bold`) → subtext → centered.

## Glassmorphism (Subtle)
```tsx
<div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-800/50 shadow-sm rounded-2xl p-6">
```
Use for sticky headers, mobile bottom nav, FABs only. NOT on content cards.

## Animations
- **Defaults**: `transition-all duration-200 ease-in-out`
- **Card hover**: `hover:-translate-y-0.5 hover:shadow-md`
- **Entry** (Framer Motion): `initial={{ opacity: 0, y: 12 }}` → `animate={{ opacity: 1, y: 0 }}`
- **Stagger**: `staggerChildren: 0.06` with `delayChildren: 0.1`
- **Skeleton loading**: `animate-pulse` with `rounded-lg` placeholders

## Loading & Error States
- **Loading**: Skeleton grid with `animate-pulse` matching card layout
- **Error**: Retry card with `AlertCircle` icon, message, and retry button
- **Empty**: Centered empty state with `Inbox` icon, title, description, CTA

## State Badges
```tsx
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400">
  <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
</span>
```
- Active/Approved: green, Pending: amber, Rejected/Error: red, Draft/Inactive: gray, Info: blue

## Layout Structure (Dashboard)
```
Header (sticky, blur backdrop) + Sidebar (fixed, w-64) + Main Content (flex-1, ml-64, p-6 lg:p-8)
```

## Modal/Dialog
Overlay `bg-black/40 backdrop-blur-sm` → modal card `max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-6` → header + body + footer with action buttons.

## Toast/Notification
Fixed top-right, `animate-slide-down`, `min-w-[320px] max-w-[420px]`, icon + title + message + close button.

## Tabs
`border-b border-gray-100` with active tab having `border-primary-600 text-primary-600` and inactive having `border-transparent text-gray-500`.

## Mobile App UI Patterns
- **Spacing tokens**: xs=4, sm=8, md=12, lg=16, xl=20, 2xl=24, 3xl=32, 4xl=40, 5xl=56
- **Typography**: h1=32px/700, h2=24px/700, h3=18px/600, body=16px/400, caption=12px/500
- **Cards**: `borderRadius: 16, padding: 20, borderWidth: 1`
- **Buttons**: Primary = `paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14`
- **Lists**: `paddingVertical: 14, paddingHorizontal: 20` with icon + title + subtitle + chevron
- **Bottom tabs**: 5 tabs, active icon in colored bg, inactive in muted
- **Glassmorphism**: iOS only with `backgroundColor: 'rgba(255,255,255,0.75)'`, Android fallback to solid
- **Entry animations**: `FadeInDown.delay(index * 80).springify()` for staggered lists
- **Onboarding**: Skip button top-right, illustration, title, description, pagination dots, CTA button
