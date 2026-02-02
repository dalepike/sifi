# URGENT: Build Fix Required

**Date:** 2026-02-02
**Issue:** Railway build failed after merging PR #17 (Notifications)

## Missing Dependencies

The notifications feature uses packages that weren't added to package.json:

| Package | Used In |
|---------|---------|
| `swr` | `notification-bell.tsx` - SWR polling |
| `date-fns` | `notification-dropdown.tsx`, `notifications-list.tsx` - time formatting |
| `@/components/ui/switch` | `notification-settings.tsx` - toggle component |

## Fix Commands

Run these commands to fix:

```bash
cd /Users/dalepike/Projects/sifi
bun add swr date-fns
npx shadcn@latest add switch -y
git add -A && git commit -m "fix: add missing dependencies for notifications"
git push
```

## Verify

After pushing, check Railway dashboard for successful build.

## Delete This File

Once the fix is deployed, delete this file:
```bash
rm docs/TODO-BUILD-FIX.md
```
