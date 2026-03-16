import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
let _initError: string | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;
  if (_initError) throw new Error(_initError);

  const url = typeof process !== "undefined" ? process.env.SUPABASE_URL : undefined;
  const serviceRoleKey = typeof process !== "undefined" ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined;

  if (!url || !serviceRoleKey) {
    _initError = "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set these in Vercel (Production AND Preview).";
    throw new Error(_initError);
  }

  _client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  return _client;
}

export { getSupabaseAdmin };
