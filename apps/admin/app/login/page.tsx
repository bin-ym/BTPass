"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isExistingAdmin, setIsExistingAdmin] = useState<boolean | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  useEffect(() => {
    // If already logged in, go straight to dashboard
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

  const emailNormalized = useMemo(() => email.trim().toLowerCase(), [email]);

  // Auto-check if admin exists when email changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (emailNormalized && emailNormalized.includes("@")) {
        checkAdminExists();
      } else {
        setIsExistingAdmin(null);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailNormalized]);

  async function checkAdminExists() {
    if (!emailNormalized) {
      setIsExistingAdmin(null);
      return;
    }
    setCheckingAdmin(true);
    setError("");
    try {
      const response = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailNormalized,
          role: "ADMIN",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to check admin status");
      }

      const { exists } = await response.json();
      setIsExistingAdmin(exists);
    } catch (e) {
      console.error("Admin lookup error:", e);
      // If lookup fails, fall back to magic link (safe default)
      setIsExistingAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  }

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      if (isExistingAdmin) {
        // Existing admin: use password login (no magic link)
        const { error } = await supabase.auth.signInWithPassword({
          email: emailNormalized,
          password,
        });
        if (error) throw error;
        router.replace("/dashboard");
      } else {
        // New admin: use magic link (redirect uses current origin: localhost or Vercel)
        const { error } = await supabase.auth.signInWithOtp({
          email: emailNormalized,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) throw error;
        setSent(true);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Login failed";
      setError(msg);
    }

    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!emailNormalized) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        emailNormalized,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

      if (error) throw error;
      setForgotPasswordSent(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to send reset email";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
      <div className="bg-card p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Admin Login</h1>
        <p className="text-muted-foreground mb-6">
          Secure access for administrators
        </p>

        {!sent && !forgotPasswordSent ? (
          <>
            {showForgotPassword ? (
              <>
                <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
                <label className="block mb-2 text-sm">Email Address</label>
                <input
                  type="email"
                  placeholder="admin@btcreativeaddis.com"
                  className="w-full p-2 border rounded mb-4 bg-background"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  onClick={handleForgotPassword}
                  disabled={loading || !emailNormalized}
                  className="w-full bg-primary text-primary-foreground py-2 rounded hover:opacity-90 transition mb-3"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setError("");
                  }}
                  className="w-full text-sm text-muted-foreground hover:underline"
                >
                  Back to login
                </button>
              </>
            ) : (
              <>
                <label className="block mb-2 text-sm">Email Address</label>
                <input
                  type="email"
                  placeholder="admin@btcreativeaddis.com"
                  className="w-full p-2 border rounded mb-2 bg-background"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {checkingAdmin && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Checking admin status...
                  </p>
                )}
                {isExistingAdmin === false && emailNormalized && (
                  <p className="text-xs text-blue-600 mb-2">
                    ✨ New admin - magic link will be sent
                  </p>
                )}
                {isExistingAdmin === true && (
                  <p className="text-xs text-green-600 mb-2">
                    ✓ Existing admin - enter your password
                  </p>
                )}

                {isExistingAdmin && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm">Password</label>
                      <button
                        onClick={() => {
                          setShowForgotPassword(true);
                          setError("");
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full p-2 border rounded mb-4 bg-background"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </>
                )}

                <button
                  onClick={handleLogin}
                  disabled={
                    loading ||
                    !emailNormalized ||
                    (isExistingAdmin ? !password : false)
                  }
                  className="w-full bg-primary text-primary-foreground py-2 rounded hover:opacity-90 transition"
                >
                  {loading
                    ? "Loading..."
                    : isExistingAdmin
                      ? "Sign In"
                      : "Send Magic Link"}
                </button>
              </>
            )}
          </>
        ) : forgotPasswordSent ? (
          <div className="text-center">
            <p className="text-green-600 font-medium">
              Password reset link sent 📩
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Check your email and click the link to reset your password.
            </p>
            <button
              onClick={() => {
                setForgotPasswordSent(false);
                setShowForgotPassword(false);
                setError("");
              }}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Back to login
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-green-600 font-medium">Magic link sent 📩</p>
            <p className="text-sm text-muted-foreground mt-2">
              Check your email and click the link to continue.
            </p>
          </div>
        )}

        {error && <p className="text-destructive mt-4">{error}</p>}
      </div>
    </div>
  );
}
