"use client";

import { useEffect, useState, useCallback } from "react";
import { Printer, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PDFLabelButton } from "@/components/print";
import {
  getPrintQueue,
  removeFromPrintQueue,
  clearPrintQueue,
  type PrintQueueItem,
} from "@/lib/print-queue";
import { getItem } from "@/actions/items";
import { getItemQRCode } from "@/actions/qr";
import type { ItemWithLocation } from "@/types/domain";
import type { LabelData } from "@/lib/pdf";

interface QueueItemWithDetails extends PrintQueueItem {
  item?: ItemWithLocation;
  loading: boolean;
  error?: string;
}

export default function PrintQueuePage() {
  const [queueItems, setQueueItems] = useState<QueueItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [labelData, setLabelData] = useState<LabelData[] | null>(null);

  // Load queue and item details
  const loadQueue = useCallback(async () => {
    setLoading(true);
    const queue = getPrintQueue();

    // Initialize items with loading state
    const initialItems: QueueItemWithDetails[] = queue.map((q) => ({
      ...q,
      loading: true,
    }));
    setQueueItems(initialItems);

    // Load details for each item
    const itemsWithDetails = await Promise.all(
      queue.map(async (q) => {
        const result = await getItem(q.itemId);
        if (result.success) {
          return {
            ...q,
            item: result.data,
            loading: false,
          };
        }
        return {
          ...q,
          loading: false,
          error: result.error,
        };
      })
    );

    setQueueItems(itemsWithDetails);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadQueue();

    // Listen for queue changes
    const handleQueueChange = () => loadQueue();
    window.addEventListener("print-queue-change", handleQueueChange);
    return () =>
      window.removeEventListener("print-queue-change", handleQueueChange);
  }, [loadQueue]);

  const handleRemove = (itemId: string) => {
    removeFromPrintQueue(itemId);
    setQueueItems((prev) => prev.filter((q) => q.itemId !== itemId));
  };

  const handleClear = () => {
    clearPrintQueue();
    setQueueItems([]);
    setLabelData(null);
  };

  const handleGenerateLabels = async () => {
    setGeneratingPdf(true);

    // Get QR codes for all items
    const validItems = queueItems.filter((q) => q.item);
    const labels: LabelData[] = [];

    for (const q of validItems) {
      if (!q.item) continue;

      const qrResult = await getItemQRCode(q.itemId);
      if (qrResult.success) {
        labels.push({
          itemId: q.itemId,
          name: q.item.name,
          humanReadableCode: q.item.humanReadableCode,
          qrDataUrl: qrResult.data.dataUrl,
        });
      }
    }

    setLabelData(labels);
    setGeneratingPdf(false);
  };

  const validItemCount = queueItems.filter((q) => q.item).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Print Queue</h1>
          <p className="text-muted-foreground">
            {validItemCount} label{validItemCount !== 1 && "s"} ready for printing
          </p>
        </div>
        <div className="flex gap-2">
          {queueItems.length > 0 && (
            <Button variant="outline" onClick={handleClear}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : queueItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Printer className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">Queue is empty</p>
            <p className="text-muted-foreground">
              Add items to the print queue from item detail pages
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Queue items list */}
          <div className="space-y-2">
            {queueItems.map((q) => (
              <Card key={q.itemId}>
                <CardContent className="flex items-center justify-between py-3">
                  {q.loading ? (
                    <Skeleton className="h-6 w-48" />
                  ) : q.error ? (
                    <div className="text-sm text-destructive">{q.error}</div>
                  ) : q.item ? (
                    <div>
                      <p className="font-medium">{q.item.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {q.item.humanReadableCode}
                      </p>
                    </div>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(q.itemId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Print actions */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Labels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Labels will be formatted for Avery 5160 sheets (30 labels per page,
                2.625&quot; x 1&quot; each).
              </p>

              {!labelData ? (
                <Button
                  onClick={handleGenerateLabels}
                  disabled={generatingPdf || validItemCount === 0}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {generatingPdf ? "Generating..." : "Generate PDF"}
                </Button>
              ) : (
                <div className="flex items-center gap-4">
                  <PDFLabelButton labels={labelData} />
                  <Button variant="outline" onClick={() => setLabelData(null)}>
                    Regenerate
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
