"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface Shortcut {
  key: string;
  label: string;
  description: string;
  action: () => void;
  category: "navigation" | "actions" | "general";
}

export function useKeyboardShortcuts() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);

  const shortcuts: Shortcut[] = [
    // Navigation
    {
      key: "g l",
      label: "g l",
      description: "Go to Locations",
      action: () => router.push("/locations"),
      category: "navigation",
    },
    {
      key: "g t",
      label: "g t",
      description: "Go to Tags",
      action: () => router.push("/tags"),
      category: "navigation",
    },
    {
      key: "g a",
      label: "g a",
      description: "Go to Activities",
      action: () => router.push("/activities"),
      category: "navigation",
    },
    {
      key: "g s",
      label: "g s",
      description: "Go to Scan",
      action: () => router.push("/scan"),
      category: "navigation",
    },
    {
      key: "g p",
      label: "g p",
      description: "Go to Print Queue",
      action: () => router.push("/print-queue"),
      category: "navigation",
    },
    // Actions
    {
      key: "/",
      label: "/",
      description: "Focus search",
      action: () => {
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="earch"]'
        );
        searchInput?.focus();
      },
      category: "actions",
    },
    // General
    {
      key: "?",
      label: "?",
      description: "Show keyboard shortcuts",
      action: () => setHelpOpen(true),
      category: "general",
    },
    {
      key: "Escape",
      label: "Esc",
      description: "Close dialog/modal",
      action: () => {
        // Trigger escape on document to close any open dialogs
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      },
      category: "general",
    },
  ];

  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key;

      // Handle chord shortcuts (g + letter)
      if (pendingKey === "g") {
        const chordKey = `g ${key}`;
        const shortcut = shortcuts.find((s) => s.key === chordKey);
        if (shortcut) {
          e.preventDefault();
          shortcut.action();
        }
        setPendingKey(null);
        return;
      }

      // Start chord with 'g'
      if (key === "g") {
        setPendingKey("g");
        // Clear pending after timeout
        setTimeout(() => setPendingKey(null), 1000);
        return;
      }

      // Handle single-key shortcuts
      const shortcut = shortcuts.find((s) => s.key === key);
      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    },
    [pendingKey, shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts,
    helpOpen,
    setHelpOpen,
    pendingKey,
  };
}
