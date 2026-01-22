"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { StatsCard } from "@/components/StatsCard";
import { Table, Column } from "@/components/ui/Table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  Users,
  Mail,
  CheckCircle,
  UserCheck,
  TrendingUp,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import type { DashboardStats, ScanLogWithDetails } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInvitations: 0,
    totalScans: 0,
    pendingInvitations: 0,
    activeUshers: 0,
    totalGuestsExpected: 0,
    totalGuestsAdmitted: 0,
  });
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // Fetch total invitations
      const { count: totalInvitations } = await supabase
        .from("invitations")
        .select("*", { count: "exact", head: true });

      // Fetch total guests expected (sum of group sizes)
      const { data: invitationsData } = await supabase
        .from("invitations")
        .select("group_size");

      const totalGuestsExpected =
        invitationsData?.reduce((sum, inv) => sum + (inv.group_size || 0), 0) ||
        0;

      // Fetch pending invitations (ACTIVE status)
      const { count: pendingInvitations } = await supabase
        .from("invitations")
        .select("*", { count: "exact", head: true })
        .eq("status", "ACTIVE");

      // Fetch active ushers
      const { count: activeUshers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "USHER")
        .eq("active", true);

      // Fetch total scans
      const { count: totalScans } = await supabase
        .from("scan_logs")
        .select("*", { count: "exact", head: true });

      // Fetch total admitted guests
      const { data: scanData } = await supabase
        .from("scan_logs")
        .select("admit_count");

      const totalGuestsAdmitted =
        scanData?.reduce((sum, scan) => sum + (scan.admit_count || 0), 0) || 0;

      // Fetch recent scans
      const { data: recentScansData } = await supabase
        .from("scan_logs")
        .select(
          `
          *,
          invitation:invitations(guest_name, guest_phone),
          usher:users(name)
        `
        )
        .order("scanned_at", { ascending: false })
        .limit(10);

      setStats({
        totalInvitations: totalInvitations || 0,
        totalScans: totalScans || 0,
        pendingInvitations: pendingInvitations || 0,
        activeUshers: activeUshers || 0,
        totalGuestsExpected,
        totalGuestsAdmitted,
      });

      setRecentScans(recentScansData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const scanColumns: Column[] = [
    {
      key: "guest_name",
      label: "Guest",
      render: (_, row) => row.invitation?.guest_name || "N/A",
    },
    {
      key: "usher_name",
      label: "Usher",
      render: (_, row) => row.usher?.name || "N/A",
    },
    {
      key: "admit_count",
      label: "Count",
      render: (value) => value || 0,
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
      key: "scanned_at",
      label: "Time",
      render: (value) =>
        value ? format(new Date(value), "MMM dd, HH:mm") : "N/A",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's your event overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Invitations"
          value={stats.totalInvitations}
          icon={Mail}
        />
        <StatsCard
          title="Total Scans"
          value={stats.totalScans}
          icon={CheckCircle}
        />
        <StatsCard
          title="Active Ushers"
          value={stats.activeUshers}
          icon={UserCheck}
        />
        <StatsCard
          title="Guests Admitted"
          value={`${stats.totalGuestsAdmitted} / ${stats.totalGuestsExpected}`}
          icon={TrendingUp}
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Scan Activity</CardTitle>
            <Clock className="text-gray-400" size={20} />
          </div>
        </CardHeader>
        <CardContent>
          <Table
            columns={scanColumns}
            data={recentScans}
            emptyMessage="No scans yet"
          />
        </CardContent>
      </Card>
    </div>
  );
}
