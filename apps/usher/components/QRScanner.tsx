"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ScanLine, X, CheckCircle, XCircle } from "lucide-react";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  onClose?: () => void;
  forceStop?: boolean;
}

export default function QRScanner({
  onScanSuccess,
  onScanError,
  onClose,
  forceStop,
}: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<"success" | "error" | null>(
    null,
  );
  const stoppingRef = useRef(false);

  useEffect(() => {
    const startScanning = async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" }, // Use back camera on mobile
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            // Success callback
            if (stoppingRef.current) return;
            stoppingRef.current = true;
            setLastResult("success");
            // HARD stop scanner first to avoid overlays intercepting clicks on the result modal.
            await stopScanning();
            onScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Error callback (not a fatal error, just no QR found)
            // Don't show error immediately - only show when QR is actually scanned and invalid
            // This prevents showing "Invalid QR Code" when scanner is just starting
          },
        );

        setIsScanning(true);
        setError(null);
      } catch (err: any) {
        console.error("Error starting scanner:", err);
        setError(err.message || "Failed to start camera");
        setIsScanning(false);
      }
    };

    startScanning();

    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!forceStop) return;
    stoppingRef.current = true;
    stopScanning();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceStop]);

  const stopScanning = async () => {
    if (stoppingRef.current && !scannerRef.current) return;
    if (scannerRef.current) {
      try {
        // html5-qrcode sets its own internal scanning state; we guard with our state too.
        if (isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      setIsScanning(false);
      scannerRef.current = null;
    }
  };

  const handleClose = () => {
    stoppingRef.current = true;
    stopScanning();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
      {/* Close button */}
      {onClose && (
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <X size={24} />
        </button>
      )}

      {/* Scanner container */}
      <div className="relative w-full max-w-md">
        <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />

        {/* Scanning overlay */}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              {/* Scanning frame */}
              <div className="w-64 h-64 border-2 border-white rounded-lg">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
              </div>

              {/* Scanning line animation */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-white/50 animate-pulse" />
            </div>
          </div>
        )}

        {/* Status indicators */}
        {lastResult === "success" && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full">
            <CheckCircle size={20} />
            <span>Scan successful!</span>
          </div>
        )}

        {lastResult === "error" && error && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full">
            <XCircle size={20} />
            <span>Invalid QR code</span>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 text-center text-white px-4">
        <p className="text-lg font-medium mb-2">Position QR code in frame</p>
        <p className="text-sm text-white/70">
          Make sure the QR code is clearly visible and well-lit
        </p>
      </div>
    </div>
  );
}
