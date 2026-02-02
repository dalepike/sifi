/**
 * SiFi CSV Export Service
 * Generates CSV files for spreadsheet compatibility
 */

import { generateJsonExport } from "./export-json";
import type {
  SiFiExport,
  LocationCsvRow,
  ItemCsvRow,
  TagCsvRow,
  ActivityCsvRow,
} from "./types";

/**
 * Escape a value for CSV (handles commas, quotes, newlines)
 */
function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value);

  // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV<T extends object>(
  data: T[],
  columns: (keyof T)[]
): string {
  // Header row
  const header = columns.map((col) => escapeCSV(String(col))).join(",");

  // Data rows
  const rows = data.map((row) =>
    columns.map((col) => escapeCSV(row[col] as string | number | null)).join(",")
  );

  return [header, ...rows].join("\n");
}

/**
 * Generate locations CSV
 */
function generateLocationsCSV(exportData: SiFiExport): string {
  const rows: LocationCsvRow[] = exportData.locations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    description: loc.description || "",
    code: loc.code,
    parentId: loc.parentId || "",
    parentPath: loc.parentPath || "",
    createdAt: loc.createdAt,
    updatedAt: loc.updatedAt,
  }));

  return arrayToCSV(rows, [
    "id",
    "name",
    "description",
    "code",
    "parentId",
    "parentPath",
    "createdAt",
    "updatedAt",
  ]);
}

/**
 * Generate items CSV
 */
function generateItemsCSV(exportData: SiFiExport): string {
  const rows: ItemCsvRow[] = exportData.items.map((item) => ({
    id: item.id,
    type: item.type,
    name: item.name,
    description: item.description || "",
    humanReadableCode: item.humanReadableCode,
    locationPath: item.locationPath || "",
    tags: item.tags.join("; "),
    activities: item.activities.join("; "),
    warrantyExpiresAt: item.warrantyExpiresAt || "",
    maintenanceIntervalDays: item.maintenanceIntervalDays?.toString() || "",
    lastMaintenanceAt: item.lastMaintenanceAt || "",
    attachmentCount: item.attachments.length.toString(),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  return arrayToCSV(rows, [
    "id",
    "type",
    "name",
    "description",
    "humanReadableCode",
    "locationPath",
    "tags",
    "activities",
    "warrantyExpiresAt",
    "maintenanceIntervalDays",
    "lastMaintenanceAt",
    "attachmentCount",
    "createdAt",
    "updatedAt",
  ]);
}

/**
 * Generate tags CSV
 */
function generateTagsCSV(exportData: SiFiExport): string {
  // Count items per tag
  const tagItemCounts = new Map<string, number>();
  exportData.items.forEach((item) => {
    item.tagIds.forEach((tagId) => {
      tagItemCounts.set(tagId, (tagItemCounts.get(tagId) || 0) + 1);
    });
  });

  const rows: TagCsvRow[] = exportData.tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    description: tag.description || "",
    color: tag.color,
    itemCount: (tagItemCounts.get(tag.id) || 0).toString(),
    createdAt: tag.createdAt,
  }));

  return arrayToCSV(rows, [
    "id",
    "name",
    "description",
    "color",
    "itemCount",
    "createdAt",
  ]);
}

/**
 * Generate activities CSV
 */
function generateActivitiesCSV(exportData: SiFiExport): string {
  const rows: ActivityCsvRow[] = exportData.activities.map((activity) => ({
    id: activity.id,
    name: activity.name,
    description: activity.description || "",
    color: activity.color,
    icon: activity.icon,
    status: activity.status,
    itemCount: activity.itemIds.length.toString(),
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
  }));

  return arrayToCSV(rows, [
    "id",
    "name",
    "description",
    "color",
    "icon",
    "status",
    "itemCount",
    "createdAt",
    "updatedAt",
  ]);
}

/**
 * Generate metadata CSV (single row with export info)
 */
function generateMetadataCSV(exportData: SiFiExport): string {
  const meta = exportData.metadata;
  return [
    "field,value",
    `exportVersion,${meta.version}`,
    `exportedAt,${meta.exportedAt}`,
    `userEmail,${escapeCSV(meta.userEmail)}`,
    `locationCount,${meta.counts.locations}`,
    `itemCount,${meta.counts.items}`,
    `tagCount,${meta.counts.tags}`,
    `activityCount,${meta.counts.activities}`,
    `attachmentCount,${meta.counts.attachments}`,
  ].join("\n");
}

export interface CsvExportFiles {
  "metadata.csv": string;
  "locations.csv": string;
  "items.csv": string;
  "tags.csv": string;
  "activities.csv": string;
}

/**
 * Generate all CSV files for export
 */
export async function generateCsvExport(
  userId: string,
  userEmail: string
): Promise<CsvExportFiles> {
  // Get the JSON export data first
  const exportData = await generateJsonExport(userId, userEmail);

  // Update metadata format
  exportData.metadata.exportFormat = "csv";

  return {
    "metadata.csv": generateMetadataCSV(exportData),
    "locations.csv": generateLocationsCSV(exportData),
    "items.csv": generateItemsCSV(exportData),
    "tags.csv": generateTagsCSV(exportData),
    "activities.csv": generateActivitiesCSV(exportData),
  };
}
