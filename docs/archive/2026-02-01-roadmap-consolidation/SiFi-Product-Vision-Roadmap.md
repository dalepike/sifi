# SiFi Product Vision & Roadmap
## "Know where everything belongs. Help everyone find it."

---

## Product Vision

SiFi transforms from a personal inventory tracker into a **family-shared household organization system**. The core insight: the friction in household organization isn't cataloging—it's the daily chaos of "where does this go?" and "where is that thing?"

### The Two Core Use Cases

1. **Put-Away Mode**: Scan a QR code on any item → instantly see where it belongs → put it in its home
2. **Find Mode**: Search for any item → see its home location → go retrieve it

### Secondary Value

Items become **living reference cards**—the fridge's QR code links to its manual PDF, a video on cleaning the ice maker, warranty info, and purchase date. The toolbox links to tool manuals. The router links to the network password.

---

## Multi-User Model

### Household Structure

```
Household (e.g., "Pike Family")
├── Members
│   ├── Admin (Dale) - full control
│   ├── Member (Sarah) - can add items, 2nd+ level locations
│   └── Member (Kids) - can view, scan, search
│
└── Inventory
    ├── 🏠 Quail (Root - Admin only)
    │   ├── 🛋️ Family Room (1st level - Admin only)
    │   │   ├── 📺 TV Stand (2nd+ level - Any member)
    │   │   │   └── 📦 Remote Control [👨‍👩‍👧‍👦]
    │   │   └── 🗄️ Storage Cabinet
    │   │       └── 📦 Board Games [👨‍👩‍👧‍👦]
    │   └── 🛏️ Dale's Office
    │       └── 📦 Personal Journal [👤 Dale only]
```

### Permission Levels

| Role | Root Locations | 1st Level | 2nd+ Level | Items | View All |
|------|----------------|-----------|------------|-------|----------|
| Admin | ✅ Create/Edit | ✅ Create/Edit | ✅ Create/Edit | ✅ All | ✅ |
| Member | ❌ View only | ❌ View only | ✅ Create/Edit | ✅ Shared + Own | ✅ Shared |
| Viewer | ❌ View only | ❌ View only | ❌ View only | ❌ View shared | ✅ Shared |

### Visibility Model

- **Shared items** (👨‍👩‍👧‍👦 family icon): Visible and searchable by all household members
- **Private items** (👤 person icon): Only visible to creator, different visual treatment (e.g., slightly muted, italicized, or with subtle background)

---

## Locations Interface Redesign

### Current State Issues

1. Generic "Location Hierarchy" header doesn't communicate value
2. All locations look identical (same pin icon)
3. No visual distinction between hierarchy levels
4. Empty state doesn't guide mental model
5. No indication of sharing/collaboration

### Proposed Changes

#### 1. New Page Header

**Before:**
```
Locations
Browse and manage your locations hierarchy.
```

**After:**
```
Your Spaces
Everything has a home. Set up your spaces so anyone can find things and put them back.
```

#### 2. Root Location Type Selection

When clicking "Add Root Location," present a type selector:

```
┌─────────────────────────────────────────────┐
│  What kind of space is this?                │
│                                             │
│  🏠 Home        🏢 Office      🏭 Workshop  │
│  🚗 Vehicle     📦 Storage     🏕️ Other     │
│                                             │
│  [Name: ______________________]             │
│  [Code: __]                                 │
│                                             │
│              [Cancel]  [Create]             │
└─────────────────────────────────────────────┘
```

The selected emoji becomes the location's icon in the hierarchy.

#### 3. Configurable Icons Per Location

Each location can have a custom emoji/icon:

- **Root level**: Property type (🏠🏢🚗📦)
- **1st level (Rooms)**: Room type (🛋️🛏️🍳🚿🏋️🌳)
- **2nd+ level (Containers)**: Container type (🗄️📦🧰🎒👜)
- **Items**: Object type or default 📦

**Setting location**: Edit location → Icon selector with common suggestions + emoji picker

