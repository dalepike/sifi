# Plan: Move Functionality, QR Codes, and Scanning

## Overview

Implement three interconnected features to complete the core item management workflow:
1. Move items between locations/containers
2. Display QR codes on item pages
3. QR scanning to navigate to items

---

## Feature 1: Move Functionality

### Goal
Allow users to move items (containers or objects) to a new parent location or container from the item detail page.

### User Flow
1. User views item detail page (`/items/[id]`)
2. User clicks "Move" button
3. Dialog opens with location/container browser
4. User navigates hierarchy or searches to find destination
5. User selects new parent (location or container)
6. System validates move (no circular references, containers only accept items)
7. If location prefix changes, warn about label mismatch
8. Item is moved, page refreshes with updated location path

### Implementation

#### UI Components

**New: `MoveItemDialog` component**
- Location: `src/components/items/move-item-dialog.tsx`
- Props: `itemId`, `currentParent`, `open`, `onOpenChange`, `onSuccess`
- Features:
  - Tabbed interface: "Locations" | "Containers"
  - Hierarchical browser showing locations tree
  - Search input to find locations/containers by name
  - Breadcrumb showing current selection path
  - "Move Here" button to confirm
  - Warning banner if move changes location prefix

**Update: `ItemDetails` component**
- Add "Move" button to action buttons
- Import and render `MoveItemDialog`

#### Backend (already exists)
- `moveItem` action in `src/actions/items.ts` ✅
- `dbMoveItem` in `src/lib/db/items.ts` ✅

#### New Action Needed
- `getContainers(userId)` - Get all containers for move target selection
- Or reuse existing location/item queries with filtering

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/items/move-item-dialog.tsx` | Create |
| `src/components/items/item-details.tsx` | Add Move button |
| `src/actions/items.ts` | Add `getContainersForMove` if needed |

---

## Feature 2: QR Code Display

### Goal
Display the QR code on item detail pages so users can print labels or scan the code.

### User Flow
1. User views item detail page
2. QR code is prominently displayed showing the item's UUID
3. Human-readable code shown below QR code
4. "Print Label" button to generate PDF label
5. Optional: "Copy ID" button to copy UUID

### Implementation

#### QR Code Generation
- Use `qrcode` package (or similar) to generate QR codes client-side
- Encode the item's UUID in the QR code
- Display as SVG for crisp rendering at any size

#### UI Components

**New: `ItemQRCode` component**
- Location: `src/components/items/item-qr-code.tsx`
- Props: `itemId`, `humanReadableCode`
- Features:
  - QR code SVG (128x128 default, configurable)
  - Human-readable code text below
  - Copy UUID button
  - Print label button (links to existing PDF functionality)

**Update: `ItemDetails` component**
- Add QR code section
- Import and render `ItemQRCode`

**Update: Item detail page `/items/[id]/page.tsx`**
- Ensure full item info is displayed (may need to check current implementation)

#### Dependencies
- Install: `bun add qrcode @types/qrcode`

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/items/item-qr-code.tsx` | Create |
| `src/components/items/item-details.tsx` | Add QR code section |
| `package.json` | Add qrcode dependency |

---

## Feature 3: QR Scanning Workflow

### Goal
Allow users to scan a QR code and navigate directly to the item's detail page.

### User Flow
1. User taps scan button in navigation (already exists)
2. Camera opens with QR scanner overlay
3. User scans QR code on a label
4. System decodes UUID from QR code
5. If item exists: navigate to `/items/[uuid]`
6. If item not found: show "Item not found" with option to create new item with that UUID

### Implementation

#### Existing Components
- `QRScanner` component at `src/components/scanner/qr-scanner.tsx` ✅
- `ScanButton` in navigation ✅
- Scan page at `/scan` ✅

#### Review & Update Scan Page
- Check current `/scan/page.tsx` implementation
- Ensure it uses QRScanner component properly
- Handle scan result: extract UUID, navigate to item
- Handle unknown UUID: offer to create item

#### Scan Result Page
- `/scan/[uuid]/page.tsx` already exists
- Review and update to handle:
  - Item found → show item details or redirect
  - Item not found → show create option

### Files to Review/Modify

| File | Action |
|------|--------|
| `src/app/(app)/scan/page.tsx` | Review, update scanning logic |
| `src/app/(app)/scan/[uuid]/page.tsx` | Review, handle found/not-found |
| `src/components/scanner/qr-scanner.tsx` | Review, ensure working |

---

## Implementation Order

### Phase 1: Move Functionality
1. Create `MoveItemDialog` component
2. Add Move button to `ItemDetails`
3. Test moving items between locations and containers
4. Test warning when location prefix changes

### Phase 2: QR Code Display
1. Install qrcode package
2. Create `ItemQRCode` component
3. Add QR code section to item details
4. Test QR code generation and display
5. Verify print label integration

### Phase 3: QR Scanning
1. Review existing scan components
2. Update scan page with proper camera/scanner UI
3. Implement scan result handling
4. Test full scan → view item flow
5. Test scan unknown code → create item flow

---

## Testing Checklist

### Move Functionality
- [ ] Move object from location to different location
- [ ] Move object from location to container
- [ ] Move object from container to location
- [ ] Move object from container to different container
- [ ] Move container (with contents) to new location
- [ ] Attempt to move item into itself (should fail)
- [ ] Attempt to move container into its own descendant (should fail)
- [ ] Verify warning appears when location prefix changes

### QR Code Display
- [ ] QR code displays on item detail page
- [ ] QR code encodes correct UUID
- [ ] Human-readable code displays correctly
- [ ] QR code is scannable by phone camera
- [ ] Print label button works

### QR Scanning
- [ ] Scan button opens camera
- [ ] Scanning valid QR code navigates to item
- [ ] Scanning unknown QR code shows create option
- [ ] Camera permissions handled gracefully
- [ ] Works on mobile browsers

---

## Dependencies

```bash
bun add qrcode @types/qrcode
```

---

## Estimated Scope

| Phase | Components | Complexity |
|-------|------------|------------|
| Move Functionality | 1 new, 1 update | Medium |
| QR Code Display | 1 new, 1 update | Low |
| QR Scanning | 0 new, 2-3 updates | Medium |

---

## Notes

- The backend `moveItem` function already handles validation (circular references, container-only targets)
- QR codes should encode just the UUID, not a full URL, for flexibility
- The scan page may need camera permission handling for different browsers
- Consider adding a "Recently Scanned" list for quick access to frequently used items
