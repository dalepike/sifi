# SiFi Roadmap

**Last Updated:** 2026-02-01

This document tracks the product roadmap for SiFi, organized by named releases.

---

## Current Release: Interface Refresh

**Status:** Planning
**Goal:** Transform the interface with a polished dark design system

### Phase 1: Foundation
- [ ] Implement teal/cyan accent color palette
- [ ] Update CSS custom properties for dark backgrounds
- [ ] Apply typography scale (Inter, 12-36px)
- [ ] Implement 4px-base spacing system
- [ ] Update border radius tokens

### Phase 2: Components
- [ ] Redesign card components (rounded, borderless)
- [ ] Update button styles (56px CTAs, circular icons)
- [ ] Create location hierarchy row with tree lines
- [ ] Improve empty state treatments
- [ ] Redesign tag pills with category colors

### Phase 3: Screens
- [ ] Redesign Locations/Home with "Your Spaces" header
- [ ] Update item detail with collapsible sections
- [ ] Add space type selector (Home, Office, Vehicle)
- [ ] Implement bottom navigation for mobile

### Phase 4: Polish
- [ ] Add transitions and micro-interactions
- [ ] Implement skeleton loading states
- [ ] Design error states
- [ ] Conduct final accessibility audit

---

## Upcoming Releases

### Notifications
**Goal:** Allow users to set reminders and alerts for items

**MVP Scope:**
- In-app notifications only (no email/push initially)
- Manual reminders with user-set dates
- Notification bell with unread count
- Mark as read/dismiss functionality

**Use Cases:**
- Warranty expiration reminders
- Maintenance schedule alerts
- Periodic "check on item" reminders

### Data Portability
**Goal:** Allow users to export and backup their inventory data

**MVP Scope:**
- JSON export (complete data, suitable for re-import)
- CSV export (spreadsheet-compatible)
- Export button in Settings
- Download via browser

**Entities:**
- Locations (with hierarchy)
- Items (with location paths)
- Tags, Activities
- Attachment metadata

### Foundation Polish
**Goal:** Location customization and improved empty states

**Scope:**
- Configurable emoji icons per location
- Root location type selector (Home, Office, Vehicle)
- Visual hierarchy with tree lines
- Level-appropriate count labels (rooms/spots/items)
- Improved empty state with "How it works" guide

---

## Future Vision: Households (v2.0)

**Goal:** Transform SiFi into a family-shared household organization system

This major release is deferred to a future version. Key features:
- Household creation and member invites
- Admin/Member/Viewer roles
- Shared vs private item visibility
- Activity feed for collaboration
- Location permission levels

*See archived Product Vision document for full details.*

---

## Completed

### UX Improvements (Sprint 1-4)
- [x] Settings & Profile pages
- [x] WCAG AA contrast compliance
- [x] Delete confirmations
- [x] Location code explanations
- [x] QR scan button improvements
- [x] Print queue discoverability
- [x] Activity colors/icons
- [x] Keyboard shortcuts
- [x] Drag-and-drop photo upload
- [x] Batch actions (move, tag, delete, print)
- [x] Mobile touch targets
- [x] Truncation tooltips

### Dark Mode
- [x] Light/Dark/System theme toggle in Settings
- [x] Powered by next-themes

### File Attachments
- [x] Attach PDFs, images, and documents to items
- [x] Custom titles for each attachment
- [x] View attachments from item detail page

---

## Archive

Previous planning documents consolidated into this roadmap:
- `docs/archive/2026-02-01-roadmap-consolidation/SiFi-Improvement-Plan.md`
- `docs/archive/2026-02-01-roadmap-consolidation/SiFi-Interface-Design-Prospectus.md`
- `docs/archive/2026-02-01-roadmap-consolidation/SiFi-Product-Vision-Roadmap.md`
- `docs/archive/2026-02-01-roadmap-consolidation/SiFi-UX-Analysis-FollowUp-Report.md`

---

## Contributing

To propose a new feature:
1. Create a brainstorm doc in `docs/brainstorms/`
2. Discuss scope and approach
3. Add to this roadmap when approved
4. Create GitHub issues for implementation
