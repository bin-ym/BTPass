"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if we have the hash in URL (from email link)
    const hash = window.location.hash;
    if (!hash) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Update password using Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to reset password";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
      <div className="bg-card p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
        <p className="text-muted-foreground mb-6">
          Enter your new password
        </p>

        {success ? (
          <div className="text-center">
            <CheckCircle className="text-green-600 mx-auto mb-4" size={48} />
            <p className="text-green-600 font-medium mb-2">
              Password reset successfully!
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to login page...
            </p>
          </div>
        ) : (
          <form onSubmit={handleResetPassword}>
            <label className="block mb-2 text-sm">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              className="w-full p-2 border rounded mb-4 bg-background"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <label className="block mb-2 text-sm">Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full p-2 border rounded mb-4 bg-background"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error && (
              <div className="flex items-center gap-2 text-red-600 mb-4">
                <XCircle size={20} />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full bg-primary text-primary-foreground py-2 rounded hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full mt-3 text-sm text-muted-foreground hover:underline"
            >
              Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
