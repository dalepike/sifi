"use client";

import Link from "next/link";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScanButton() {
  return (
    <Button variant="outline" className="h-9" asChild>
      <Link href="/scan">
        <QrCode className="h-5 w-5 sm:mr-2" />
        <span className="hidden sm:inline">Scan QR</span>
        <span className="sr-only sm:hidden">Scan QR Code</span>
      </Link>
    </Button>
  );
}
