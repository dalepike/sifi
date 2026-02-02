---
title: "Interface Refresh: Release 1"
type: feat
date: 2026-02-01
status: ready-for-implementation
phases: 2
estimated_scope: medium
---

# Interface Refresh: Release 1

## Overview

A focused visual refresh of SiFi: new teal accent color, updated component styling, and refined navigation. Ship fast, iterate based on feedback.

**Goal:** Update the visual appearance without adding features or breaking existing workflows.

**Source Documents:**
- Design Prospectus: `docs/archive/2026-02-01-roadmap-consolidation/SiFi-Interface-Design-Prospectus.md`

---

## Problem Statement

The current interface works but looks generic. This refresh adds visual polish and brand identity through color and component updates.

**Not in scope:** New features, database migrations, or navigation restructuring.

---

## Technical Context

**Stack:** Next.js 16.1.6, React 19.2.4, Tailwind CSS v4.1.18, shadcn/ui, Lucide icons

**Key Files:**
| Purpose | Path |
|---------|------|
| Global CSS | `src/app/globals.css` |
| Mobile Nav | `src/components/nav/mobile-nav.tsx` |
| Button | `src/components/ui/button.tsx` |
| Card | `src/components/ui/card.tsx` |
| Location Tree | `src/components/locations/location-tree-node.tsx` |

---

## Implementation Phases

### Phase 1: Visual Update

**Scope:** Colors, cards, buttons, location tree styling

#### 1.1 Color Palette

Update CSS custom properties in `src/app/globals.css`.

**Dark Mode (Primary Focus):**
```css
.dark {
  --background: oklch(0.07 0.01 250);     /* #121214 */
  --card: oklch(0.12 0.01 250);           /* #1E1E22 */
  --muted: oklch(0.17 0.01 250);          /* #2A2A30 */
  --accent: oklch(0.72 0.12 185);         /* #5BC0BE - Teal */
  --accent-foreground: oklch(0.15 0.01 185);
}
```

**Light Mode (Stretch Goal):**
Light mode already works via next-themes. If time permits, refine the teal accent for better light mode contrast.

