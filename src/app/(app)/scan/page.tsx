"use client";

import { useRouter } from "next/navigation";
import { QRScanner } from "@/components/scanner";

export default function ScanPage() {
  const router = useRouter();

  const handleScan = (uuid: string) => {
    // Navigate to the scan result handler
    router.push(`/scan/${uuid}`);
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Scan QR Code</h1>
        <p className="text-muted-foreground">
          Point your camera at an item&apos;s QR code
        </p>
      </div>
      <QRScanner onScan={handleScan} />
    </div>
  );
}
