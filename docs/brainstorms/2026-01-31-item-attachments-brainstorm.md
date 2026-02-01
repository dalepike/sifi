# Brainstorm: Item Attachments

**Date:** 2026-01-31
**Status:** Ready for planning

---

## What We're Building

Add the ability to attach files (PDFs, images, any file type) to items in SiFi. When you scan a QR code on an object, you can see:
- User manuals
- Purchase receipts/warranties
- Notes and documentation
- Any related files

Each attachment has a user-defined title/label and can be reordered on the item detail page.

---

## Why This Approach

**Chosen: Separate Attachments Table**

A dedicated `item_attachments` table provides:
- Clean relational model with proper foreign keys
- Easy ordering via `sort_order` column (supports drag-to-reorder)
- Query flexibility for future features
- Clear separation from the existing photos field

**Rejected alternatives:**
- *Inline JSON (like photos)*: Harder to reorder, mixes concerns
- *External file storage*: Overkill for <5MB files, loses portability

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| File types | Any | Maximum flexibility |
| File size | Target <5MB | Typical receipts, manuals, photos |
| Storage | Base64 in SQLite | Consistent with photos, self-contained |
| Organization | Flat list with titles | Simple UX, user names each attachment |
| Ordering | Manual sort order | User controls display sequence |
| Sharing | Per-item copies | Simpler model, no cross-item linking |
| Viewing | Click opens in new tab | Browser handles display, minimal code |

---

## Proposed Data Model

```sql
CREATE TABLE item_attachments (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,           -- User-defined label
  filename TEXT NOT NULL,        -- Original filename
  mime_type TEXT NOT NULL,       -- e.g., 'application/pdf'
  data TEXT NOT NULL,            -- Base64 encoded file content
  size_bytes INTEGER NOT NULL,   -- For display/validation
  sort_order INTEGER DEFAULT 0,  -- For manual ordering
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_item_attachments_item ON item_attachments(item_id);
```

---

## UI Touchpoints

1. **Item Detail Page**
   - New "Attachments" section below photos
   - List of attachments with icon, title, filename, size
   - Click opens in new browser tab
   - Drag handles for reordering
   - Delete button per attachment

2. **Add Attachment**
   - "Attach File" button opens file picker
   - After selection, prompt for title (default: filename)
   - Upload with loading indicator
   - Validate size (<5MB recommended)

3. **Edit Attachment**
   - Edit title inline or via dialog
   - Replace file option

---

## Open Questions

1. **Size limit enforcement?** Hard limit vs. warning? (Suggest: 10MB hard limit with warning at 5MB)
2. **Duplicate detection?** Warn if same filename already attached? (Suggest: Allow duplicates, user responsibility)
3. **Bulk upload?** Select multiple files at once? (Suggest: Yes, each gets title prompt)

---

## Success Criteria

- [ ] Can attach any file type to an item
- [ ] Each attachment has a custom title
- [ ] Attachments display on item detail page
- [ ] Click opens attachment in new tab
- [ ] Can reorder attachments via drag-and-drop
- [ ] Can delete attachments
- [ ] Works on mobile (touch drag or move up/down buttons)

---

## Next Steps

Run `/workflows:plan` to create implementation plan.
