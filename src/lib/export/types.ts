/**
 * SiFi Data Export Types
 * Defines the structure for JSON and CSV exports
 */

// Export metadata
export interface ExportMetadata {
  version: string;
  exportedAt: string;
  exportFormat: "json" | "csv";
  userEmail: string;
  counts: {
    locations: number;
    items: number;
    tags: number;
    activities: number;
    attachments: number;
  };
}

// Exported location with path info
export interface ExportedLocation {
  id: string;
  name: string;
  description: string | null;
  code: string;
  parentId: string | null;
  parentPath: string | null; // Human-readable path like "Garage > Shelves"
  createdAt: string;
  updatedAt: string;
}

// Exported item with enriched data
export interface ExportedItem {
  id: string;
  type: "container" | "object";
  name: string;
  description: string | null;
  parentLocationId: string | null;
  parentItemId: string | null;
  locationPath: string | null; // Human-readable path
  humanReadableCode: string; // e.g., "GA-BO-12AB34CD"
  tags: string[]; // Tag names
  tagIds: string[]; // Tag IDs for re-import
  activities: string[]; // Activity names
  activityIds: string[]; // Activity IDs for re-import
  photos: string[]; // Photo URLs/base64
  warrantyExpiresAt: string | null;
  maintenanceIntervalDays: number | null;
  lastMaintenanceAt: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: ExportedAttachmentMetadata[];
}

// Attachment metadata (without base64 data for reasonable file sizes)
export interface ExportedAttachmentMetadata {
  id: string;
  title: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sortOrder: number;
  createdAt: string;
}

// Exported tag
export interface ExportedTag {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
}

// Exported activity
export interface ExportedActivity {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  status: "active" | "archived";
  itemIds: string[]; // Items linked to this activity
  createdAt: string;
  updatedAt: string;
}

// Complete JSON export structure
export interface SiFiExport {
  metadata: ExportMetadata;
  locations: ExportedLocation[];
  items: ExportedItem[];
  tags: ExportedTag[];
  activities: ExportedActivity[];
}

// CSV row types (flattened for spreadsheet compatibility)
export interface LocationCsvRow {
  id: string;
  name: string;
  description: string;
  code: string;
  parentId: string;
  parentPath: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemCsvRow {
  id: string;
  type: string;
  name: string;
  description: string;
  humanReadableCode: string;
  locationPath: string;
  tags: string; // Comma-separated
  activities: string; // Comma-separated
  warrantyExpiresAt: string;
  maintenanceIntervalDays: string;
  lastMaintenanceAt: string;
  attachmentCount: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagCsvRow {
  id: string;
  name: string;
  description: string;
  color: string;
  itemCount: string;
  createdAt: string;
}

export interface ActivityCsvRow {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  status: string;
  itemCount: string;
  createdAt: string;
  updatedAt: string;
}
