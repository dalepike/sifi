"use client";

import { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LabelData } from "@/lib/pdf";

interface PDFLabelButtonProps {
  labels: LabelData[];
}

export function PDFLabelButton({ labels }: PDFLabelButtonProps) {
  const [isClient, setIsClient] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDownload = async () => {
    setDownloading(true);

    try {
      // Dynamic imports
      const { pdf } = await import("@react-pdf/renderer");
      const { LabelDocument } = await import("@/lib/pdf/label-document");

      // Generate PDF blob
      const blob = await pdf(<LabelDocument labels={labels} />).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sifi-labels.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation failed:", error);
    }

    setDownloading(false);
  };

  if (!isClient) {
    return (
      <Button disabled>
        <Printer className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  return (
    <Button onClick={handleDownload} disabled={downloading}>
      <Printer className="mr-2 h-4 w-4" />
      {downloading ? "Generating PDF..." : "Download PDF"}
    </Button>
  );
}
