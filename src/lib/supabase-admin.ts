import { createClient } from "@supabase/supabase-js";

const url = typeof process !== "undefined" ? process.env.SUPABASE_URL : undefined;
const serviceRoleKey = typeof process !== "undefined" ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined;

if (!url || !serviceRoleKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set these in Vercel project settings for the webhook."
  );
}

export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});
