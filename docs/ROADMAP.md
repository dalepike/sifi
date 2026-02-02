# SiFi Roadmap

**Last Updated:** 2026-02-01

This document tracks planned features and improvements for SiFi.

---

## Completed

### UX Improvements (Sprint 1-4) ✅
All 15 issues from the UX Analysis Report have been implemented:
- Settings & Profile pages
- WCAG AA contrast compliance
- Delete confirmations
- Location code explanations
- QR scan button improvements
- Print queue discoverability
- Activity colors/icons
- Keyboard shortcuts
- Drag-and-drop photo upload
- Batch actions (move, tag, delete, print)
- Mobile touch targets
- Truncation tooltips

### Dark Mode ✅
- Light/Dark/System theme toggle in Settings
- Powered by next-themes

### File Attachments ✅
- Attach PDFs, images, and documents to items
- Custom titles for each attachment
- View attachments from item detail page

---

## Planned Features

### Notifications System
**Priority:** Medium
**Effort:** Medium

Allow users to set reminders and alerts for items.

**Use Cases:**
- Warranty expiration reminders
- Maintenance schedule alerts
- "Check on item" periodic reminders
- Low-stock alerts for consumables

**Implementation Approach:**
1. **Database Schema:**
   ```sql
   CREATE TABLE notifications (
     id UUID PRIMARY KEY,
     user_id UUID NOT NULL REFERENCES users(id),
     item_id UUID REFERENCES items(id),
     type TEXT NOT NULL, -- 'reminder', 'warranty', 'maintenance'
     title TEXT NOT NULL,
     message TEXT,
     due_date TIMESTAMP,
     is_read BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **UI Components:**
   - Notification bell in header with unread count
   - Notification dropdown/panel
   - "Add Reminder" button on item details
   - Notification preferences in Settings

3. **Backend:**
   - Server actions for CRUD operations
   - Consider: Email notifications (requires email service integration)
   - Consider: Push notifications (requires service worker + push service)

**MVP Scope:**
- In-app notifications only (no email/push)
- Manual reminders (user sets date)
- Notification list page
- Mark as read/dismiss

---

### Data Export
**Priority:** Medium
**Effort:** Low

Allow users to export their inventory data for backup or migration.

**Export Formats:**
- JSON (complete data, suitable for re-import)
- CSV (spreadsheet-compatible, one file per entity type)

**Entities to Export:**
- Locations (with hierarchy)
- Items (with location paths)
- Tags
- Activities
- Attachments (metadata only, or full base64)

**Implementation Approach:**
1. **Server Actions:**
   ```typescript
   // src/actions/export.ts
   export async function exportToJSON(): Promise<{ success: true; data: string } | { success: false; error: string }>
   export async function exportToCSV(): Promise<{ success: true; data: Record<string, string> } | { success: false; error: string }>
   ```

2. **UI:**
   - Export buttons in Settings page
   - Format selection (JSON/CSV)
   - Download triggered via blob URL
   - Optional: Include/exclude attachments toggle

3. **Considerations:**
   - Large datasets: Stream or paginate
   - Attachments: Warn about file size if including base64
   - Privacy: Only export user's own data

**MVP Scope:**
- JSON export (single file, all entities)
- CSV export (zip of multiple CSVs)
- Download button in Settings

---

## Future Considerations

### Data Import
- Re-import from JSON backup
- Import from CSV
- Merge vs. replace options

### Sharing & Collaboration
- Share locations/items with other users
- Read-only vs. edit permissions
- Shared households/organizations

### Mobile App
- React Native or PWA
- Offline support with sync
- Native camera integration

### Barcode Support
- Scan existing barcodes (UPC, EAN)
- Link to product databases
- Auto-populate item details

### Analytics Dashboard
- Item counts over time
- Most accessed items
- Location utilization

---

## Contributing

To propose a new feature:
1. Create a brainstorm doc in `docs/brainstorms/`
2. Discuss scope and approach
3. Add to this roadmap when approved
4. Create GitHub issues for implementation
