"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Client-side Supabase instance
 * Use inside React components
 */
export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
};