#### 4. Visual Hierarchy Differentiation

```
CURRENT:                          PROPOSED:
                                  
📍 Quail         QU  4 loc        🏠 Quail           QU   4 rooms  👨‍👩‍👧‍👦
  📍 Family Room  F2              │ 🛋️ Family Room    F2   3 spots 👨‍👩‍👧‍👦
  📍 Front Room   F1              │ 🚪 Front Room     F1   0 spots 👨‍👩‍👧‍👦
  📍 Loft         L3              │ 🛗 Loft           L3   0 spots 👨‍👩‍👧‍👦
  📍 Main Bedroom MB  3 loc       │ 🛏️ Main Bedroom   MB   3 spots 👨‍👩‍👧‍👦
                                  │   └ 🪑 Dale's Nightstand  DN  2 items 👨‍👩‍👧‍👦
```

Key changes:
- Custom emoji icons replace generic pin
- Hierarchy shown with tree lines (│ └)
- Count labels change by level: "rooms" → "spots" → "items"
- Sharing indicator at right (👨‍👩‍👧‍👦 or 👤)

#### 5. Empty State (New User)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                          🏠                                     │
│                                                                 │
│              Set up your first space                            │
│                                                                 │
│     Create locations for your home, then add items with         │
│     QR codes. Anyone in your household can scan to find         │
│     where things belong—or search to locate what they need.     │
│                                                                 │
│                   [+ Add Your First Space]                      │
│                                                                 │
│     ─────────────────────────────────────────────────────      │
│                                                                 │
│     How it works:                                               │
│                                                                 │
│     1. 🏠 Add your home and rooms                               │
│     2. 📦 Add items with photos and details                     │
│     3. 🏷️ Print QR labels for your items                        │
│     4. 📱 Scan any label to see where it belongs                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 6. Item "Home" Emphasis

On item detail pages, make the home location more prominent:

**Current breadcrumb:**
```
← Locations > Quail > Main Bedroom > Dale's Nightstand > Nail clippers
```

**Proposed "Home" card:**
```
┌────────────────────────────────────────────┐
│  🏠 Home                                   │
│  Quail → Main Bedroom → Dale's Nightstand  │
│                                    [Move]  │
└────────────────────────────────────────────┘
```

This reinforces that items have a "home" they belong to.

---

## Feature Roadmap

### Phase 1: Foundation Polish (Current → v1.1)
*Goal: Improve single-user experience, lay groundwork for sharing*

- [ ] **Configurable location icons**
  - Emoji picker for each location
  - Suggested icons based on location type
  - Icon appears in hierarchy tree
  
- [ ] **Improved empty state**
  - New value proposition copy
  - "How it works" guide
  - Better CTA button
  
- [ ] **Root location type selector**
  - Type selection (Home, Office, Vehicle, etc.)
  - Auto-suggest icon based on type
  
- [ ] **Visual hierarchy improvements**
  - Tree lines showing parent-child relationships
  - Level-appropriate count labels
  - Indentation refinements

- [ ] **"Home" emphasis on items**
  - Dedicated "Home" card on item detail
  - Home path in search results
  - Home shown when scanning QR

### Phase 2: Household Foundation (v1.2)
*Goal: Enable family sharing with basic permissions*

- [ ] **Household creation**
  - Create household with name
  - Invite members via email/link
  - Household appears in Profile
  
- [ ] **Basic roles**
  - Admin (full control)
  - Member (add items/sub-locations)
  - Implement role assignment UI
  
- [ ] **Sharing indicators**
  - 👨‍👩‍👧‍👦 icon for shared items/locations
  - Sharing visible in hierarchy
  - "Shared with: [Household name]" in details

### Phase 3: Privacy & Personal Items (v1.3)
*Goal: Support private items within shared households*

- [ ] **Private item toggle**
  - "Only visible to me" option when creating items
  - 👤 icon for private items
  - Visual differentiation (muted styling)
  
