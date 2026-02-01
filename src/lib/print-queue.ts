/**
 * Print Queue - localStorage-based queue for label printing
 *
 * Stores item IDs that the user wants to print labels for.
 * Queue persists in localStorage for single-user, single-device use.
 */

const STORAGE_KEY = "sifi-print-queue";

export interface PrintQueueItem {
  itemId: string;
  addedAt: string;
}

/**
 * Get all items in the print queue
 */
export function getPrintQueue(): PrintQueueItem[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Add an item to the print queue
 * Does nothing if the item is already in the queue
 */
export function addToPrintQueue(itemId: string): void {
  if (typeof window === "undefined") return;

  const queue = getPrintQueue();

  // Don't add duplicates
  if (queue.some((q) => q.itemId === itemId)) {
    return;
  }

  queue.push({
    itemId,
    addedAt: new Date().toISOString(),
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));

  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent("print-queue-change", { detail: queue }));
}

/**
 * Remove an item from the print queue
 */
export function removeFromPrintQueue(itemId: string): void {
  if (typeof window === "undefined") return;

  const queue = getPrintQueue();
  const filtered = queue.filter((q) => q.itemId !== itemId);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

  // Dispatch event for UI updates
  window.dispatchEvent(
    new CustomEvent("print-queue-change", { detail: filtered })
  );
}

/**
 * Clear the entire print queue
 */
export function clearPrintQueue(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEY);

  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent("print-queue-change", { detail: [] }));
}

/**
 * Check if an item is in the print queue
 */
export function isInPrintQueue(itemId: string): boolean {
  const queue = getPrintQueue();
  return queue.some((q) => q.itemId === itemId);
}

/**
 * Get the number of items in the print queue
 */
export function getPrintQueueCount(): number {
  return getPrintQueue().length;
}
