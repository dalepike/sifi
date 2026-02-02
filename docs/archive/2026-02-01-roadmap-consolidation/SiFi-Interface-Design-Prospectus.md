# SiFi Interface Design Prospectus
## Based on Remind.me Design Language

---

## Design Analysis: Remind.me Reference

The provided Remind.me UI showcases a sophisticated dark-mode design system with the following key characteristics:

### Color Palette Extracted

| Role | Color | Hex (Approximate) | Usage |
|------|-------|-------------------|-------|
| Background Primary | Near Black | `#1A1A1E` | Main app background |
| Background Secondary | Dark Gray | `#2A2A30` | Cards, elevated surfaces |
| Background Tertiary | Medium Gray | `#3A3A42` | Input fields, hover states |
| Accent Primary | Soft Purple/Lavender | `#A8A4F0` | Brand text, CTA buttons |
| Accent Secondary | Muted Lavender | `#8B87D4` | Selected states, highlights |
| Text Primary | White | `#FFFFFF` | Headings, important text |
| Text Secondary | Light Gray | `#9A9AA0` | Descriptions, metadata |
| Text Tertiary | Medium Gray | `#6A6A72` | Placeholder, disabled |
| Accent Warm | Soft Orange | `#E8A87C` | Category headers, links |
| Success/Tag | Soft Green | `#7DD4A8` | Tags, positive states |

### Typography System

| Element | Weight | Size (Approx) | Case |
|---------|--------|---------------|------|
| Brand Name | Bold | 32-36px | Title Case |
| Page Heading | Bold | 28-32px | Title Case |
| Section Heading | Semi-Bold | 20-24px | Title Case |
| Card Title | Semi-Bold | 18-20px | Sentence Case |
| Body Text | Regular | 16px | Sentence Case |
| Metadata | Regular | 14px | Sentence Case |
| Caption | Regular | 12px | UPPERCASE for tags |
| Button Text | Semi-Bold | 16px | Sentence Case |

### Component Patterns

**Cards:**
- Rounded corners (16-20px radius)
- Subtle elevation via lighter background
- No visible borders (color differentiation only)
- Consistent internal padding (20-24px)
- Right-aligned action arrows in circular buttons

**Buttons:**
- Primary CTA: Lavender fill (`#A8A4F0`), full-width, large (56px height)
- Secondary: Dark fill with border, same size
- Icon buttons: Circular, lavender background for emphasis
- Text links: Accent color, no underline

**Navigation:**
- Bottom tab bar with icon + label
- Active state indicated by color (not fill)
- Clean, outlined icons

**Lists:**
- Full-width cards with subtle separation
- Date metadata above title
- Tag pills inline with date
- Preview text truncated to 2 lines
- Right arrow affordance for drill-down

---

## SiFi Design System Specification

### Adapting the Design Language

SiFi should adopt this design language while maintaining its own identity. Key adaptations:

1. **Accent Color**: Shift from purple/lavender to a **teal/cyan** (`#5BC0BE` or similar) to differentiate from Remind.me while maintaining the sophisticated feel
2. **Secondary Accent**: Use **warm amber** (`#E8B87C`) for highlights, sharing indicators
3. **Maintain**: Dark backgrounds, card-based layouts, rounded corners, clean iconography

### SiFi Color Palette

```
// Backgrounds
--bg-primary:      #121214;    // App background
--bg-secondary:    #1E1E22;    // Cards, surfaces
--bg-tertiary:     #2A2A30;    // Inputs, hover states
--bg-elevated:     #323238;    // Modals, dropdowns

// Accent Colors
--accent-primary:  #5BC0BE;    // Teal - Primary actions, brand
--accent-hover:    #4AA8A6;    // Teal dark - Hover state
--accent-muted:    #3D8785;    // Teal muted - Disabled/subtle
--accent-warm:     #E8B87C;    // Amber - Sharing, highlights
--accent-danger:   #E57373;    // Soft red - Delete, warnings

// Text Colors
--text-primary:    #FFFFFF;    // Headings, important
--text-secondary:  #A0A0A8;    // Descriptions, body
--text-tertiary:   #686870;    // Placeholders, disabled
--text-inverse:    #121214;    // Text on light backgrounds

// Semantic Colors
--color-shared:    #E8B87C;    // Family/shared indicator
--color-private:   #8B87D4;    // Private/personal indicator
--color-success:   #7DD4A8;    // Success states
--color-warning:   #E8C87C;    // Warning states
```

