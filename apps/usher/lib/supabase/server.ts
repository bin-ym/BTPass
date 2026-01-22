import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server-side Supabase instance
 * Use in layouts, server components, API routes
 */
export const createServerClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: {
        cookie: cookies().toString(),
      },
    },
  });
};
