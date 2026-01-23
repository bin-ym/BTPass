"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isExistingAdmin, setIsExistingAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    // If already logged in, go straight to dashboard
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

  const emailNormalized = useMemo(() => email.trim().toLowerCase(), [email]);

  async function checkAdminExists() {
    if (!emailNormalized) {
      setIsExistingAdmin(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("email", emailNormalized)
        .eq("role", "ADMIN")
        .eq("active", true)
        .maybeSingle();

      if (error) throw error;
      setIsExistingAdmin(!!data);
    } catch (e) {
      console.error("Admin lookup error:", e);
      // If lookup fails, fall back to magic link (safe default)
      setIsExistingAdmin(false);
    } finally {
      setLoading(false);
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
      <div className="bg-card p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Admin Login</h1>
        <p className="text-muted-foreground mb-6">
          Secure access for administrators
        </p>

        {!sent ? (
          <>
            <label className="block mb-2 text-sm">Email Address</label>
            <input
              type="email"
              placeholder="admin@btcreativeaddis.com"
              className="w-full p-2 border rounded mb-4 bg-background"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={checkAdminExists}
            />

            {isExistingAdmin && (
              <>
                <label className="block mb-2 text-sm">Password</label>
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
        ) : (
          <div className="text-center">
            <p className="text-green-600 font-medium">
              Magic link sent 📩
            </p>
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