### Typography Scale

```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Type Scale */
--text-display:    2.25rem;   /* 36px - Welcome screens */
--text-h1:         1.75rem;   /* 28px - Page titles */
--text-h2:         1.25rem;   /* 20px - Section headers */
--text-h3:         1.125rem;  /* 18px - Card titles */
--text-body:       1rem;      /* 16px - Body text */
--text-small:      0.875rem;  /* 14px - Metadata, captions */
--text-tiny:       0.75rem;   /* 12px - Tags, timestamps */

/* Font Weights */
--weight-regular:  400;
--weight-medium:   500;
--weight-semibold: 600;
--weight-bold:     700;

/* Line Heights */
--leading-tight:   1.2;
--leading-normal:  1.5;
--leading-relaxed: 1.75;
```

### Spacing System

```css
/* Base unit: 4px */
--space-1:   0.25rem;  /* 4px */
--space-2:   0.5rem;   /* 8px */
--space-3:   0.75rem;  /* 12px */
--space-4:   1rem;     /* 16px */
--space-5:   1.25rem;  /* 20px */
--space-6:   1.5rem;   /* 24px */
--space-8:   2rem;     /* 32px */
--space-10:  2.5rem;   /* 40px */
--space-12:  3rem;     /* 48px */
--space-16:  4rem;     /* 64px */
```

### Border Radius

```css
--radius-sm:    0.5rem;   /* 8px - Buttons, inputs */
--radius-md:    0.75rem;  /* 12px - Small cards, tags */
--radius-lg:    1rem;     /* 16px - Cards */
--radius-xl:    1.25rem;  /* 20px - Large cards, modals */
--radius-full:  9999px;   /* Pills, avatars */
```

---

## Component Specifications

### 1. Navigation Header

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Avatar]  Hello, Dale!                              [≡ Menu]       │
│    48px    --text-h2, --weight-semibold                             │
│   circle                                                            │
├─────────────────────────────────────────────────────────────────────┤
│  Background: --bg-primary                                           │
│  Height: 72px                                                       │
│  Padding: --space-4 horizontal                                      │
│  Border-bottom: 1px solid --bg-tertiary                             │
└─────────────────────────────────────────────────────────────────────┘
```

**SiFi Adaptation:**
- Replace "Hello, Dale!" with "SiFi" brand + optional user greeting
- Avatar shows user initials (already implemented)
- Menu icon opens settings/profile drawer

### 2. Category Cards (Spaces/Folders)

Based on Remind.me's Folders section:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Your Spaces                                      + ADD SPACE       │
│  --text-h2                                        --accent-primary  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │    🏠    │  │    🏢    │  │    🚗    │  │    📦    │            │
│  │          │  │          │  │          │  │          │            │
│  │   Home   │  │  Office  │  │ Vehicle  │  │ Storage  │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                                                     │
│  Card specs:                                                        │
│  - Size: 100px × 100px (mobile), 120px × 100px (desktop)            │
│  - Background: --bg-secondary                                       │
│  - Border-radius: --radius-lg                                       │
│  - Icon: 32px, centered, --text-tertiary                            │
│  - Label: --text-small, --text-secondary, centered below            │
│  - Hover: --bg-tertiary background                                  │
│  - Selected: --accent-primary border (2px)                          │
└─────────────────────────────────────────────────────────────────────┘
```

### 3. List Item Cards

Based on Remind.me's note cards:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Jan 31, 2026            [KITCHEN]                                  │
│  --text-small            Tag pill                                   │
│  --text-tertiary         --bg-tertiary, --text-small                │
│                                                                     │
│  Blender                                              ┌─────┐       │
│  --text-h3, --weight-semibold, --text-primary         │  →  │       │
│                                                       │     │       │
│  Vitamix 5200 Professional Grade                      └─────┘       │
│  --text-body, --text-secondary (2 lines max)          Arrow btn     │
│                                                       44px circle   │
│  🏠 Home → Kitchen → Counter                          --bg-tertiary │
│  --text-small, --text-tertiary                                      │
├─────────────────────────────────────────────────────────────────────┤
│  Background: --bg-secondary                                         │
│  Border-radius: --radius-lg                                         │
│  Padding: --space-5                                                 │
│  Margin-bottom: --space-3                                           │
│  Hover: brightness(1.05)                                            │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. Location Hierarchy Row

