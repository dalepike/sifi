# Known Bugs

**Last Updated:** 2026-02-02

This document tracks known bugs and issues in SiFi.

---

## Open

*No open bugs.*

---

## Resolved

### BUG-001: Location/Container code badge invisible when selected

**Reported:** 2026-02-02
**Severity:** Minor (visual)
**Component:** `src/components/locations/location-tree-node.tsx:80-82`

**Description:**
Two-letter location codes display as white text on a dark (`bg-muted`) background in the main outline view. When a location is selected, the row receives a teal highlight (`bg-accent`), but the code badge retains its dark background, resulting in a black square where the code is not visible.

**Steps to Reproduce:**
1. Navigate to Locations
2. Click on any location in the tree view
3. Observe the two-letter code badge becomes unreadable

**Expected:** Code badge should remain readable when row is selected
**Actual:** Code appears as dark square, text not visible

**Affected Code:**
```tsx
<span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
  {location.code}
</span>
```

**Resolution:** Fixed 2026-02-02. Applied conditional styling based on `isSelected` prop:
```tsx
<span className={cn(
  "shrink-0 rounded px-1.5 py-0.5 text-xs font-mono",
  isSelected ? "bg-accent-foreground/20 text-accent-foreground" : "bg-muted"
)}>
  {location.code}
</span>
```
