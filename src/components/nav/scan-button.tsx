"use client";

import Link from "next/link";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScanButton() {
  return (
    <Link href="/scan">
      <Button size="icon" variant="outline" className="h-9 w-9">
        <QrCode className="h-5 w-5" />
        <span className="sr-only">Scan QR Code</span>
      </Button>
    </Link>
  );
}
