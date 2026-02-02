"use server";

import { auth } from "@/lib/auth";
import { generateJsonExport, generateCsvExport } from "@/lib/export";
import type { SiFiExport, CsvExportFiles } from "@/lib/export";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function getUserEmail(): Promise<string | null> {
  const session = await auth();
  return session?.user?.email ?? null;
}

/**
 * Export user data as JSON
 */
export async function exportAsJson(): Promise<ActionResult<SiFiExport>> {
  const userId = await getUserId();
  const userEmail = await getUserEmail();

  if (!userId || !userEmail) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const exportData = await generateJsonExport(userId, userEmail);
    return { success: true, data: exportData };
  } catch (error) {
    console.error("JSON export error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Export failed",
    };
  }
}

/**
 * Export user data as CSV files
 */
export async function exportAsCsv(): Promise<ActionResult<CsvExportFiles>> {
  const userId = await getUserId();
  const userEmail = await getUserEmail();

  if (!userId || !userEmail) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const csvFiles = await generateCsvExport(userId, userEmail);
    return { success: true, data: csvFiles };
  } catch (error) {
    console.error("CSV export error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Export failed",
    };
  }
}

/**
 * Get export statistics (counts) without full export
 */
export async function getExportStats(): Promise<
  ActionResult<{
    locations: number;
    items: number;
    tags: number;
    activities: number;
    attachments: number;
  }>
> {
  const userId = await getUserId();
  const userEmail = await getUserEmail();

  if (!userId || !userEmail) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Use the JSON export to get counts (metadata includes counts)
    const exportData = await generateJsonExport(userId, userEmail);
    return { success: true, data: exportData.metadata.counts };
  } catch (error) {
    console.error("Export stats error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get stats",
    };
  }
}