```
┌─────────────────────────────────────────────────────────────────────┐
│  [▼] [🛋️]  Family Room     [F2]    3 spots         [+]    [👨‍👩‍👧‍👦]    │
│   │    │         │           │        │              │        │     │
│  20px 32px   --text-h3     Code    Count          Add     Share    │
│  icon emoji  --weight-     --text-  --text-       child   indicator│
│              semibold      tiny     small                          │
│              --text-       --bg-    --text-                        │
│              primary       tertiary tertiary                       │
│                            pill                                    │
├─────────────────────────────────────────────────────────────────────┤
│  Background: transparent (default), --bg-secondary (hover/selected) │
│  Height: 48px                                                       │
│  Padding: --space-3 vertical, --space-4 horizontal                  │
│  Border-radius: --radius-md                                         │
│  Indent per level: --space-6 (24px)                                 │
└─────────────────────────────────────────────────────────────────────┘

Nested child:
│  └─ [🪑]  Nightstand      [NT]    2 items         [+]    [👨‍👩‍👧‍👦]     │
   │   │                                                              │
   Tree line: --text-tertiary, 1px                                    │
```

### 5. Empty State

Based on Remind.me welcome screen:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                            [🏠]                                     │
│                         64px icon                                   │
│                      --bg-tertiary                                  │
│                      96px circle                                    │
│                                                                     │
│               Set up your first space                               │
│               --text-h1, --text-primary                             │
│                                                                     │
│        Create locations for your home, then add items               │
│        with QR codes so everyone can find things.                   │
│        --text-body, --text-secondary, centered                      │
│                                                                     │
│        ┌─────────────────────────────────────────┐                  │
│        │           + Add Your First Space        │                  │
│        │                                         │                  │
│        │  --accent-primary background            │                  │
│        │  --text-inverse text                    │                  │
│        │  --radius-md, height: 56px              │                  │
│        └─────────────────────────────────────────┘                  │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│        How it works:                                                │
│        --text-h3, --text-primary                                    │
│                                                                     │
│        1. 🏠 Add your home and rooms                                │
│        2. 📦 Add items with photos                                  │
│        3. 🏷️ Print QR labels                                        │
│        4. 📱 Scan to find where things belong                       │
│                                                                     │
│        --text-body, --text-secondary                                │
│        Emoji: inline, Steps: --space-3 between                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6. Action Type Selector

Based on Remind.me's "Add new note" screen:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ←                                                                  │
│                                                                     │
│                    What kind of space?                              │
│                    --text-h1, centered                              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │   [🏠]                        Home                           │   │
│  │   32px                        --text-h3                      │   │
│  │                               --text-primary                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │   [🏢]                        Office                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │   [🚗]                        Vehicle                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │   [📦]                        Storage Unit                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Card specs:                                                        │
│  - Background: --bg-secondary                                       │
│  - Border-radius: --radius-lg                                       │
│  - Padding: --space-5 vertical, --space-6 horizontal                │
│  - Height: ~80px                                                    │
│  - Margin-bottom: --space-3                                         │
│  - Icon left-aligned, text centered or left                         │
│  - Hover: --bg-tertiary                                             │
│  - Selected: --accent-primary border (2px)                          │
└─────────────────────────────────────────────────────────────────────┘
```

### 7. Primary Button (CTA)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│        ┌─────────────────────────────────────────┐                  │
│        │             Let's start                 │                  │
│        └─────────────────────────────────────────┘                  │
│                                                                     │
│  Specs:                                                             │
│  - Background: --accent-primary                                     │
│  - Text: --text-inverse, --weight-semibold                          │
│  - Height: 56px                                                     │
│  - Border-radius: --radius-md                                       │
│  - Width: 100% (mobile), max-width: 400px (desktop)                 │
│  - Padding: --space-4 horizontal                                    │
│                                                                     │
│  States:                                                            │
│  - Hover: --accent-hover background                                 │
│  - Active: scale(0.98)                                              │
│  - Disabled: opacity 0.5                                            │
│  - Loading: spinner icon, text "Loading..."                         │
└─────────────────────────────────────────────────────────────────────┘
```

