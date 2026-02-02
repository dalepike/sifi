# SiFi Comprehensive Roadmap Brainstorm

**Date:** 2026-02-01
**Status:** Ready for planning
**Participants:** Dale + Kumo

---

## What We're Building

A comprehensive product roadmap for SiFi that consolidates findings from five planning documents into a staged development plan with named releases. The roadmap prioritizes:

1. **Immediate:** Full interface redesign based on Remind.me-inspired design system
2. **Near-term:** Solo-user feature completion (Notifications, Data Export)
3. **Future:** Multi-user/household features (deferred to later major release)

---

## Why This Approach

### Design-First Rationale
- Current UX issues are resolved, but the interface lacks polish and brand identity
- The teal/dark design system from the Interface Prospectus creates visual differentiation
- Better to establish the design foundation before adding new feature complexity
- A polished interface supports user confidence and retention

### Solo Features Before Multi-User
- Notifications and Export complete the "v1 promise" to existing users
- Multi-user adds significant database schema and permission complexity
- Cleaner to ship a polished solo experience, then tackle sharing as a major milestone

---

## Key Decisions

### Release Structure (Named Releases)

| Release | Name | Focus | Scope |
|---------|------|-------|-------|
| 1 | "Interface Refresh" | Full visual redesign | Design Prospectus Phases 1-4 |
| 2 | "Notifications" | In-app reminders & alerts | Warranty reminders, maintenance alerts |
| 3 | "Data Portability" | Export/Import | JSON + CSV export, backup capability |
| 4 | "Foundation Polish" | Location icons, empty states | Product Vision Phase 1 features |
| 5 | "Households" (future) | Multi-user sharing | Product Vision Phases 2-5 |

### Interface Refresh Scope (Release 1)

Based on Design Prospectus 4-phase plan:

**Phase 1 - Foundation:**
- Teal/cyan accent color palette (#5BC0BE) - CONFIRMED
- Dark backgrounds (#121214, #1E1E22, #2A2A30)
- Light mode with equal polish - CONFIRMED
- Typography scale (Inter, 12-36px range)
- Spacing system (4px base unit)
- CSS custom properties

**Phase 2 - Components:**
- Card redesign (16-20px radius, no borders)
- Button styles (56px height CTAs, circular icon buttons)
- Location hierarchy row with tree lines
- Empty state treatments
- Tag pill styling
- Lucide icons throughout (no emoji) - CONFIRMED

**Phase 3 - Screens:**
- Home/Locations screen with "Your Spaces" header
- Item detail with collapsible sections
- Space type selector (Home, Office, Vehicle, etc.)
- Bottom navigation redesign with new items - CONFIRMED
  - Current: Locations, Search, Activities, Tags, Print
  - New: Home, Add, Search, Scan, Settings

**Phase 4 - Polish:**
- Transitions and micro-interactions
- Loading states (skeleton screens, spinners)
- Error states
- Final accessibility audit

### Design Decisions Resolved

| Question | Decision | Rationale |
|----------|----------|-----------|
| Emoji vs icons | Lucide icons only | More polished, consistent with dark UI |
| Light mode | Equal polish | Users expect both themes to work well |
| Mobile nav items | Adopt Prospectus items | More action-oriented (Home, Add, Search, Scan, Settings) |
| Accent color | Teal (#5BC0BE) | Distinct from Remind.me, fresh feel |
| Bottom nav | Already exists | Just need to update items/styling |

### Features Explicitly Deferred

The following are NOT in the immediate roadmap:

- Multi-user households and sharing
- Member roles and permissions
- Private vs shared item visibility
- Activity feed for collaboration
- Mobile native app / PWA
- Barcode scanning (UPC/EAN)
- Analytics dashboard

---

## Open Questions (Remaining)

### For Notifications (Release 2)
1. **Email integration:** MVP is in-app only. When should email notifications be added?
2. **Push notifications:** Requires service worker. Defer to mobile app release?

### For Data Portability (Release 3)
1. **Import capability:** Export comes first. When should re-import be supported?
2. **Attachment handling:** Export metadata only, or include base64-encoded files?

---

## Source Documents

The following documents informed this brainstorm and have been archived:

| Document | Location | Key Contributions |
|----------|----------|-------------------|
| SiFi-Improvement-Plan.md | `docs/archive/2026-02-01-roadmap-consolidation/` | Sprint history, implementation patterns |
| SiFi-Interface-Design-Prospectus.md | `docs/archive/2026-02-01-roadmap-consolidation/` | Complete design system specification |
| SiFi-Product-Vision-Roadmap.md | `docs/archive/2026-02-01-roadmap-consolidation/` | Multi-user vision, long-term direction |
| SiFi-UX-Analysis-FollowUp-Report.md | `docs/archive/2026-02-01-roadmap-consolidation/` | Current state assessment, remaining issues |

---

## Completed Actions

- [x] Created consolidated ROADMAP.md with named releases
- [x] Archived source planning documents to `docs/archive/`
- [x] Resolved icon style decision (Lucide only)
- [x] Resolved light mode decision (equal polish)
- [x] Resolved navigation items decision (adopt Prospectus items)
- [x] Confirmed teal accent color (#5BC0BE)

---

## Next Steps

1. Run `/workflows:plan` to create detailed implementation plan for Release 1 (Interface Refresh)
2. Create GitHub issues for Release 1 phases

---

*Brainstorm complete. Ready for `/workflows:plan` when you want to proceed with Interface Refresh implementation planning.*
