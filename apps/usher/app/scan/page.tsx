"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { decryptInvitationData } from "@/lib/qr-utils";
import {
  saveOfflineScan,
  getUnsyncedScans,
  markScanAsSynced,
  getAllOfflineScans,
  type OfflineScanLog,
} from "@/lib/offline-storage";
import QRScanner from "@/components/QRScanner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ScanLine,
  History,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import type { User, Invitation } from "@/lib/types";

export default function ScanPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanHistory, setScanHistory] = useState<OfflineScanLog[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastScan, setLastScan] = useState<{
    guest_name: string;
    guest_phone: string | null;
    group_size: number;
    admit_count: number;
    result: "ADMIT" | "REJECT";
    message: string;
    scanned_at: string;
  } | null>(null);

  useEffect(() => {
    checkAuth();
    loadScanHistory();
    checkOnlineStatus();

    // Listen for online/offline events
    const handleOnlineEvent = () => setIsOnline(true);
    const handleOfflineEvent = () => setIsOnline(false);

    window.addEventListener("online", handleOnlineEvent);
    window.addEventListener("offline", handleOfflineEvent);

    // Auto-sync when coming online
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineScans();
    };
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("online", handleOnlineEvent);
      window.removeEventListener("offline", handleOfflineEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    // Get user details from users table
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .eq("role", "USHER")
      .single();

    if (!userData) {
      router.replace("/login");
      return;
    }

    setCurrentUser(userData);
    setIsAuthenticated(true);
  }

  async function loadScanHistory() {
    const history = await getAllOfflineScans();
    setScanHistory(history.sort((a, b) => 
      new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime()
    ));
  }

  function checkOnlineStatus() {
    setIsOnline(navigator.onLine);
  }

  async function handleScanSuccess(decodedText: string) {
    try {
      // Decrypt QR token
      const invitationData = decryptInvitationData(decodedText);

      if (!invitationData) {
        setLastScan({
          guest_name: "Unknown",
          guest_phone: null,
          group_size: 0,
          admit_count: 0,
          result: "REJECT",
          message: "Invalid QR code. Please scan a valid invitation QR code.",
          scanned_at: new Date().toISOString(),
        });
        return;
      }

      // Fetch invitation from database
      const { data: invitation, error: invError } = await supabase
        .from("invitations")
        .select("*")
        .eq("id", invitationData.id)
        .single();

      if (invError || !invitation) {
        setLastScan({
          guest_name: invitationData.name || "Unknown",
          guest_phone: null,
          group_size: 0,
          admit_count: 0,
          result: "REJECT",
          message: "Invitation not found in database.",
          scanned_at: new Date().toISOString(),
        });
        return;
      }

      // Type assertion for invitation
      const invitationDataTyped = invitation as Invitation;

      // Check if already used
      if (invitationDataTyped.status === "USED") {
        const shouldAdmit = confirm(
          `This invitation was already used. Do you want to admit ${invitationDataTyped.guest_name} again?`
        );
        if (!shouldAdmit) return;
      }

      // Determine result (for now, always admit if valid)
      const result: "ADMIT" | "REJECT" = "ADMIT";
      const admitCount = invitationDataTyped.group_size;

      if (!currentUser) {
        setLastScan({
          guest_name: invitationDataTyped.guest_name,
          guest_phone: invitationDataTyped.guest_phone,
          group_size: invitationDataTyped.group_size,
          admit_count: admitCount,
          result: "REJECT",
          message: "User not authenticated",
          scanned_at: new Date().toISOString(),
        });
        return;
      }

      // Create scan log
      const scanLog: OfflineScanLog = {
        id: crypto.randomUUID(),
        invitation_id: invitationDataTyped.id,
        usher_id: currentUser.id,
        scanned_at: new Date().toISOString(),
        admit_count: admitCount,
        result,
        mode: isOnline ? "ONLINE" : "OFFLINE",
        synced: false,
        guest_name: invitationDataTyped.guest_name,
        guest_phone: invitationDataTyped.guest_phone || undefined,
        group_size: invitationDataTyped.group_size,
      };

      if (isOnline) {
        // Try to save online
        try {
          const { error: scanError } = await supabase
            .from("scan_logs")
            .insert({
              invitation_id: invitationDataTyped.id,
              usher_id: currentUser.id,
              scanned_at: scanLog.scanned_at,
              admit_count: admitCount,
              result,
              mode: "ONLINE",
              synced: true,
            });

          if (scanError) throw scanError;

          // Update invitation status
          await supabase
            .from("invitations")
            .update({
              status: "USED",
              checked_in_count: admitCount,
            })
            .eq("id", invitationDataTyped.id);

          scanLog.synced = true;
          setLastScan({
            guest_name: invitationDataTyped.guest_name,
            guest_phone: invitationDataTyped.guest_phone,
            group_size: invitationDataTyped.group_size,
            admit_count: admitCount,
            result: "ADMIT",
            message: `Admitted (${admitCount} guest${admitCount > 1 ? "s" : ""})`,
            scanned_at: scanLog.scanned_at,
          });
        } catch (error) {
          console.error("Error saving scan online:", error);
          // Fall back to offline storage
          await saveOfflineScan(scanLog);
          setLastScan({
            guest_name: invitationDataTyped.guest_name,
            guest_phone: invitationDataTyped.guest_phone,
            group_size: invitationDataTyped.group_size,
            admit_count: admitCount,
            result: "ADMIT",
            message: "Saved offline (will sync when online).",
            scanned_at: scanLog.scanned_at,
          });
        }
      } else {
        // Save offline
        await saveOfflineScan(scanLog);
        setLastScan({
          guest_name: invitationDataTyped.guest_name,
          guest_phone: invitationDataTyped.guest_phone,
          group_size: invitationDataTyped.group_size,
          admit_count: admitCount,
          result: "ADMIT",
          message: "Saved offline (will sync when online).",
          scanned_at: scanLog.scanned_at,
        });
      }

      // Reload history
      await loadScanHistory();
      setShowScanner(false);
    } catch (error) {
      console.error("Scan error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process scan";
      setLastScan({
        guest_name: "Unknown",
        guest_phone: null,
        group_size: 0,
        admit_count: 0,
        result: "REJECT",
        message: errorMessage,
        scanned_at: new Date().toISOString(),
      });
    }
  }

  async function syncOfflineScans() {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const unsyncedScans = await getUnsyncedScans();

      for (const scan of unsyncedScans) {
        try {
          const { error } = await supabase.from("scan_logs").insert({
            invitation_id: scan.invitation_id,
            usher_id: scan.usher_id,
            scanned_at: scan.scanned_at,
            admit_count: scan.admit_count,
            result: scan.result,
            mode: "OFFLINE",
            synced: true,
          });

          if (error) throw error;

          // Update invitation if needed
          if (scan.invitation_id) {
            await supabase
              .from("invitations")
              .update({
                status: "USED",
                checked_in_count: scan.admit_count || 0,
              })
              .eq("id", scan.invitation_id);
          }

          await markScanAsSynced(scan.id);
        } catch (error) {
          console.error("Error syncing scan:", scan.id, error);
          // Continue with next scan
        }
      }

      await loadScanHistory();
      if (unsyncedScans.length > 0) {
        alert(`✅ Synced ${unsyncedScans.length} scan(s)`);
      }
    } catch (error) {
      console.error("Sync error:", error);
      alert("Failed to sync scans");
    } finally {
      setIsSyncing(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              QR Scanner
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              {currentUser?.name || "Usher"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="text-green-500" size={20} />
            ) : (
              <WifiOff className="text-yellow-500" size={20} />
            )}
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => setShowScanner(true)}
            className="flex-1 bg-black dark:bg-white text-white dark:text-black"
          >
            <ScanLine size={20} className="mr-2" />
            Scan QR Code
          </Button>
          {!isOnline && (
            <Button
              onClick={syncOfflineScans}
              disabled={isSyncing}
              variant="outline"
            >
              <RefreshCw
                size={20}
                className={`mr-2 ${isSyncing ? "animate-spin" : ""}`}
              />
              Sync
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Total Scans
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {scanHistory.length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Pending Sync
            </p>
            <p className="text-2xl font-bold text-yellow-600">
              {scanHistory.filter((s) => !s.synced).length}
            </p>
          </Card>
        </div>

        {/* Last Scan Details */}
        {lastScan && (
          <Card className="p-4 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {lastScan.result === "ADMIT" ? (
                    <CheckCircle className="text-green-500" size={18} />
                  ) : (
                    <XCircle className="text-red-500" size={18} />
                  )}
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {lastScan.guest_name}
                  </h2>
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {lastScan.guest_phone || "No phone"} • Group:{" "}
                  {lastScan.group_size} • Admit: {lastScan.admit_count}
                </div>
                <div className="mt-3 text-sm">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      lastScan.result === "ADMIT"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {lastScan.result}
                  </span>
                  <span className="ml-2 text-zinc-700 dark:text-zinc-300">
                    {lastScan.message}
                  </span>
                </div>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                {format(new Date(lastScan.scanned_at), "MMM dd, HH:mm:ss")}
              </div>
            </div>
          </Card>
        )}

        {/* Scan History */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <History size={20} />
              Recent Scans
            </h2>
          </div>
          <div className="space-y-2">
            {scanHistory.length === 0 ? (
              <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
                No scans yet. Start scanning QR codes!
              </p>
            ) : (
              scanHistory.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {scan.result === "ADMIT" ? (
                        <CheckCircle className="text-green-500" size={18} />
                      ) : (
                        <XCircle className="text-red-500" size={18} />
                      )}
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {scan.guest_name || "Unknown"}
                      </span>
                      {!scan.synced && (
                        <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      {scan.guest_phone || "N/A"} • {scan.admit_count || 0}{" "}
                      guest{scan.admit_count !== 1 ? "s" : ""} •{" "}
                      {format(new Date(scan.scanned_at), "MMM dd, HH:mm")}
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {scan.mode}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}