### 8. Bottom Navigation

Based on Remind.me's tab bar:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│     [🏠]         [+]          [🔍]         [📱]         [⚙️]        │
│     Home         Add         Search        Scan       Settings      │
│                                                                     │
│  --text-tiny, --text-tertiary (inactive)                            │
│  --text-tiny, --accent-primary (active)                             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Background: --bg-secondary                                         │
│  Height: 64px (+ safe area)                                         │
│  Border-top: 1px solid --bg-tertiary                                │
│  Icon size: 24px                                                    │
│  Padding: --space-2 vertical                                        │
│                                                                     │
│  Active indicator: Icon and label use --accent-primary              │
│  Add button: Could be elevated with --accent-primary background     │
└─────────────────────────────────────────────────────────────────────┘
```

### 9. Tag Pills

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│     ┌─────────────────┐                                             │
│     │ ● KITCHEN       │                                             │
│     └─────────────────┘                                             │
│                                                                     │
│  Specs:                                                             │
│  - Background: --bg-tertiary (or category color at 20% opacity)     │
│  - Text: --text-small, --weight-medium, UPPERCASE                   │
│  - Padding: --space-2 horizontal, --space-1 vertical                │
│  - Border-radius: --radius-full                                     │
│  - Color dot: 8px circle, category color                            │
│                                                                     │
│  Removable variant:                                                 │
│     ┌─────────────────────┐                                         │
│     │ ● KITCHEN      [×]  │                                         │
│     └─────────────────────┘                                         │
│  - [×] uses --text-tertiary, hover --text-primary                   │
│  - Tap target: full pill or 32px around ×                           │
└─────────────────────────────────────────────────────────────────────┘
```

### 10. Sharing Indicators

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Shared (Family):                                                   │
│     [👨‍👩‍👧‍👦]  or  [Multiple person icon]                               │
│     Color: --color-shared (amber)                                   │
│     Size: 20px                                                      │
│     Tooltip: "Shared with Pike Family"                              │
│                                                                     │
│  Private (Personal):                                                │
│     [👤]  or  [Single person icon]                                  │
│     Color: --color-private (purple)                                 │
│     Size: 20px                                                      │
│     Tooltip: "Only visible to you"                                  │
│                                                                     │
│  Visual treatment for private items:                                │
│  - Slight opacity reduction (0.85)                                  │
│  - Optional: subtle purple left border (2px)                        │
│  - Or: italicized title text                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Screen-by-Screen Redesign

### Home / Locations Screen

```
┌─────────────────────────────────────────────────────────────────────┐
│  [DP]  SiFi                                              [≡]        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Your Spaces                                        + Add Space     │
│                                                                     │
│  ┌────────┐  ┌────────┐                                             │
│  │   🏠   │  │   +    │                                             │
│  │  Quail │  │  Add   │                                             │
│  │ 12 items│  │        │                                             │
│  └────────┘  └────────┘                                             │
│                                                                     │
│  Inside Quail                                       View all →      │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [▼] 🛋️  Family Room    F2     3 spots    [+]   [👨‍👩‍👧‍👦]        │   │
│  │      └─ 📺 TV Stand     TS     2 items    [+]   [👨‍👩‍👧‍👦]        │   │
│  │      └─ 🗄️ Cabinet      CB     5 items    [+]   [👨‍👩‍👧‍👦]        │   │
│  │  [▶] 🛏️  Main Bedroom   MB     3 spots    [+]   [👨‍👩‍👧‍👦]        │   │
│  │  [▶] 🍳  Kitchen        KI     8 items    [+]   [👨‍👩‍👧‍👦]        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Recent Items                                       View all →      │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Jan 31  [KITCHEN]                                          │   │
│  │  Blender                                           [→]      │   │
│  │  Vitamix 5200                                               │   │
│  │  🏠 Kitchen → Counter                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│     [🏠]         [+]          [🔍]         [📱]         [⚙️]        │
│     Home         Add         Search        Scan       Settings      │
└─────────────────────────────────────────────────────────────────────┘
```

