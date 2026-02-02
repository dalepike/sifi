---
title: "feat: Drill-Down Navigation with Breadcrumb"
type: feat
date: 2026-02-02
priority: high
status: planned
revised: 2026-02-02
revision_note: Simplified based on DHH, Kieran, and Simplicity reviews
---

# Drill-Down Navigation with Breadcrumb

## Overview

Make the existing location detail view work as a mobile-first drill-down navigation that supports 6-8 levels of hierarchy. Hide the tree sidebar on mobile, keep the content list, add a scrolling breadcrumb.

**Key drivers:**
- Current tree indentation doesn't scale beyond 2-3 levels on mobile
- Users need unlimited nesting (Home → Room → Closet → Shelf → Box → Item)
- Primary access is QR scan and search; browsing is secondary but necessary

## Problem Statement

The `LocationTree` component uses left indentation (`depth * 24px`). At 6+ levels, this consumes most mobile screen width. The tree works on desktop but fails on mobile.

## Proposed Solution

**Modify existing components instead of creating new ones:**

1. Hide tree sidebar on mobile (CSS media query)
2. The existing `/locations/[id]` page becomes the drill-down view
3. Make breadcrumb horizontally scrollable for long paths
4. Tap location/container → navigate to that page (already works via links)
5. Browser back button works (URL-based navigation)

### What Users See on Mobile

```
┌─────────────────────────────────────┐
│ 🏠 > Garage > Shelf A > Box 1  →   │  ← Scrolls horizontally
├─────────────────────────────────────┤
│                                     │
│  📍 Compartment 1              >    │  ← Tap to drill in
│  📍 Compartment 2              >    │
│  📦 Small Parts Bin            >    │  ← Container
│  🔨 Hammer                          │  ← Object (detail page)
│  🪛 Screwdrivers                    │
│                                     │
│         [ + Add Item ]              │
└─────────────────────────────────────┘
```

### What Users See on Desktop

Same as today: tree sidebar on left, detail panel on right. No changes needed.

### Breadcrumb Strategy

**Simple approach: horizontal scrolling.**

At 8 levels, the breadcrumb gets long. User swipes/scrolls left to see earlier segments. No JavaScript collapse logic needed.

```css
.breadcrumb-container {
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
}
```

If this feels bad in practice, we can add a collapsible dropdown later.

## Technical Approach

### No New Components

Instead of creating 5 new components, modify 2 existing ones:

| Component | Change |
|-----------|--------|
| `LocationBrowser` | Hide tree on mobile: `className="hidden lg:block"` |
| `LocationDetailView` | Make it full-width when tree is hidden |
| `LocationBreadcrumb` | Add `overflow-x-auto` wrapper |

### URL Structure (Unchanged)

```
/locations           → Root level (shows all root locations)
/locations/[id]      → Location detail (shows children) ← THIS IS ALREADY DRILL-DOWN
/items/[id]          → Item detail (shows container contents if applicable)
```

The existing URL structure already supports drill-down. Each location page shows its children. Tapping a child navigates to `/locations/[child-id]`.

### Layout Changes

**Current desktop layout:**
```
┌──────────────┬─────────────────────┐
│   Tree       │   Detail Panel      │
│   Sidebar    │   (LocationDetail)  │
│   (300px)    │                     │
└──────────────┴─────────────────────┘
```

**Mobile layout (after change):**
```
┌─────────────────────────────────────┐
│   Breadcrumb (scrollable)           │
├─────────────────────────────────────┤
│                                     │
│   Detail Panel (full width)         │
│   - Sub-locations list              │
│   - Items list                      │
│                                     │
└─────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Mobile Drill-Down Layout
**Complexity: Low** | **Effort: 1 day**

- [ ] Add `hidden lg:block` to tree sidebar in `LocationBrowser`
- [ ] Make detail panel full-width on mobile (`lg:col-span-1` → responsive)
- [ ] Add `overflow-x-auto` wrapper to `LocationBreadcrumb`
- [ ] Test navigation flow on mobile viewport
- [ ] Ensure "Add" buttons work without tree context

**Files:**
- `src/components/locations/location-browser.tsx` (layout classes)
- `src/components/locations/location-breadcrumb.tsx` (overflow wrapper)
- `src/app/(app)/locations/[id]/location-detail-view.tsx` (full-width on mobile)

### Phase 2: Container Navigation Polish
**Complexity: Low** | **Effort: 0.5 days**

- [ ] Ensure tapping container in item list navigates to container detail
- [ ] Container detail page shows nested items (already works)
- [ ] Breadcrumb shows location path + container path (existing `ItemBreadcrumb`)
- [ ] Verify circular reference prevention in move dialogs (already implemented)

**Files:**
- `src/app/(app)/items/[id]/item-detail-view.tsx` (verify container content display)
- `src/components/items/item-breadcrumb.tsx` (add overflow-x-auto if needed)

---

## What We're NOT Doing (YAGNI)

| Skipped | Reason |
|---------|--------|
| `DrillDownView` component | Existing `LocationDetailView` already does this |
| `DrillDownList` component | Existing item lists work |
| `DrillDownItem` component | Existing row components work |
| `CollapsibleBreadcrumb` | Horizontal scroll is simpler; add collapse later if needed |
| `DrillDownPicker` | Move dialogs work as-is; extract only if third use case appears |
| `/items/[id]/contents` route | Item detail page already shows contents |
| Desktop/mobile toggle | CSS media query is automatic |
| Animations | Polish later if users want it |

---

## Acceptance Criteria

### Functional Requirements

- [ ] User can drill into locations up to 8 levels deep on mobile
- [ ] User can drill into containers nested within containers
- [ ] Breadcrumb shows full path (scrollable on mobile)
- [ ] Tapping breadcrumb segment navigates to that level
- [ ] Browser back button works
- [ ] Tree view still works on desktop (lg breakpoint+)
- [ ] Move operations work at any depth (existing functionality)

### Non-Functional Requirements

- [ ] No new JavaScript for breadcrumb overflow (CSS only)
- [ ] Touch targets minimum 44px height
- [ ] Works on 320px width screens

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Drill into empty location | Show existing empty state with "Add" buttons |
| 8-level path on 320px | Breadcrumb scrolls horizontally |
| Move container into its own child | Already prevented by existing backend validation |
| QR scan lands at level 6 | Item detail shows breadcrumb, tap to navigate |
| Delete location while viewing | Existing redirect/404 handling works |

---

## Future Enhancements (If Needed)

These are explicitly deferred. Add only if users report problems:

- **Collapsible breadcrumb**: If horizontal scrolling feels awkward
- **Animations**: Fade/slide transitions between levels
- **Keyboard navigation**: Tab/Enter/Escape for desktop users
- **DrillDownPicker**: Extract if a third component needs drill-down UI

---

## Schema

No changes. Existing schema supports unlimited hierarchy:

- `locations.parent_id` → self-referential for location nesting
- `items.parent_item_id` → self-referential for container nesting

---

## References

- Tree implementation: `src/components/locations/location-tree.tsx`
- Breadcrumb: `src/components/locations/location-breadcrumb.tsx`
- Location detail: `src/app/(app)/locations/[id]/location-detail-view.tsx`
- Move dialog: `src/components/items/move-item-dialog.tsx`

### Review Sources
- DHH review: Cut to 2 phases, modify existing components
- Kieran review: Type safety concerns (addressed by not creating new types)
- Simplicity review: 50% reduction by reusing existing code
