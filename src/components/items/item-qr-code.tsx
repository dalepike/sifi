"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Copy, Printer, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ItemQRCodeProps {
  itemId: string;
  humanReadableCode: string;
  size?: number;
}

export function ItemQRCode({
  itemId,
  humanReadableCode,
  size = 128,
}: ItemQRCodeProps) {
  const [svgData, setSvgData] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function generateQR() {
      setLoading(true);
      try {
        // Generate QR code as SVG string
        const svg = await QRCode.toString(itemId, {
          type: "svg",
          width: size,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        setSvgData(svg);
      } catch (error) {
        console.error("Failed to generate QR code:", error);
      }
      setLoading(false);
    }

    generateQR();
  }, [itemId, size]);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(itemId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handlePrint = () => {
    // Open print-friendly label page
    window.open(`/items/${itemId}/label`, "_blank");
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-32 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* QR Code */}
      <div
        className="inline-block rounded-lg border bg-white p-2"
        dangerouslySetInnerHTML={{ __html: svgData || "" }}
      />

      {/* Human readable code */}
      <div className="flex items-center gap-2">
        <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
          {humanReadableCode}
        </code>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleCopyId}>
          {copied ? (
            <>
              <Check className="mr-2 h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-2 h-3 w-3" />
              Copy UUID
            </>
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-3 w-3" />
          Print Label
        </Button>
      </div>
    </div>
  );
}
