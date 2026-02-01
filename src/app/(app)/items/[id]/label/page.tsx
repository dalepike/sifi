"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { getItem } from "@/actions/items";
import type { ItemWithLocation } from "@/types/domain";

export default function PrintLabelPage() {
  const params = useParams();
  const itemId = params.id as string;

  const [item, setItem] = useState<ItemWithLocation | null>(null);
  const [svgData, setSvgData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Load item
      const result = await getItem(itemId);
      if (result.success) {
        setItem(result.data);

        // Generate QR code
        const svg = await QRCode.toString(result.data.id, {
          type: "svg",
          width: 150,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        setSvgData(svg);

        // Auto-trigger print dialog after loading
        setTimeout(() => {
          window.print();
        }, 500);
      }

      setLoading(false);
    }

    load();
  }, [itemId]);

  if (loading || !item) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading label...</p>
      </div>
    );
  }

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: 2in 1in;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>

      <div className="flex items-center justify-center min-h-screen p-4 print:p-0">
        <div className="border border-dashed border-gray-300 rounded-lg p-4 print:border-none print:p-2">
          {/* Label content */}
          <div className="flex items-center gap-3">
            {/* QR Code */}
            <div
              className="shrink-0"
              dangerouslySetInnerHTML={{ __html: svgData || "" }}
            />

            {/* Info */}
            <div className="min-w-0">
              <p className="font-bold text-lg truncate">{item.name}</p>
              <p className="font-mono text-sm text-gray-600">
                {item.humanReadableCode}
              </p>
              {item.locationPath.length > 0 && (
                <p className="text-xs text-gray-500 truncate">
                  {item.locationPath.map((l) => l.name).join(" → ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Screen-only controls */}
      <div className="fixed bottom-4 right-4 flex gap-2 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Print
        </button>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </>
  );
}