**Tasks:**
- [x] Update dark mode colors in globals.css
- [x] Update `--accent` to teal (#5BC0BE)
- [ ] Test contrast ratios meet WCAG AA (4.5:1)

#### 1.2 Card Styling

**Current:** `src/components/ui/card.tsx`
**Change:** Larger radius, subtle shadow, keep existing border behavior

```tsx
// Update Card base classes
"rounded-2xl bg-card text-card-foreground shadow-sm"
```

**Tasks:**
- [x] Update Card radius to `rounded-2xl` (16px)
- [x] Add `shadow-sm` for subtle depth
- [x] Update padding to 20px (`p-5`)

#### 1.3 Button Styles

**Current:** `src/components/ui/button.tsx`
**Change:** Add prominent CTA size, update accent colors

**Tasks:**
- [x] Add `lg` size variant (h-14 / 56px) for primary CTAs
- [x] Update hover/focus to use teal accent
- [x] Ensure touch targets are 44px minimum

#### 1.4 Location Tree

**Current:** `src/components/locations/location-tree-node.tsx`
**Change:** Visual tree lines, proper indentation

**Tasks:**
- [x] Add tree line styling (vertical/horizontal connectors via CSS)
- [x] Set indentation to 24px per level
- [x] Update active state to use accent color
- [x] Use Tailwind `transition-all duration-200` for expand/collapse

#### 1.5 Tag Pills

**Current:** `src/components/ui/badge.tsx`
**Change:** Category colors, rounded styling

**Tasks:**
- [x] Update badge styling for tags (more rounded, category colors)
- [x] Ensure text contrast on colored backgrounds

---

### Phase 2: Navigation and Polish

**Scope:** Navigation updates, QR scan styling, empty states, accessibility

#### 2.1 Navigation Update

**Keep existing navigation structure.** Activities, Tags, and Print Queue remain as top-level nav items. Users rely on these workflows.

**Changes:**
- Update "Locations" label to "Home"
- Add Scan to navigation (if not already present)
- Style with 64px height + safe area padding
- Update active indicator to use teal accent

**Tasks:**
- [x] Update nav item styling in `src/components/nav/mobile-nav.tsx`
- [x] Add safe area padding for iOS
- [x] Update active state to accent color

#### 2.2 Add Button

**Keep it simple.** The Add button navigates to `/add` with an optional `parent` query parameter.

```tsx
// Simple navigation, no context detection
<Link href={parentId ? `/add?parent=${parentId}` : "/add"}>
```

If no parent is provided, the add page shows a location picker. No modal, no context awareness needed.

**Tasks:**
- [x] Ensure Add page has parent picker when no parent param
- [x] Style Add page with new card/button styling

#### 2.3 QR Scan Screen

**Keep existing scanner.** Style updates only.

**Error States (3 only):**
1. Works - navigate to item
2. No camera permission - show "Open Settings" button
3. No QR detected - show "Looking for QR..." message

**Tasks:**
- [x] Style scan overlay with new colors
- [x] Simplify error handling to 3 states
- [x] Add haptic feedback on successful scan

#### 2.4 Empty States

**Inline, not a component.** Add empty state text directly where needed.

```tsx
// Example - inline empty state
{locations.length === 0 && (
  <div className="text-center py-12 text-muted-foreground">
    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
    <p className="mb-4">Add your first space to start organizing</p>
    <Button asChild><Link href="/add">Add Space</Link></Button>
  </div>
)}
```

**Tasks:**
- [x] Add inline empty state to Locations page
- [x] Add inline empty state to Search results
- [x] Add inline empty state to Print Queue

#### 2.5 Item Detail Sections

**Use shadcn Collapsible directly.** No custom component needed.

**Tasks:**
- [x] Wrap item detail sections in shadcn `Collapsible`
- [x] Default: Details open, others closed
- [x] Use Tailwind transitions

#### 2.6 Accessibility

**Tasks:**
- [x] Run axe-core scan, fix critical issues
- [x] Add aria-labels to icon-only buttons
- [x] Ensure focus states are visible
- [x] Verify 44px touch targets

---

## Acceptance Criteria

### Phase 1: Visual Update
- [ ] Teal accent (#5BC0BE) visible in buttons, links, active states
- [ ] Cards have 16px radius and subtle shadow
- [ ] Location tree shows visual hierarchy
- [ ] Dark mode looks polished

### Phase 2: Navigation and Polish
- [ ] Navigation styled with 64px height and safe area
- [ ] Empty states show helpful text and CTA
- [ ] QR scanner handles permission and no-detection states
- [ ] No accessibility critical issues from axe-core

---

## What's NOT in This Release

Deferred based on review feedback:

| Feature | Reason | When |
|---------|--------|------|
| Space Type Selector | Database migration for cosmetic feature | Release 2 |
| Light mode "equal polish" | Dark mode first, iterate later | If requested |
| Motion design system | Use Tailwind defaults | Not needed |
| Skeleton loading | Premature optimization | If slow |
| EmptyState component | Inline is simpler | If 3+ duplicates |
| Context-aware Add modal | Over-engineering | Not needed |
| Navigation restructuring | Would break existing workflows | Not planned |
| Onboarding overlay | Users will figure it out | Not needed |

---

## Migration Notes

**No breaking changes.** Navigation structure preserved. No database migrations.

**Visual changes only.** Colors, radius, shadows, spacing.

---

## References

- Design Prospectus: `docs/archive/2026-02-01-roadmap-consolidation/SiFi-Interface-Design-Prospectus.md`
- Lucide Icons: https://lucide.dev/icons
- shadcn/ui: https://ui.shadcn.com