- [ ] **Privacy in search**
  - Private items only appear for creator
  - Clear indication in search results
  
- [ ] **Private locations** (optional)
  - Allow personal sub-locations
  - "Dale's drawer" visible only to Dale

### Phase 4: Enhanced Collaboration (v1.4)
*Goal: Family-friendly features*

- [ ] **Activity feed**
  - "Sarah added 'Blender' to Kitchen"
  - Recent changes visible to household
  
- [ ] **Viewer role**
  - Kids can search and scan
  - Cannot add or modify
  
- [ ] **Location suggestions**
  - "This looks like it might belong in Kitchen"
  - Based on item name/tags

### Phase 5: Power Features (v2.0)
*Goal: Advanced organization*

- [ ] **Batch operations**
  - Multi-select items
  - Bulk move, tag, delete
  
- [ ] **Smart search**
  - "things in the garage"
  - "items tagged 'tools'"
  
- [ ] **Keyboard shortcuts**
  - / for search
  - n for new item
  - ? for shortcut reference
  
- [ ] **Data export**
  - CSV/JSON export
  - Backup and restore

---

## UI Component Specifications

### Location Row (Proposed)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [▶] [🛋️] Family Room        [F2]     3 spots    [+]        [👨‍👩‍👧‍👦] │
│ │    │        │               │          │        │            │    │
│ │    │        │               │          │        │            │    │
│ │    │        └─ Name         │          │        │            │    │
│ │    │                        │          │        │            │    │
│ │    └─ Custom emoji icon     │          │        │            │    │
│ │                             │          │        │            │    │
│ └─ Expand/collapse            │          │        │            │    │
│                               │          │        └─ Add child │    │
│                               │          │                     │    │
│                               │          └─ Count (rooms/spots/items)│
│                               │                                │    │
│                               └─ Location code                 │    │
│                                                                │    │
│                                                    Sharing indicator │
└─────────────────────────────────────────────────────────────────────┘
```

### Private vs Shared Visual Treatment

**Shared Item Row:**
```
┌─────────────────────────────────────────────────────────┐
│ 📦  Nail Clippers    QU-MB-DN-964C    [👨‍👩‍👧‍👦]           │
│     Main Bedroom → Dale's Nightstand                    │
└─────────────────────────────────────────────────────────┘
```

**Private Item Row:**
```
┌─────────────────────────────────────────────────────────┐
│ 📦  Personal Journal    QU-DO-PJ-123    [👤]      ░░░░░│  ← subtle background
│     Dale's Office → Desk Drawer                    ░░░░░│
└─────────────────────────────────────────────────────────┘
```

---

## Settings Additions

### Appearance Section (Enhanced)

```
Appearance
├── Theme: [Light] [Dark] [System]
│
├── Location Icons
│   └── [✓] Show emoji icons for locations
│       [ ] Use simple markers instead
│
└── Sharing Indicators  
    └── [✓] Show sharing icons (👨‍👩‍👧‍👦 / 👤)
        [ ] Hide sharing indicators
```

---

## Success Metrics

### Phase 1
- Time to first item added < 3 minutes
- New user understands hierarchy concept (survey)
- 80% of users add custom icons

### Phase 2-3
- Households with 2+ members: 40% of users
- Items scanned per week per household
- Search queries per user per week

### Long-term
- "Put-away scans" (scan → view home) frequency
- Manual PDF/attachment additions per item
- User retention at 30/60/90 days

---

## Technical Considerations

### Database Changes for Multi-User

- Household table (id, name, created_by)
- Household_members junction (household_id, user_id, role)
- Location.visibility (shared/private)
- Item.visibility (shared/private)
- Item.created_by (for private items)

### QR Code Changes

Current: Links to item UUID
Future: May need to include household context or remain universal with auth check

### Emoji Storage

- Store emoji character in location.icon field
- Default based on location.type if not set
- Render in hierarchy, breadcrumbs, search results

---

*Document Version: 1.0*
*Created: February 1, 2026*
*Status: Draft for Review*
