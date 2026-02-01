"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { Camera, CameraOff, FlipHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractUUIDFromQR } from "@/lib/qr";

interface QRScannerProps {
  onScan: (uuid: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [manualUuid, setManualUuid] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize scanner
  useEffect(() => {
    const scannerId = "qr-scanner-container";

    // Check for cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices.map((d) => ({ id: d.id, label: d.label })));
          setHasCamera(true);
        } else {
          setHasCamera(false);
        }
      })
      .catch(() => {
        setHasCamera(false);
      });

    // Create scanner instance
    scannerRef.current = new Html5Qrcode(scannerId);

    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          scannerRef.current.stop().catch(() => {});
        }
      }
    };
  }, []);

  const startScanning = useCallback(async () => {
    if (!scannerRef.current || cameras.length === 0) return;

    setError(null);

    try {
      await scannerRef.current.start(
        cameras[currentCameraIndex]?.id || { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Extract UUID from scanned value
          const uuid = extractUUIDFromQR(decodedText);
          if (uuid) {
            // Stop scanning and call callback
            scannerRef.current?.stop().then(() => {
              setIsScanning(false);
              onScan(uuid);
            });
          }
        },
        () => {
          // Ignore scan failures (no QR in frame)
        }
      );
      setIsScanning(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start camera";
      setError(message);
      onError?.(message);
    }
  }, [cameras, currentCameraIndex, onScan, onError]);

  const stopScanning = useCallback(async () => {
    if (!scannerRef.current) return;

    try {
      await scannerRef.current.stop();
      setIsScanning(false);
    } catch (err) {
      console.error("Failed to stop scanner:", err);
    }
  }, []);

  const switchCamera = useCallback(async () => {
    if (cameras.length <= 1) return;

    const wasScanning = isScanning;
    if (wasScanning) {
      await stopScanning();
    }

    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);

    if (wasScanning) {
      // Small delay to allow camera switch
      setTimeout(() => {
        startScanning();
      }, 100);
    }
  }, [cameras.length, currentCameraIndex, isScanning, startScanning, stopScanning]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const uuid = extractUUIDFromQR(manualUuid.trim());
    if (uuid) {
      onScan(uuid);
    } else {
      setError("Invalid UUID format");
    }
  };

  return (
    <div className="space-y-4">
      {/* Scanner viewport */}
      <div
        id="qr-scanner-container"
        ref={containerRef}
        className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-lg bg-black"
      >
        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Camera className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Controls */}
      {hasCamera ? (
        <div className="flex items-center justify-center gap-2">
          {isScanning ? (
            <>
              <Button onClick={stopScanning} variant="outline">
                <CameraOff className="mr-2 h-4 w-4" />
                Stop
              </Button>
              {cameras.length > 1 && (
                <Button onClick={switchCamera} variant="outline" size="icon">
                  <FlipHorizontal className="h-4 w-4" />
                </Button>
              )}
            </>
          ) : (
            <Button onClick={startScanning}>
              <Camera className="mr-2 h-4 w-4" />
              Start Scanning
            </Button>
          )}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          No camera available. Use manual entry below.
        </p>
      )}

      {/* Manual UUID entry fallback */}
      <div className="border-t pt-4">
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <Label htmlFor="manual-uuid">Or enter UUID manually</Label>
          <div className="flex gap-2">
            <Input
              id="manual-uuid"
              value={manualUuid}
              onChange={(e) => setManualUuid(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="font-mono text-sm"
            />
            <Button type="submit" variant="secondary">
              Go
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
