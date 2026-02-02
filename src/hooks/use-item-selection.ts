"use client";

import { useState, useCallback } from "react";

export function useItemSelection(allItemIds: string[] = []) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const select = useCallback((id: string) => {
    setSelectedIds((prev) => new Set(prev).add(id));
  }, []);

  const deselect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(allItemIds));
  }, [allItemIds]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const isAllSelected =
    allItemIds.length > 0 && selectedIds.size === allItemIds.length;

  const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

  return {
    selectedIds: Array.from(selectedIds),
    selectedCount: selectedIds.size,
    toggle,
    select,
    deselect,
    selectAll,
    deselectAll,
    isSelected,
    isAllSelected,
    isSomeSelected,
  };
}
