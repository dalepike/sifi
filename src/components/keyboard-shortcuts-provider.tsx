"use client";

import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";

export function KeyboardShortcutsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { shortcuts, helpOpen, setHelpOpen, pendingKey } = useKeyboardShortcuts();

  return (
    <>
      {children}

      {/* Visual indicator for chord in progress */}
      {pendingKey && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-card border shadow-lg px-3 py-2">
          <span className="text-sm text-muted-foreground">
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              {pendingKey}
            </kbd>
            <span className="ml-1">...</span>
          </span>
        </div>
      )}

      <KeyboardShortcutsDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        shortcuts={shortcuts}
      />
    </>
  );
}