### Item Detail Screen

Based on Remind.me's note detail with collapsible sections:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ←  My Items                                         [✏️]  [📤]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Jan 31, 2026                                                       │
│                                                                     │
│  Blender                                                            │
│  Vitamix 5200 Professional Grade                                    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  🏠 Home                                                     │   │
│  │  Quail → Kitchen → Counter                          [Move]  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ▼ Details                                                          │
│    ─────────────────────────────────────────────────────────────   │
│    Type: Object                                                     │
│    Code: QU-KI-CT-ABC123                                            │
│    Added: January 31, 2026                                          │
│    Shared with: Pike Family                                         │
│                                                                     │
│  ▼ Photos (1)                                                       │
│    ─────────────────────────────────────────────────────────────   │
│    [Photo thumbnail]                               [+ Add Photo]   │
│                                                                     │
│  ▼ Attachments (2)                                                  │
│    ─────────────────────────────────────────────────────────────   │
│    📄 User Manual.pdf                                     [↓]      │
│    🔗 Ice Maker Cleaning Video                            [↗]      │
│                                              [+ Add Attachment]    │
│                                                                     │
│  ▼ QR Code                                                          │
│    ─────────────────────────────────────────────────────────────   │
│    [QR Code Image]          QU-KI-CT-ABC123                        │
│                             [Copy]  [Print Label]                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Animation & Interaction Guidelines

### Transitions

```css
/* Standard transition */
--transition-fast: 150ms ease-out;
--transition-normal: 250ms ease-out;
--transition-slow: 350ms ease-out;

/* Apply to: */
- Background color changes
- Opacity changes
- Transform (scale, translate)
- Box-shadow changes
```

### Micro-interactions

| Action | Animation |
|--------|-----------|
| Button press | scale(0.97) for 100ms |
| Card hover | brightness(1.05), slight lift (translateY -2px) |
| Expand/collapse | Height transition 250ms + rotate chevron |
| Page transition | Slide from right (forward) / left (back) |
| Modal open | Fade in + slide up from bottom |
| Toast notification | Slide in from top, auto-dismiss after 3s |
| Delete confirmation | Subtle shake if cancelled |
| Success action | Brief green flash on affected element |

### Loading States

- Skeleton screens for cards (pulsing --bg-tertiary rectangles)
- Spinner for buttons (replace text with animated spinner)
- Progress bar for uploads (--accent-primary fill)

---

## Accessibility Considerations

### Color Contrast

All text combinations meet WCAG AA (4.5:1 for normal text):
- --text-primary on --bg-primary: ✓ (exceeds 7:1)
- --text-secondary on --bg-primary: ✓ (meets 4.5:1)
- --accent-primary on --bg-primary: ✓ (meets 4.5:1)
- --text-inverse on --accent-primary: ✓ (meets 4.5:1)

### Touch Targets

- Minimum touch target: 44px × 44px
- Spacing between targets: minimum 8px
- Tag remove buttons: expand touch area beyond visual bounds

### Focus States

- All interactive elements have visible focus ring
- Focus ring: 2px solid --accent-primary, 2px offset
- Focus order follows visual layout

---

## Implementation Priority

### Phase 1: Foundation
1. Implement color palette as CSS custom properties
2. Update typography scale
3. Apply spacing system
4. Update button styles (primary CTA)

### Phase 2: Components
1. Card component redesign
2. List item component
3. Empty states
4. Bottom navigation (mobile)

### Phase 3: Screens
1. Locations/Home screen redesign
2. Item detail screen
3. Add item flow with type selector
4. Settings screen

### Phase 4: Polish
1. Animations and transitions
2. Loading states
3. Error states
4. Final accessibility audit

---

*Design Prospectus Version: 1.0*
*Based on: Remind.me UI Reference*
*Created: February 1, 2026*
*For: SiFi Inventory Tracker*
