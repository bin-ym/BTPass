"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
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
            />

            <button
              onClick={handleLogin}
              disabled={loading || !email}
              className="w-full bg-primary text-primary-foreground py-2 rounded hover:opacity-90 transition"
            >
              {loading ? "Sending magic link..." : "Send Magic Link"}
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