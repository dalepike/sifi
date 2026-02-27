# SiFi Institutional Knowledge: Complete Index

Welcome! This directory contains documented learnings from the SiFi notification system implementation. Use this guide to navigate the knowledge base.

---

## Start Here: Pick Your Path

### If you're... → Read this first

**Building a notification system like SiFi's**
→ `/Users/dalepike/Projects/sifi/INSTITUTIONAL-LEARNINGS.md`
  - Complete deep dive with code examples
  - Schema design patterns
  - Database layer CRUD operations
  - Cron job implementation
  - Type safety patterns

**Implementing one of the use cases (reminders, scheduling, recurring tasks)**
→ `/Users/dalepike/Projects/sifi/PATTERNS-APPLIED-TO-USE-CASES.md`
  - How to apply SiFi patterns to your feature
  - Step-by-step implementation guides
  - Complete code templates
  - Handles: notifications, reminders, scheduling, recurrence, date/time

**Looking for copy-paste code templates**
→ `/Users/dalepike/Projects/sifi/QUICK-REFERENCE-PATTERNS.md`
  - Time window calculations
  - CRUD templates
  - Schema boilerplate
  - Cron job authentication
  - Type conversions
  - Testing checklist

**Understanding the complete system** (overview + implementation)
→ `/Users/dalepike/Projects/sifi/docs/plans/2026-02-01-feat-notifications-release-2-plan.md`
  - Release plan (official specification)
  - Design decisions & rationale
  - Edge cases
  - What's NOT implemented (and why)
  - Implementation phases

---

## Document Overview

### 1. INSTITUTIONAL-LEARNINGS.md (Comprehensive Reference)
**Size:** 500+ lines | **Level:** Advanced | **Format:** Detailed explanations + code

**12 Major Sections:**
1. Database schema patterns for date/time handling
2. Date/time calculation patterns (warranty, maintenance)
3. CRUD operations with authentication
4. Server actions pattern (server-side auth)
5. Cron job pattern for scheduled notifications
6. Type safety & date formatting
7. UI integration points
8. Edge cases & handling
9. Design decisions & rationale
10. What's NOT implemented
11. Key files summary
12. When to apply these patterns

**When to use:**
- You want to understand the complete system
- You need detailed explanations of design choices
- You're implementing a similar system from scratch
- You want to reference specific code patterns

---

### 2. PATTERNS-APPLIED-TO-USE-CASES.md (Practical Guide)
**Size:** 400+ lines | **Level:** Intermediate | **Format:** Step-by-step tutorials

