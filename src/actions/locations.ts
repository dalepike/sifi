"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  createLocation as dbCreateLocation,
  updateLocation as dbUpdateLocation,
  deleteLocation as dbDeleteLocation,
  getLocationById as dbGetLocationById,
  getChildLocations as dbGetChildLocations,
  getLocationsByUserId,
  getLocationWithPath,
  getLocationChildCounts,
  isCodeUnique,
} from "@/lib/db/locations";
import type { Location, LocationWithPath } from "@/types/domain";

const createLocationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  code: z
    .string()
    .length(2, "Code must be exactly 2 characters")
    .regex(/^[A-Za-z0-9]+$/, "Code must be alphanumeric"),
  parentId: z.string().uuid().nullable().optional(),
});

const updateLocationSchema = z.object({
  id: z.string().uuid("Invalid location ID"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .optional(),
  description: z.string().max(500, "Description is too long").optional(),
  code: z
    .string()
    .length(2, "Code must be exactly 2 characters")
    .regex(/^[A-Za-z0-9]+$/, "Code must be alphanumeric")
    .optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function createLocation(
  formData: FormData
): Promise<ActionResult<Location>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const rawData = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    code: formData.get("code"),
    parentId: formData.get("parentId") || null,
  };

  const parsed = createLocationSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const { name, description, code, parentId } = parsed.data;

  // Check code uniqueness
  if (!isCodeUnique(code, userId)) {
    return {
      success: false,
      error: "A location with this code already exists",
    };
  }

  // If parentId is provided, verify it exists and belongs to user
  if (parentId) {
    const parent = dbGetLocationById(parentId, userId);
    if (!parent) {
      return { success: false, error: "Parent location not found" };
    }
  }

  try {
    const location = dbCreateLocation({
      userId,
      name,
      description: description || null,
      code,
      parentId: parentId || null,
    });

    revalidatePath("/locations");
    return { success: true, data: location };
  } catch (error) {
    console.error("Create location error:", error);
    return {
      success: false,
      error: "Failed to create location. Please try again.",
    };
  }
}

export async function updateLocation(
  formData: FormData
): Promise<ActionResult<Location>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const rawData = {
    id: formData.get("id"),
    name: formData.get("name") || undefined,
    description: formData.get("description"),
    code: formData.get("code") || undefined,
    parentId: formData.has("parentId") ? formData.get("parentId") || null : undefined,
  };

  const parsed = updateLocationSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const { id, name, description, code, parentId } = parsed.data;

  // Verify location exists and belongs to user
  const existing = dbGetLocationById(id, userId);
  if (!existing) {
    return { success: false, error: "Location not found" };
  }

  // Check code uniqueness if code is being changed
  if (code && !isCodeUnique(code, userId, id)) {
    return {
      success: false,
      error: "A location with this code already exists",
    };
  }

  // If parentId is being changed, verify it's valid
  if (parentId !== undefined && parentId !== null) {
    // Cannot set self as parent
    if (parentId === id) {
      return { success: false, error: "A location cannot be its own parent" };
    }

    const parent = dbGetLocationById(parentId, userId);
    if (!parent) {
      return { success: false, error: "Parent location not found" };
    }

    // Check for circular reference
    const parentPath = getLocationWithPath(parentId, userId);
    if (parentPath?.path.some((loc) => loc.id === id)) {
      return { success: false, error: "Cannot create circular hierarchy" };
    }
  }

  try {
    const location = dbUpdateLocation(id, userId, {
      name,
      description: description !== undefined ? description || null : undefined,
      code,
      parentId,
    });

    if (!location) {
      return { success: false, error: "Failed to update location" };
    }

    revalidatePath("/locations");
    return { success: true, data: location };
  } catch (error) {
    console.error("Update location error:", error);
    return {
      success: false,
      error: "Failed to update location. Please try again.",
    };
  }
}

export async function deleteLocation(
  id: string
): Promise<ActionResult<{ deleted: boolean }>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  // Verify location exists and belongs to user
  const existing = dbGetLocationById(id, userId);
  if (!existing) {
    return { success: false, error: "Location not found" };
  }

  try {
    const deleted = dbDeleteLocation(id, userId);
    revalidatePath("/locations");
    return { success: true, data: { deleted } };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "Failed to delete location. Please try again.",
    };
  }
}

export async function getLocation(
  id: string
): Promise<ActionResult<LocationWithPath>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const location = getLocationWithPath(id, userId);
  if (!location) {
    return { success: false, error: "Location not found" };
  }

  return { success: true, data: location };
}

export async function getLocations(
  parentId?: string | null
): Promise<ActionResult<Location[]>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const locations = dbGetChildLocations(parentId ?? null, userId);
  return { success: true, data: locations };
}

export async function getLocationChildren(id: string): Promise<
  ActionResult<{
    counts: { locations: number; items: number };
    children: Location[];
  }>
> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const counts = getLocationChildCounts(id, userId);
  const children = dbGetChildLocations(id, userId);

  return { success: true, data: { counts, children } };
}

export async function getAllLocations(): Promise<
  ActionResult<{ locations: Location[]; counts: Map<string, { locations: number; items: number }> }>
> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  const locations = getLocationsByUserId(userId);

  // Build counts map for all locations
  const countsMap = new Map<string, { locations: number; items: number }>();
  for (const loc of locations) {
    countsMap.set(loc.id, getLocationChildCounts(loc.id, userId));
  }

  // Convert Map to plain object for serialization
  const countsObject = Object.fromEntries(countsMap);

  return {
    success: true,
    data: {
      locations,
      counts: countsObject as unknown as Map<string, { locations: number; items: number }>
    }
  };
}
