"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Mail, Lock, LogIn, Loader2, AlertCircle, WifiOff } from "lucide-react";
import Image from "next/image";
import {
  storeOfflineUser,
  validateOfflineCredentials,
  createOfflineSession,
} from "@/lib/offline-auth";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""); // Email or phone
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Detect if input is email or phone
  function isEmail(input: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Try offline login first if offline
      if (!isOnline) {
        const offlineUser = await validateOfflineCredentials(
          identifier,
          password,
        );
        if (!offlineUser) {
          throw new Error(
            "Invalid credentials or no offline data available. Please connect to the internet to login.",
          );
        }

        // Create offline session
        await createOfflineSession(offlineUser);
        router.push("/scan");
        return;
      }

      // Online login
      let userEmail: string;
      let userData: any;

      if (isEmail(identifier)) {
        // Direct email login
        userEmail = identifier;
      } else {
        // Phone-based login: Find user by phone via API, then sign in with email
        const response = await fetch("/api/auth/lookup-by-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: identifier }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "No usher found with this phone number or email",
          );
        }

        const { user } = await response.json();
        userData = user;
        userEmail = user.email;
        if (!userEmail) {
          throw new Error("No email associated with this phone number");
        }
      }

      // Sign in with email and password
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: userEmail,
          password,
        },
      );

      if (authError) throw authError;

      // Get full user data if not already fetched
      if (!userData) {
        const userResponse = await fetch("/api/auth/get-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: data.user.id }),
        });

        if (userResponse.ok) {
          const { user } = await userResponse.json();
          userData = user;
        }
      }

      // Store credentials offline for future offline access
      if (userData) {
        await storeOfflineUser(userData, password);
        await createOfflineSession(userData);
      }

      // Successful login
      router.push("/scan");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 font-sans">
      <div className="absolute inset-0 bg-grid-zinc-200/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-grid-zinc-900/50" />

      <Card className="relative w-full max-w-md p-8 border-none shadow-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg overflow-hidden">
            <h1 className="text-white dark:text-black font-bold text-2xl">
              BT
            </h1>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Usher Terminal
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Sign in to manage guest entries
          </p>
          {!isOnline && (
            <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-full text-yellow-700 dark:text-yellow-400 text-sm">
              <WifiOff size={14} />
              <span>Offline Mode</span>
            </div>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">
              Email or Phone
            </label>
            <div className="relative group">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors"
                size={18}
              />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError(null);
                }}
                placeholder="name@company.com or +251912345678"
                className="w-full pl-10 pr-4 py-3 bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">
              Enter your email address or phone number
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <a
                href="#"
                className="text-xs text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative group">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors"
                size={18}
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-sm animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black rounded-xl font-semibold shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 mt-6"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Scanning terminal access restricted to authorized personnel.
          </p>
        </div>
      </Card>

      <div className="fixed bottom-6 text-zinc-400 dark:text-zinc-600 text-xs font-medium">
        &copy; {new Date().getFullYear()} BT Creative. All rights reserved.
      </div>
    </div>
  );
}
