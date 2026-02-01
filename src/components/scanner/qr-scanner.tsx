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
  const isMountedRef = useRef(true);
  const isStoppingRef = useRef(false);

  // Initialize scanner
  useEffect(() => {
    const scannerId = "qr-scanner-container";
    isMountedRef.current = true;

    // Check for cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMountedRef.current) return;
        if (devices && devices.length > 0) {
          setCameras(devices.map((d) => ({ id: d.id, label: d.label })));
          setHasCamera(true);
        } else {
          setHasCamera(false);
        }
      })
      .catch(() => {
        if (isMountedRef.current) {
          setHasCamera(false);
        }
      });

    // Create scanner instance
    scannerRef.current = new Html5Qrcode(scannerId);

    return () => {
      // Mark as unmounted to prevent state updates
      isMountedRef.current = false;

      // Cleanup on unmount
      const scanner = scannerRef.current;
      scannerRef.current = null;

      const container = document.getElementById(scannerId);

      // First, stop the scanner if running
      if (scanner) {
        try {
          const state = scanner.getState();
          if (state === Html5QrcodeScannerState.SCANNING) {
            // Don't await - just fire and forget
            scanner.stop().catch(() => {});
          }
        } catch {
          // Scanner may already be in invalid state
        }
      }

      // Clear the container's children BEFORE React tries to unmount
      // This prevents React from trying to remove nodes that html5-qrcode already removed
      if (container) {
        container.innerHTML = "";
      }
    };
  }, []);

  const startScanning = useCallback(async () => {
    if (!scannerRef.current || cameras.length === 0 || isStoppingRef.current) return;

    setError(null);

    try {
      await scannerRef.current.start(
        cameras[currentCameraIndex]?.id || { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Prevent multiple scans
          if (isStoppingRef.current) return;

          // Extract UUID from scanned value
          const uuid = extractUUIDFromQR(decodedText);
          if (uuid) {
            isStoppingRef.current = true;

            // Stop scanning first, then call callback
            const scanner = scannerRef.current;
            // Clear ref so cleanup effect doesn't try to stop again
            scannerRef.current = null;

            try {
              if (scanner) {
                const state = scanner.getState();
                if (state === Html5QrcodeScannerState.SCANNING) {
                  await scanner.stop();
                }
              }
            } catch {
              // Ignore stop errors
            }

            if (isMountedRef.current) {
              setIsScanning(false);
            }

            // Longer delay to let html5-qrcode finish DOM cleanup before React navigation
            // The library does async cleanup that can race with React's unmount
            await new Promise(resolve => setTimeout(resolve, 150));
            onScan(uuid);
          }
        },
        () => {
          // Ignore scan failures (no QR in frame)
        }
      );
      if (isMountedRef.current) {
        setIsScanning(true);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const message =
        err instanceof Error ? err.message : "Failed to start camera";
      setError(message);
      onError?.(message);
    }
  }, [cameras, currentCameraIndex, onScan, onError]);

  const stopScanning = useCallback(async () => {
    if (!scannerRef.current || isStoppingRef.current) return;

    isStoppingRef.current = true;
    try {
      const state = scannerRef.current.getState();
      if (state === Html5QrcodeScannerState.SCANNING) {
        await scannerRef.current.stop();
      }
      if (isMountedRef.current) {
        setIsScanning(false);
      }
    } catch (err) {
      console.error("Failed to stop scanner:", err);
    } finally {
      isStoppingRef.current = false;
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
      {/* Scanner viewport - use wrapper to isolate html5-qrcode DOM changes from React */}
      <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-lg bg-black">
        {/* Inner container managed by html5-qrcode - React won't track children */}
        <div
          id="qr-scanner-container"
          ref={containerRef}
          className="w-full h-full"
          // Suppress React's DOM diffing for this subtree since html5-qrcode manages it
          suppressHydrationWarning
        />
        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted pointer-events-none">
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