**Coverage:**
1. Notifications - Adding new notification types
2. Reminders - Custom user-defined alerts with date picker
3. Scheduling - Recurring events & tasks
4. Recurrence Patterns - Complex rules (2nd Tuesday, etc.)
5. Date/Time Handling - Time zones & formatting
6. CRUD Operations - Full pattern template
7. Decision matrix (what's implemented vs needs work)

**When to use:**
- You're building a specific feature (reminders, recurring tasks, etc.)
- You want step-by-step implementation guides
- You need a concrete example for your use case
- You want the full implementation with explanations

---

### 3. QUICK-REFERENCE-PATTERNS.md (Cheat Sheet)
**Size:** 250+ lines | **Level:** Intermediate/Advanced | **Format:** Code snippets

**Sections:**
- Time window calculations (warranty, maintenance)
- CRUD with user scoping
- Deduplication patterns
- Server action template
- Database layer CRUD functions
- Schema patterns
- Cron job pattern
- Type conversions
- SWR hook pattern
- Default values strategy
- Testing checklist

**When to use:**
- You need quick code snippets to copy/paste
- You're in the middle of implementing and need a reference
- You want to remember the pattern structure without full context
- You need a testing checklist

---

### 4. Release Plan (Official Specification)
**Location:** `/Users/dalepike/Projects/sifi/docs/plans/2026-02-01-feat-notifications-release-2-plan.md`
**Size:** 432 lines | **Level:** Any | **Format:** Technical specification

**Content:**
- Problem statement
- 3 implementation phases (Database, Core, UI)
- User requirements
- Acceptance criteria per phase
- Data model (ERD)
- Design decisions table
- Edge cases
- What's NOT in Release 2
- Migration notes
- References

**When to use:**
- You want to understand what was built and why
- You need the full specification
- You want to see the complete data model (ERD)
- You're deciding what to include in your own implementation

---

## Implementation Files Reference

### Core Database Layer
```
src/lib/db/
├── schema.ts                 - All tables, enums, indexes
├── notifications.ts          - CRUD functions, calculations
├── items.ts                  - Item operations
├── drizzle-client.ts         - formatDate utilities
└── ... (other entities)
```

### Server Actions
```
src/actions/
├── notifications.ts          - User-facing API with auth
└── ... (other entities)
```

### API Routes (Cron Jobs)
```
src/app/api/cron/
├── generate-notifications/route.ts  - Daily batch processing
└── ... (other jobs)
```

### UI Components
```
src/components/
├── notifications/
│   ├── notification-bell.tsx       - Badge + SWR polling
│   └── notification-dropdown.tsx   - Recent notifications
└── ... (other components)

src/app/(app)/
├── notifications/
│   ├── page.tsx                    - Full notifications page
│   └── notifications-list.tsx      - List with filtering
├── settings/
│   ├── notification-settings.tsx   - Preference form
│   └── page.tsx
└── ... (other pages)
```

---

## Key Patterns at a Glance

### Time Windows
```typescript
const now = new Date();
const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
```

### User Scoping (Always!)
```typescript
.where(and(eq(table.userId, userId), ...otherConditions))
```

### Deduplication
```typescript
.onConflictDoNothing({
  target: [itemId, type, triggerDate],
})
```

### Preferences with Auto-Create
```typescript
const existing = await getPreferences(userId);
if (!existing) {
  return await createDefault(userId);
}
```

### Cron Authentication
```typescript
const authHeader = request.headers.get("authorization");
return authHeader === `Bearer ${cronSecret}`;
```

---

## Learning Path (Beginner to Advanced)

### Beginner: Basic Concepts (30 min read)
1. Read overview in release plan
2. Skim the PATTERNS-APPLIED-TO-USE-CASES for your use case
3. Look at schema.ts to understand the data structure

### Intermediate: Implementation (1-2 hours)
1. Read your specific use case in PATTERNS-APPLIED-TO-USE-CASES
2. Refer to QUICK-REFERENCE-PATTERNS for code snippets
3. Examine the corresponding implementation files in src/

### Advanced: Full System (2-4 hours)
1. Read INSTITUTIONAL-LEARNINGS cover to cover
2. Examine all implementation files with documentation open
3. Understand design decisions in the release plan
4. Study edge cases and what was deferred

---

## Common Questions Answered

**Q: How do I add a new notification type?**
A: See section 1 of PATTERNS-APPLIED-TO-USE-CASES.md

**Q: How do I implement recurring reminders?**
A: See section 3 of PATTERNS-APPLIED-TO-USE-CASES.md

**Q: What's the CRUD template I should use?**
A: See section 6 of PATTERNS-APPLIED-TO-USE-CASES.md or the QUICK-REFERENCE-PATTERNS.md

**Q: How do I prevent duplicate notifications?**
A: See "Deduplication Pattern" in QUICK-REFERENCE-PATTERNS.md

**Q: How does the cron job work?**
A: See "Cron Job Pattern" section in INSTITUTIONAL-LEARNINGS.md or QUICK-REFERENCE-PATTERNS.md

**Q: How do I handle user preferences with defaults?**
A: See "Preferences with Defaults" in INSTITUTIONAL-LEARNINGS.md section 2

**Q: What time zone handling is needed?**
A: See section 5 of PATTERNS-APPLIED-TO-USE-CASES.md

**Q: How do I poll for notifications on the frontend?**
A: See "SWR Hook Pattern" in QUICK-REFERENCE-PATTERNS.md

---

## File Quick Links

### Must Read
- Institutional Learnings: `/Users/dalepike/Projects/sifi/INSTITUTIONAL-LEARNINGS.md`
- Patterns Applied: `/Users/dalepike/Projects/sifi/PATTERNS-APPLIED-TO-USE-CASES.md`
- Quick Reference: `/Users/dalepike/Projects/sifi/QUICK-REFERENCE-PATTERNS.md`

### Source Code (Alphabetical by Feature)
| Feature | File | Key Functions |
|---------|------|---|
| Notification CRUD | `src/lib/db/notifications.ts` | create, getNotifications, markAsRead, update, delete |
| Notification Actions | `src/actions/notifications.ts` | getNotifications, markNotificationRead, createReminder |
| Cron Job | `src/app/api/cron/generate-notifications/route.ts` | GET handler with batch processing |
| Notification Bell (UI) | `src/components/notifications/notification-bell.tsx` | useNotifications hook, badge, dropdown |
| Notifications Page | `src/app/(app)/notifications/page.tsx` | Full list, filters, pagination |
| Settings | `src/app/(app)/settings/notification-settings.tsx` | Preference form |
| Schema | `src/lib/db/schema.ts` | notifications, notificationPreferences, items fields |
| Utilities | `src/lib/db/drizzle-client.ts` | formatDate, formatDateRequired |

### Documentation
| Document | Location | Length | Purpose |
|----------|----------|--------|---------|
| Release Plan | `docs/plans/2026-02-01-feat-notifications-release-2-plan.md` | 432 lines | Official specification |
| Institutional Learnings | `INSTITUTIONAL-LEARNINGS.md` | 500+ lines | Deep reference |
| Patterns Applied | `PATTERNS-APPLIED-TO-USE-CASES.md` | 400+ lines | Practical guide |
| Quick Reference | `QUICK-REFERENCE-PATTERNS.md` | 250+ lines | Code templates |

---

## Key Statistics

- **Total Lines of Production Code:** ~1,200 (excluding UI)
- **Database Layer:** 323 lines (notifications.ts)
- **Server Actions:** 180+ lines (notifications.ts)
- **Cron Job:** 179 lines
- **UI Components:** 400+ lines (4 components)
- **Documentation:** 1,500+ lines across 4 documents

---

## Testing This Knowledge

Use the **testing checklist** in QUICK-REFERENCE-PATTERNS.md to verify your implementation:
- [ ] User scoping works (can't see others' data)
- [ ] Date calculations work edge cases
- [ ] Deduplication prevents duplicates on multiple cron runs
- [ ] Cascade delete cleans up orphaned records
- [ ] Preferences use defaults if not set
- [ ] Authentication prevents unauthorized cron access
- [ ] Null handling in date/interval fields
- [ ] Type safety throughout

---

## Contributing Back

If you improve or extend these patterns:
1. Update the relevant documentation
2. Add code comments in src/
3. Update edge cases if you find new ones
4. Note deferred features if you implement them

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-02 | 1.0 | Initial comprehensive documentation |

---

**Last Updated:** February 2, 2026
**Status:** Complete and production-ready
**Applies To:** SiFi Release 2 (Notifications System)

---

## Quick Navigation

- Start → Choose your path above
- Learn → Read INSTITUTIONAL-LEARNINGS.md
- Build → Follow PATTERNS-APPLIED-TO-USE-CASES.md
- Reference → Use QUICK-REFERENCE-PATTERNS.md
- Specify → Read the release plan
- Code → Check src/lib/db/, src/actions/, src/app/api/

**Questions?** Check the "Common Questions Answered" section above.
