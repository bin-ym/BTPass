"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { User, Lock, Mail, Phone, Save, CheckCircle, XCircle } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      setUser(session.user);

      // Get user details from users table
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .eq("role", "ADMIN")
        .single();

      if (error) throw error;
      setUserData(data);
    } catch (error) {
      console.error("Error loading user data:", error);
      setMessage({ type: "error", text: "Failed to load user data" });
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setSaving(true);

    try {
      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setMessage({ type: "success", text: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update password";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account settings</p>
      </div>

      {/* User Information */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
            <User className="text-white" size={32} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {userData?.name || user?.email}
            </h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900">{user?.email}</p>
            </div>
          </div>

          {userData?.phone && (
            <div className="flex items-center gap-3">
              <Phone className="text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-gray-900">{userData.phone}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <User className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="text-gray-900">{userData?.role || "ADMIN"}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="text-gray-400" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                message.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle size={20} />
              ) : (
                <XCircle size={20} />
              )}
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={saving || !newPassword || !confirmPassword}
            className="bg-gray-900 text-white hover:bg-gray-800"
          >
            <Save size={20} className="mr-2" />
            {saving ? "Saving..." : "Update Password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
