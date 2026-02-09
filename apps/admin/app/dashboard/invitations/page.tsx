"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import { Table, Column } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import {
  Upload,
  Download,
  Search,
  Plus,
  FileSpreadsheet,
  Share2,
  Mail,
  MessageCircle,
  Instagram,
} from "lucide-react";
import { format } from "date-fns";
import Papa from "papaparse";
import { generateQRToken, generateQRCode } from "@/lib/qr-utils";
import type { Invitation, CSVRow } from "@/lib/types";
import { useMemo } from "react";

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [, setCsvFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CSVRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState("");
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<"file" | "sheets">("file");
  const [newInvitation, setNewInvitation] = useState({
    guest_name: "",
    guest_phone: "",
    group_size: 1,
  });
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] =
    useState<Invitation | null>(null);
  const [shareQrDataUrl, setShareQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);
  const filteredInvitations = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return invitations.filter(
      (invitation) =>
        invitation.guest_name.toLowerCase().includes(query) ||
        (invitation.guest_phone &&
          invitation.guest_phone.toLowerCase().includes(query)),
    );
  }, [invitations, searchQuery]);

  async function fetchInvitations() {
    try {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error("Error fetching invitations:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        const parsed: CSVRow[] = results.data.map(
          (row: Record<string, string>) => ({
            name: row.Name || row.name || "",
            phone: row.Phone || row.phone || "",
            groupSize: parseInt(
              row["Group Size"] || row.group_size || row.groupSize || "1",
            ),
          }),
        );
        setPreviewData(parsed);
      },
      error: (error: Error) => {
        console.error("CSV parse error:", error);
        alert("Failed to parse CSV file");
      },
    });
  }

  async function handleGoogleSheetsImport() {
    if (!googleSheetsUrl.trim()) {
      alert("Please enter a Google Sheets URL");
      return;
    }

    setIsLoadingSheets(true);
    try {
      // Convert Google Sheets URL to CSV export URL
      // Format: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit#gid={GID}
      // CSV export: https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}

      let csvUrl = googleSheetsUrl.trim();

      // Extract sheet ID and GID from URL
      const sheetIdMatch = csvUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!sheetIdMatch) {
        throw new Error("Invalid Google Sheets URL format");
      }

      const sheetId = sheetIdMatch[1];
      const gidMatch = csvUrl.match(/[#&]gid=(\d+)/);
      const gid = gidMatch ? gidMatch[1] : "0";

      // Construct CSV export URL
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

      // Fetch CSV data
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(
          "Failed to fetch Google Sheets. Make sure the sheet is publicly accessible or shared with view permissions.",
        );
      }

      const csvText = await response.text();

      // Parse CSV
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<Record<string, string>>) => {
          const parsed: CSVRow[] = results.data.map(
            (row: Record<string, string>) => ({
              name: row.Name || row.name || "",
              phone: row.Phone || row.phone || "",
              groupSize: parseInt(
                row["Group Size"] || row.group_size || row.groupSize || "1",
              ),
            }),
          );
          setPreviewData(parsed);
          setGoogleSheetsUrl("");
        },
        error: (error: Error) => {
          console.error("CSV parse error:", error);
          alert("Failed to parse Google Sheets data");
        },
      });
    } catch (error) {
      console.error("Google Sheets import error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to import from Google Sheets";
      alert(errorMessage);
    } finally {
      setIsLoadingSheets(false);
    }
  }

  async function handleBulkUpload() {
    if (previewData.length === 0) return;

    setIsProcessing(true);

    try {
      const batchSize = 500;
      const batches = [];

      for (let i = 0; i < previewData.length; i += batchSize) {
        batches.push(previewData.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const invitationsToInsert = batch.map((row) => {
          // Generate the invitation UUID ourselves so QR contains the real invitation id
          const invitationId = crypto.randomUUID();
          const qrToken = generateQRToken(invitationId, row.name);

          return {
            id: invitationId,
            guest_name: row.name,
            guest_phone: row.phone || null,
            group_size: row.groupSize || 1,
            qr_token: qrToken,
            status: "ACTIVE",
          };
        });

        const { error } = await supabase
          .from("invitations")
          .insert(invitationsToInsert);

        if (error) throw error;
      }

      await fetchInvitations();
      setIsUploadModalOpen(false);
      setCsvFile(null);
      setPreviewData([]);
      alert(`Successfully imported ${previewData.length} invitations!`);
    } catch (error) {
      console.error("Error uploading invitations:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload invitations";
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleAddSingle(e: React.FormEvent) {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Generate the invitation UUID ourselves so QR contains the real invitation id
      const invitationId = crypto.randomUUID();
      const qrToken = generateQRToken(invitationId, newInvitation.guest_name);

      const { error } = await supabase.from("invitations").insert({
        id: invitationId,
        guest_name: newInvitation.guest_name,
        guest_phone: newInvitation.guest_phone || null,
        group_size: newInvitation.group_size,
        qr_token: qrToken,
        status: "ACTIVE",
      });

      if (error) throw error;

      await fetchInvitations();
      setIsAddModalOpen(false);
      setNewInvitation({ guest_name: "", guest_phone: "", group_size: 1 });
    } catch (error) {
      console.error("Error adding invitation:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add invitation";
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDownloadQR(invitation: Invitation) {
    try {
      const qrDataURL = await generateQRCode(invitation.qr_token);

      const link = document.createElement("a");
      link.href = qrDataURL;
      link.download = `qr-${invitation.guest_name.replace(/\s+/g, "-")}.png`;
      link.click();
    } catch (error) {
      console.error("Error generating QR:", error);
      alert("Failed to generate QR code");
    }
  }

  // =====================
  // SHARE HELPERS
  // =====================
  async function getQRAssets(invitation: Invitation) {
    const qrDataURL = await generateQRCode(invitation.qr_token);

    const response = await fetch(qrDataURL);
    const blob = await response.blob();

    const safeName = invitation.guest_name.replace(/\s+/g, "-");
    const fileName = `qr-${safeName}.png`;

    const file = new File([blob], fileName, { type: "image/png" });
    const objectUrl = URL.createObjectURL(blob);

    return { file, objectUrl, fileName };
  }

  // =====================
  // OPEN SHARE MODAL
  // =====================
  async function handleShareQR(invitation: Invitation) {
    setSelectedInvitation(invitation);
    setShareModalOpen(true);
    try {
      const qrDataURL = await generateQRCode(invitation.qr_token);
      setShareQrDataUrl(qrDataURL);
    } catch (error) {
      console.error("Error generating QR for preview:", error);
    }
  }

  // =====================
  // TELEGRAM SHARE
  // =====================
  async function shareToTelegram(invitation: Invitation) {
    try {
      const { objectUrl, fileName } = await getQRAssets(invitation);

      const text = encodeURIComponent(
        `Invitation QR for ${invitation.guest_name}\n\nPlease attach the downloaded QR code when sending.`,
      );

      // Open Telegram share link
      window.open(`https://t.me/share/url?url=&text=${text}`, "_blank");

      // Auto-download QR
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      link.click();

      setShareModalOpen(false);
    } catch (error) {
      console.error("Telegram share error:", error);
      alert("Failed to share QR code to Telegram");
    }
  }

  // =====================
  // INSTAGRAM SHARE
  // =====================
  async function shareToInstagram(invitation: Invitation) {
    try {
      const { objectUrl, fileName } = await getQRAssets(invitation);

      // Open Instagram (since there's no direct web share URL for images)
      window.open("https://www.instagram.com/", "_blank");

      // Auto-download QR
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      link.click();

      alert(
        "QR downloaded! You can now upload it to your Instagram Story or Feed.",
      );
      setShareModalOpen(false);
    } catch (error) {
      console.error("Instagram share error:", error);
      alert("Failed to prepare QR code for Instagram");
    }
  }

  // =====================
  // EMAIL SHARE
  // =====================
  async function shareToEmail(invitation: Invitation) {
    try {
      const { objectUrl, fileName } = await getQRAssets(invitation);

      const subject = encodeURIComponent(
        `Invitation QR for ${invitation.guest_name}`,
      );

      const body = encodeURIComponent(
        `Hello,

Please find the QR code invitation details below.

Guest: ${invitation.guest_name}
Group Size: ${invitation.group_size}

The QR image has been downloaded automatically.
Please attach it to this email before sending.

Best regards`,
      );

      window.location.href = `mailto:?subject=${subject}&body=${body}`;

      // Auto-download QR for manual attachment
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      link.click();

      setShareModalOpen(false);
    } catch (error) {
      console.error("Email share error:", error);
      alert("Failed to share QR code via email");
    }
  }

  // =====================
  // WHATSAPP SHARE (RECOMMENDED)
  // =====================
  async function shareToWhatsApp(invitation: Invitation) {
    try {
      const { objectUrl, fileName } = await getQRAssets(invitation);

      const text = encodeURIComponent(
        `Invitation QR for ${invitation.guest_name}\n\nPlease attach the downloaded QR code when sending.`,
      );

      window.open(`https://wa.me/?text=${text}`, "_blank");

      // Auto-download QR
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      link.click();

      setShareModalOpen(false);
    } catch (error) {
      console.error("WhatsApp share error:", error);
      alert("Failed to share QR code via WhatsApp");
    }
  }

  const columns: Column[] = [
    { key: "guest_name", label: "Guest Name" },
    { key: "guest_phone", label: "Phone", render: (value) => value || "N/A" },
    { key: "group_size", label: "Group Size" },
    {
      key: "checked_in_count",
      label: "Checked In",
      render: (value, row) => `${value} / ${row.group_size}`,
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === "ACTIVE"
              ? "bg-green-100 text-green-700"
              : value === "USED"
                ? "bg-gray-100 text-gray-700"
                : "bg-red-100 text-red-700"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (value) => format(new Date(value), "MMM dd, yyyy"),
    },
    {
      key: "actions",
      label: "QR Code",
      render: (_, invitation) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownloadQR(invitation)}
          >
            <Download size={14} className="mr-1" />
            Download
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleShareQR(invitation)}
          >
            <Share2 size={14} className="mr-1" />
            Share
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invitations</h1>
          <p className="text-gray-600 mt-1">
            Manage guest invitations and QR codes
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={20} className="mr-2" />
            Add Single
          </Button>
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Upload size={20} className="mr-2" />
            Upload CSV
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Invitations</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {invitations.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {invitations.filter((i) => i.status === "ACTIVE").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Expected Guests</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {invitations.reduce((sum, inv) => sum + inv.group_size, 0)}
          </p>
        </Card>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table
          columns={columns}
          data={filteredInvitations}
          isLoading={isLoading}
          emptyMessage="No invitations found"
        />
      </Card>

      {/* Upload CSV Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setPreviewData([]);
          setCsvFile(null);
          setGoogleSheetsUrl("");
          setUploadMethod("file");
        }}
        title="Upload Invitations"
        size="lg"
      >
        <div className="space-y-4">
          {/* Upload Method Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setUploadMethod("file");
                setPreviewData([]);
                setCsvFile(null);
                setGoogleSheetsUrl("");
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                uploadMethod === "file"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              <Upload size={16} className="inline mr-2" />
              Upload CSV
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadMethod("sheets");
                setPreviewData([]);
                setCsvFile(null);
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                uploadMethod === "sheets"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              <FileSpreadsheet size={16} className="inline mr-2" />
              Google Sheets
            </button>
          </div>

          {uploadMethod === "file" ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Upload a CSV file with columns: <strong>Name</strong>,{" "}
                <strong>Phone</strong>, <strong>Group Size</strong>
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Import from Google Sheets. Make sure your sheet is{" "}
                <strong>publicly accessible</strong> or shared with view
                permissions.
              </p>
              <p className="text-xs text-gray-500 mb-2">
                Required columns: <strong>Name</strong>, <strong>Phone</strong>,{" "}
                <strong>Group Size</strong>
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={googleSheetsUrl}
                  onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <Button
                  onClick={handleGoogleSheetsImport}
                  isLoading={isLoadingSheets}
                  disabled={!googleSheetsUrl.trim()}
                >
                  Import
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Paste the Google Sheets URL and click Import
              </p>
            </div>
          )}

          {previewData.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">
                Preview ({previewData.length} rows)
              </h4>
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Phone</th>
                      <th className="px-4 py-2 text-left">Group Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2">{row.name}</td>
                        <td className="px-4 py-2">{row.phone || "N/A"}</td>
                        <td className="px-4 py-2">{row.groupSize}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 10 && (
                  <p className="text-xs text-gray-500 p-2 text-center">
                    ... and {previewData.length - 10} more rows
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleBulkUpload}
              isLoading={isProcessing}
              disabled={previewData.length === 0}
              className="flex-1"
            >
              Import {previewData.length} Invitations
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsUploadModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Single Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Single Invitation"
      >
        <form onSubmit={handleAddSingle} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guest Name *
            </label>
            <input
              type="text"
              required
              value={newInvitation.guest_name}
              onChange={(e) =>
                setNewInvitation({
                  ...newInvitation,
                  guest_name: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={newInvitation.guest_phone}
              onChange={(e) =>
                setNewInvitation({
                  ...newInvitation,
                  guest_phone: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="+251912345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Size *
            </label>
            <input
              type="number"
              required
              min="1"
              value={newInvitation.group_size}
              onChange={(e) =>
                setNewInvitation({
                  ...newInvitation,
                  group_size: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" isLoading={isProcessing} className="flex-1">
              Create Invitation
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Share Modal */}
      {shareModalOpen && selectedInvitation && (
        <Modal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedInvitation(null);
            setShareQrDataUrl(null);
          }}
          title="Share Invitation"
          size="md"
        >
          <div className="space-y-6">
            {/* Guest Info */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedInvitation.guest_name}
              </h3>
              <p className="text-sm text-gray-500">
                Group Size: {selectedInvitation.group_size} •{" "}
                {selectedInvitation.guest_phone || "No phone"}
              </p>
            </div>

            {/* QR Preview Card */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center gap-2 transform transition-transform hover:scale-105 duration-300">
                {shareQrDataUrl ? (
                  <img
                    src={shareQrDataUrl}
                    alt="QR Code Preview"
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-50 animate-pulse rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-400">Generating...</span>
                  </div>
                )}
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                  Scan to Admit
                </span>
              </div>
            </div>

            {/* Share Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => shareToWhatsApp(selectedInvitation)}
                className="bg-[#25D366] hover:bg-[#20ba5a] text-white border-none shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 py-3"
              >
                <div className="bg-white/20 p-1.5 rounded-full">
                  <MessageCircle size={18} fill="white" />
                </div>
                WhatsApp
              </Button>
              <Button
                onClick={() => shareToTelegram(selectedInvitation)}
                className="bg-[#0088cc] hover:bg-[#0077b5] text-white border-none shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 py-3"
              >
                <div className="bg-white/20 p-1.5 rounded-full">
                  <Share2 size={18} />
                </div>
                Telegram
              </Button>
              <Button
                onClick={() => shareToInstagram(selectedInvitation)}
                className="bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] hover:opacity-90 text-white border-none shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 py-3"
              >
                <div className="bg-white/20 p-1.5 rounded-full">
                  <Instagram size={18} />
                </div>
                Instagram
              </Button>
              <Button
                onClick={() => shareToEmail(selectedInvitation)}
                className="bg-gray-800 hover:bg-gray-900 text-white border-none shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 py-3"
              >
                <div className="bg-white/20 p-1.5 rounded-full">
                  <Mail size={18} />
                </div>
                Email
              </Button>
              <Button
                onClick={() => handleDownloadQR(selectedInvitation)}
                variant="outline"
                className="col-span-2 border-2 border-dashed border-gray-300 hover:border-gray-900 py-3 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Save to Device
              </Button>
            </div>

            <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest leading-relaxed">
              BTPass Digital Invitation System
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
