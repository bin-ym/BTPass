"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, ScanLine, LogOut, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function UsherHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/login");
        return;
      }

      setEmail(data.session.user.email ?? null);

      // Get user details
      const { data: userData } = await supabase
        .from("users")
        .select("name")
        .eq("id", data.session.user.id)
        .single();

      if (userData) {
        setUserName(userData.name);
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6">
      <div className="w-20 h-20 rounded-2xl bg-black dark:bg-white flex items-center justify-center">
        <ScanLine className="text-white dark:text-black" size={36} />
      </div>

      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Usher Terminal Ready
      </h1>

      <p className="text-zinc-500 dark:text-zinc-400">
        Logged in as <span className="font-medium">{userName || email}</span>
      </p>

      <p className="text-sm text-zinc-500 max-w-sm">
        Ready to scan QR codes and manage guest entries. Works offline too!
      </p>

      <div className="flex flex-col gap-3 w-full max-w-sm mt-4">
        <Button
          onClick={() => router.push("/scan")}
          className="w-full bg-black dark:bg-white text-white dark:text-black"
        >
          <ScanLine size={20} className="mr-2" />
          Start Scanning
          <ArrowRight size={20} className="ml-2" />
        </Button>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:opacity-90 transition"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}