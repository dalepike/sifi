"use server";

import { auth } from "@/lib/auth";
import { generateQRDataURL, buildQRUrl } from "@/lib/qr";
import { getItemById } from "@/lib/db/items";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Generate a QR code data URL for an item
 */
export async function getItemQRCode(
  itemId: string
): Promise<ActionResult<{ dataUrl: string; url: string }>> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  // Verify item exists and belongs to user
  const item = await getItemById(itemId, userId);
  if (!item) {
    return { success: false, error: "Item not found" };
  }

  try {
    const url = buildQRUrl(itemId);
    const dataUrl = await generateQRDataURL(itemId, {
      width: 200,
      errorCorrectionLevel: "M",
    });

    return { success: true, data: { dataUrl, url } };
  } catch (error) {
    console.error("QR generation error:", error);
    return {
      success: false,
      error: "Failed to generate QR code",
    };
  }
}

/**
 * Generate QR codes for multiple items (for batch label printing)
 */
export async function getItemsQRCodes(
  itemIds: string[]
): Promise<
  ActionResult<Array<{ itemId: string; dataUrl: string; url: string }>>
> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const results = await Promise.all(
      itemIds.map(async (itemId) => {
        // Verify item exists and belongs to user
        const item = await getItemById(itemId, userId);
        if (!item) {
          return null;
        }

        const url = buildQRUrl(itemId);
        const dataUrl = await generateQRDataURL(itemId, {
          width: 200,
          errorCorrectionLevel: "M",
        });

        return { itemId, dataUrl, url };
      })
    );

    // Filter out any items that weren't found
    const validResults = results.filter(
      (r): r is { itemId: string; dataUrl: string; url: string } => r !== null
    );

    return { success: true, data: validResults };
  } catch (error) {
    console.error("Batch QR generation error:", error);
    return {
      success: false,
      error: "Failed to generate QR codes",
    };
  }
}
