/**
 * SiFi JSON Export Service
 * Generates complete JSON export of user inventory data
 */

import { db } from "@/lib/db";
import {
  locations,
  items,
  tags,
  activities,
  itemTags,
  activityItems,
  itemAttachments,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type {
  SiFiExport,
  ExportMetadata,
  ExportedLocation,
  ExportedItem,
  ExportedTag,
  ExportedActivity,
  ExportedAttachmentMetadata,
} from "./types";

const EXPORT_VERSION = "1.0.0";

interface LocationData {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
}

/**
 * Build location maps for paths and codes
 */
function buildLocationMaps(allLocations: LocationData[]): {
  pathMap: Map<string, string>;
  codeMap: Map<string, string>;
} {
  const locationById = new Map<string, LocationData>();
  allLocations.forEach((loc) => locationById.set(loc.id, loc));

  const pathMap = new Map<string, string>();
  const codeMap = new Map<string, string>();

  function getPath(locationId: string): string {
    if (pathMap.has(locationId)) {
      return pathMap.get(locationId)!;
    }

    const location = locationById.get(locationId);
    if (!location) return "";

    if (!location.parentId) {
      pathMap.set(locationId, location.name);
      return location.name;
    }

    const parentPath = getPath(location.parentId);
    const fullPath = parentPath ? `${parentPath} > ${location.name}` : location.name;
    pathMap.set(locationId, fullPath);
    return fullPath;
  }

  function getCodes(locationId: string): string {
    if (codeMap.has(locationId)) {
      return codeMap.get(locationId)!;
    }

    const location = locationById.get(locationId);
    if (!location) return "";

    if (!location.parentId) {
      codeMap.set(locationId, location.code);
      return location.code;
    }

    const parentCodes = getCodes(location.parentId);
    const fullCodes = parentCodes ? `${parentCodes}-${location.code}` : location.code;
    codeMap.set(locationId, fullCodes);
    return fullCodes;
  }

  allLocations.forEach((loc) => {
    getPath(loc.id);
    getCodes(loc.id);
  });

  return { pathMap, codeMap };
}

/**
 * Get human-readable code for an item using cached location codes
 */
function getItemCode(
  itemId: string,
  parentLocationId: string | null,
  parentItemId: string | null,
  codeMap: Map<string, string>,
  itemLocationMap: Map<string, string | null>
): string {
  const uuidPrefix = itemId.substring(0, 8).toUpperCase();

  // If item has direct location parent
  if (parentLocationId) {
    const locationCodes = codeMap.get(parentLocationId);
    return locationCodes ? `${locationCodes}-${uuidPrefix}` : uuidPrefix;
  }

  // If item is inside another item (container)
  if (parentItemId) {
    const parentLocation = itemLocationMap.get(parentItemId);
    if (parentLocation) {
      const locationCodes = codeMap.get(parentLocation);
      return locationCodes ? `${locationCodes}-${uuidPrefix}` : uuidPrefix;
    }
  }

  return uuidPrefix;
}

/**
 * Export all user data as JSON
 */
export async function generateJsonExport(
  userId: string,
  userEmail: string
): Promise<SiFiExport> {
  // Fetch all data in parallel
  const [
    allLocations,
    allItems,
    allTags,
    allActivities,
    allItemTags,
    allActivityItems,
    allAttachments,
  ] = await Promise.all([
    db.select().from(locations).where(eq(locations.userId, userId)),
    db.select().from(items).where(eq(items.userId, userId)),
    db.select().from(tags).where(eq(tags.userId, userId)),
    db.select().from(activities).where(eq(activities.userId, userId)),
    db
      .select()
      .from(itemTags)
      .innerJoin(items, eq(itemTags.itemId, items.id))
      .where(eq(items.userId, userId)),
    db
      .select()
      .from(activityItems)
      .innerJoin(activities, eq(activityItems.activityId, activities.id))
      .where(eq(activities.userId, userId)),
    db
      .select({
        id: itemAttachments.id,
        itemId: itemAttachments.itemId,
        title: itemAttachments.title,
        filename: itemAttachments.filename,
        mimeType: itemAttachments.mimeType,
        sizeBytes: itemAttachments.sizeBytes,
        sortOrder: itemAttachments.sortOrder,
        createdAt: itemAttachments.createdAt,
      })
      .from(itemAttachments)
      .where(eq(itemAttachments.userId, userId)),
  ]);

  // Build lookup maps
  const { pathMap, codeMap } = buildLocationMaps(allLocations);

  // Map of item ID to its parent location ID (for code generation)
  const itemLocationMap = new Map<string, string | null>();
  allItems.forEach((item) => {
    itemLocationMap.set(item.id, item.parentLocationId);
  });

  // Build tag name map
  const tagNameMap = new Map<string, string>();
  allTags.forEach((tag) => tagNameMap.set(tag.id, tag.name));

  // Build activity name map
  const activityNameMap = new Map<string, string>();
  allActivities.forEach((act) => activityNameMap.set(act.id, act.name));

  // Build item-tags map
  const itemTagsMap = new Map<string, { names: string[]; ids: string[] }>();
  allItemTags.forEach(({ item_tags }) => {
    const current = itemTagsMap.get(item_tags.itemId) || { names: [], ids: [] };
    const tagName = tagNameMap.get(item_tags.tagId);
    if (tagName) {
      current.names.push(tagName);
      current.ids.push(item_tags.tagId);
    }
    itemTagsMap.set(item_tags.itemId, current);
  });

  // Build item-activities map
  const itemActivitiesMap = new Map<string, { names: string[]; ids: string[] }>();
  allActivityItems.forEach(({ activity_items }) => {
    const current = itemActivitiesMap.get(activity_items.itemId) || {
      names: [],
      ids: [],
    };
    const activityName = activityNameMap.get(activity_items.activityId);
    if (activityName) {
      current.names.push(activityName);
      current.ids.push(activity_items.activityId);
    }
    itemActivitiesMap.set(activity_items.itemId, current);
  });

  // Build activity-items map (reverse)
  const activityItemsMap = new Map<string, string[]>();
  allActivityItems.forEach(({ activity_items }) => {
    const current = activityItemsMap.get(activity_items.activityId) || [];
    current.push(activity_items.itemId);
    activityItemsMap.set(activity_items.activityId, current);
  });

  // Build attachments map
  const attachmentsMap = new Map<string, ExportedAttachmentMetadata[]>();
  allAttachments.forEach((att) => {
    const current = attachmentsMap.get(att.itemId) || [];
    current.push({
      id: att.id,
      title: att.title,
      filename: att.filename,
      mimeType: att.mimeType,
      sizeBytes: att.sizeBytes,
      sortOrder: att.sortOrder ?? 0,
      createdAt: att.createdAt.toISOString(),
    });
    attachmentsMap.set(att.itemId, current);
  });

  // Transform locations
  const exportedLocations: ExportedLocation[] = allLocations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    description: loc.description,
    code: loc.code,
    parentId: loc.parentId,
    parentPath: loc.parentId ? pathMap.get(loc.parentId) || null : null,
    createdAt: loc.createdAt.toISOString(),
    updatedAt: loc.updatedAt.toISOString(),
  }));

  // Transform items with human-readable codes
  const exportedItems: ExportedItem[] = allItems.map((item) => {
    const humanReadableCode = getItemCode(
      item.id,
      item.parentLocationId,
      item.parentItemId,
      codeMap,
      itemLocationMap
    );

    // Get location path
    let locationPath: string | null = null;
    if (item.parentLocationId) {
      locationPath = pathMap.get(item.parentLocationId) || null;
    } else if (item.parentItemId) {
      // Find parent item's location
      const parentItem = allItems.find((i) => i.id === item.parentItemId);
      if (parentItem?.parentLocationId) {
        locationPath = pathMap.get(parentItem.parentLocationId) || null;
      }
    }

    const itemTagData = itemTagsMap.get(item.id) || { names: [], ids: [] };
    const itemActivityData = itemActivitiesMap.get(item.id) || {
      names: [],
      ids: [],
    };

    return {
      id: item.id,
      type: item.type,
      name: item.name,
      description: item.description,
      parentLocationId: item.parentLocationId,
      parentItemId: item.parentItemId,
      locationPath,
      humanReadableCode,
      tags: itemTagData.names,
      tagIds: itemTagData.ids,
      activities: itemActivityData.names,
      activityIds: itemActivityData.ids,
      photos: item.photos ? JSON.parse(item.photos) : [],
      warrantyExpiresAt: item.warrantyExpiresAt?.toISOString() || null,
      maintenanceIntervalDays: item.maintenanceIntervalDays,
      lastMaintenanceAt: item.lastMaintenanceAt?.toISOString() || null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      attachments: attachmentsMap.get(item.id) || [],
    };
  });

  // Transform tags
  const exportedTags: ExportedTag[] = allTags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    description: tag.description,
    color: tag.color,
    createdAt: tag.createdAt.toISOString(),
  }));

  // Transform activities
  const exportedActivities: ExportedActivity[] = allActivities.map((act) => ({
    id: act.id,
    name: act.name,
    description: act.description,
    color: act.color ?? "#6b7280",
    icon: act.icon ?? "folder",
    status: act.status ?? "active",
    itemIds: activityItemsMap.get(act.id) || [],
    createdAt: act.createdAt.toISOString(),
    updatedAt: act.updatedAt.toISOString(),
  }));

  // Build metadata
  const metadata: ExportMetadata = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    exportFormat: "json",
    userEmail,
    counts: {
      locations: exportedLocations.length,
      items: exportedItems.length,
      tags: exportedTags.length,
      activities: exportedActivities.length,
      attachments: allAttachments.length,
    },
  };

  return {
    metadata,
    locations: exportedLocations,
    items: exportedItems,
    tags: exportedTags,
    activities: exportedActivities,
  };
}
