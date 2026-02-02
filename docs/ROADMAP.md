# SiFi Roadmap

**Last Updated:** 2026-02-02

This document tracks the product roadmap for SiFi, organized by named releases.

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

### Custom Reminders (Release 5)
- [x] Add recurrence columns to notifications table (migration)
- [x] Update types with discriminated unions for recurrence
- [x] Create/update/delete reminder server actions
- [x] Get reminders by item action
- [x] Reminder list component on item detail page
- [x] Visual differentiation (custom vs auto-generated)
- [x] Edit/delete buttons for custom reminders only
- [x] Reminder form dialog with title, date/time, recurrence, end date
- [x] Quick preset buttons (Tomorrow, Next week, etc.)
- [x] Cron job handles recurring notification generation
- [x] Month-end and leap year edge case handling

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
