"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Table, Column } from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, Download, Filter } from "lucide-react";
import { format } from "date-fns";
import type { ScanLog, User, Invitation } from "@/lib/types";

interface ScanLogWithDetails extends ScanLog {
  invitation: Invitation | null;
  usher: User | null;
}

export default function ScanLogsPage() {
  const [logs, setLogs] = useState<ScanLogWithDetails[]>([]);
  const [ushers, setUshers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsher, setSelectedUsher] = useState<string>("all");
  const [selectedResult, setSelectedResult] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Fetch scan logs with related data
      const { data: logsData, error: logsError } = await supabase
        .from("scan_logs")
        .select(
          `
          *,
          invitation:invitations(id, guest_name, guest_phone, group_size),
          usher:users(id, name, email)
        `
        )
        .order("scanned_at", { ascending: false });

      if (logsError) throw logsError;

      // Fetch all ushers for filter
      const { data: ushersData, error: ushersError } = await supabase
        .from("users")
        .select("*")
        .eq("role", "USHER");

      if (ushersError) throw ushersError;

      setLogs(logsData || []);
      setUshers(ushersData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function exportToCSV() {
    const filteredLogs = getFilteredLogs();

    const csvContent = [
      [
        "Guest Name",
        "Phone",
        "Usher",
        "Admit Count",
        "Result",
        "Mode",
        "Scanned At",
      ],
      ...filteredLogs.map((log) => [
        log.invitation?.guest_name || "N/A",
        log.invitation?.guest_phone || "N/A",
        log.usher?.name || "N/A",
        log.admit_count || 0,
        log.result || "N/A",
        log.mode || "N/A",
        format(new Date(log.scanned_at), "yyyy-MM-dd HH:mm:ss"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `scan-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function getFilteredLogs() {
    return logs.filter((log) => {
      // Search filter
      const matchesSearch =
        log.invitation?.guest_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        log.invitation?.guest_phone
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        log.usher?.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Usher filter
      const matchesUsher =
        selectedUsher === "all" || log.usher_id === selectedUsher;

      // Result filter
      const matchesResult =
        selectedResult === "all" || log.result === selectedResult;

      // Date filter
      const logDate = new Date(log.scanned_at);
      const matchesDateFrom = !dateFrom || new Date(dateFrom) <= logDate;
      const matchesDateTo = !dateTo || logDate <= new Date(dateTo);

      return (
        matchesSearch &&
        matchesUsher &&
        matchesResult &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }

  const filteredLogs = getFilteredLogs();

  const columns: Column[] = [
    {
      key: "guest_name",
      label: "Guest",
      render: (_, log) => (
        <div>
          <div className="font-medium">
            {log.invitation?.guest_name || "Unknown"}
          </div>
          <div className="text-xs text-gray-500">
            {log.invitation?.guest_phone || "N/A"}
          </div>
        </div>
      ),
    },
    {
      key: "usher_name",
      label: "Usher",
      render: (_, log) => log.usher?.name || "N/A",
    },
    {
      key: "admit_count",
      label: "Admitted",
      render: (value, log) => (
        <span className="font-medium">
          {value || 0} / {log.invitation?.group_size || 0}
        </span>
      ),
    },
    {
      key: "result",
      label: "Result",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === "ADMIT"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {value || "N/A"}
        </span>
      ),
    },
    {
      key: "mode",
      label: "Mode",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === "ONLINE"
              ? "bg-blue-100 text-blue-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {value || "N/A"}
        </span>
      ),
    },
    {
      key: "scanned_at",
      label: "Scanned At",
      render: (value) => (
        <div className="text-sm">
          <div>{format(new Date(value), "MMM dd, yyyy")}</div>
          <div className="text-xs text-gray-500">
            {format(new Date(value), "HH:mm:ss")}
          </div>
        </div>
      ),
    },
  ];

  // Calculate stats
  const totalScans = filteredLogs.length;
  const totalAdmitted = filteredLogs.reduce(
    (sum, log) => sum + (log.admit_count || 0),
    0
  );
  const admitCount = filteredLogs.filter(
    (log) => log.result === "ADMIT"
  ).length;
  const rejectCount = filteredLogs.filter(
    (log) => log.result === "REJECT"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scan Logs</h1>
          <p className="text-gray-600 mt-1">View and export scan history</p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download size={20} className="mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Scans</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalScans}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Admitted</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {totalAdmitted}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Admits</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{admitCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Rejects</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{rejectCount}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Guest name, phone, or usher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          {/* Usher Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usher
            </label>
            <select
              value={selectedUsher}
              onChange={(e) => setSelectedUsher(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="all">All Ushers</option>
              {ushers.map((usher) => (
                <option key={usher.id} value={usher.id}>
                  {usher.name}
                </option>
              ))}
            </select>
          </div>

          {/* Result Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Result
            </label>
            <select
              value={selectedResult}
              onChange={(e) => setSelectedResult(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="all">All Results</option>
              <option value="ADMIT">Admit</option>
              <option value="REJECT">Reject</option>
            </select>
          </div>

          {/* Date Range - can be expanded */}
          <div className="flex gap-2 items-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedUsher("all");
                setSelectedResult("all");
                setDateFrom("");
                setDateTo("");
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table
          columns={columns}
          data={filteredLogs}
          isLoading={isLoading}
          emptyMessage="No scan logs found"
        />
      </Card>
    </div>
  );
}
