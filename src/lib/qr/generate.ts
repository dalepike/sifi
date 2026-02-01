import QRCode from "qrcode";

/**
 * QR Code generation utilities for SiFi
 *
 * QR codes encode the item UUID, which serves as the permanent identifier.
 * When scanned, the app looks up the item by UUID.
 */

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

const defaultOptions: QRCodeOptions = {
  width: 200,
  margin: 2,
  errorCorrectionLevel: "M",
};

/**
 * Generate a QR code as a data URL (base64 PNG)
 * Suitable for displaying in <img> tags
 */
export async function generateQRDataURL(
  uuid: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const opts = { ...defaultOptions, ...options };

  return QRCode.toDataURL(uuid, {
    width: opts.width,
    margin: opts.margin,
    errorCorrectionLevel: opts.errorCorrectionLevel,
  });
}

/**
 * Generate a QR code as SVG string
 * Suitable for embedding directly in HTML or PDF generation
 */
export async function generateQRSVG(
  uuid: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const opts = { ...defaultOptions, ...options };

  return QRCode.toString(uuid, {
    type: "svg",
    width: opts.width,
    margin: opts.margin,
    errorCorrectionLevel: opts.errorCorrectionLevel,
  });
}

/**
 * Generate a QR code as a buffer (PNG)
 * Suitable for server-side image processing
 */
export async function generateQRBuffer(
  uuid: string,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  const opts = { ...defaultOptions, ...options };

  return QRCode.toBuffer(uuid, {
    width: opts.width,
    margin: opts.margin,
    errorCorrectionLevel: opts.errorCorrectionLevel,
  });
}

/**
 * Build the full URL that the QR code should encode
 * This URL will be scanned and redirect to the item detail
 */
export function buildQRUrl(uuid: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "";
  return `${base}/scan/${uuid}`;
}

/**
 * Extract UUID from a scanned QR code URL
 * Returns the UUID if valid, null otherwise
 */
export function extractUUIDFromQR(scannedValue: string): string | null {
  // If it's already a UUID, return it
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(scannedValue)) {
    return scannedValue;
  }

  // Try to extract UUID from URL
  const urlMatch = scannedValue.match(
    /\/scan\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
  );
  if (urlMatch) {
    return urlMatch[1]!;
  }

  return null;
}
