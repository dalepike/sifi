# SiFi Roadmap

**Last Updated:** 2026-02-02

This document tracks the product roadmap for SiFi, organized by named releases.

---

## Current Release: Custom Reminders (Release 5)

**Status:** Planning
**Priority:** High
**Goal:** Item-level custom notifications with full CRUD and recurrence support

**Plan:** `docs/plans/2026-02-02-feat-item-level-custom-notifications-plan.md`

### Phase 1: Schema & Data Layer
- [ ] Add recurrence columns to notifications table (migration)
- [ ] Update types and database functions

### Phase 2: Server Actions
- [ ] Create/update/delete reminder actions
- [ ] Get reminders by item action

### Phase 3: Reminder List Component
- [ ] List view on item detail page (like attachments)
- [ ] Visual differentiation (custom vs auto-generated)
- [ ] Edit/delete buttons for custom only

### Phase 4: Reminder Form Dialog
- [ ] Title, date/time, recurrence type, end date, message
- [ ] Edit mode support

### Phase 5: Item Detail Integration
- [ ] Add Reminders section after attachments

### Phase 6: Recurring Processing
- [ ] Update cron job to handle recurrence
- [ ] Auto-create next occurrence when triggered

### Phase 7: Notification Bell Enhancement
- [ ] Show custom reminders in dropdown
- [ ] Link to source item

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

### Interface Refresh (Release 1)
- [x] Teal/cyan accent color palette (#5BC0BE)
- [x] Dark backgrounds (#121214, #1E1E22, #2A2A30)
- [x] Light mode with equal polish
- [x] CSS custom properties design system
- [x] WCAG AA contrast compliance
- [x] Skeleton loading states
- [x] Tree line hierarchy visualization
- [x] Empty state treatments

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

### Notifications (Release 2)
- [x] In-app notification system
- [x] Warranty expiration reminders
- [x] Maintenance schedule alerts
- [x] Notification bell with unread count
- [x] Mark as read/dismiss functionality
- [x] User preferences in Settings

### Data Portability (Release 3)
- [x] JSON export (complete data, suitable for re-import)
- [x] CSV export as ZIP bundle (spreadsheet-compatible)
- [x] Export UI in Settings with live stats
- [x] Includes: locations, items, tags, activities, attachment metadata

### Foundation Polish (Release 4)
- [x] Configurable emoji icons per location (40+ options)
- [x] Root location type selector (Home, Office, Vehicle, Storage, Other)
- [x] Visual hierarchy with tree lines
- [x] Level-appropriate count labels (rooms/spots/items)
- [x] Improved empty state with "How it works" onboarding guide

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
