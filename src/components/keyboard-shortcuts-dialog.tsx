"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Shortcut } from "@/hooks/use-keyboard-shortcuts";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: Shortcut[];
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
  shortcuts,
}: KeyboardShortcutsDialogProps) {
  const categories = {
    navigation: "Navigation",
    actions: "Actions",
    general: "General",
  };

  const groupedShortcuts = shortcuts.reduce<Record<string, Shortcut[]>>(
    (acc, shortcut) => {
      const category = shortcut.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category]!.push(shortcut);
      return acc;
    },
    {}
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate quickly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {(Object.keys(categories) as Array<keyof typeof categories>).map(
            (category) => {
              const categoryShortcuts = groupedShortcuts[category];
              if (!categoryShortcuts?.length) return null;

              return (
                <div key={category}>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    {categories[category]}
                  </h3>
                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut) => (
                      <div
                        key={shortcut.key}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{shortcut.description}</span>
                        <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">
                          {shortcut.label}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Press <kbd className="rounded bg-muted px-1 font-mono">?</kbd> anytime
          to show this help.
        </p>
      </DialogContent>
    </Dialog>
  );
}
