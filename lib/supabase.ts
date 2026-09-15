import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy singletons — only instantiated when actually called at runtime,
// so the build doesn't fail when env vars are not yet configured.
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseUrlAndKey(isAdmin = false) {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  url = url.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
  if (!url.startsWith("http://") && !url.startsWith("https://")) url = `https://${url}`;
  const key = isAdmin ? process.env.SUPABASE_SERVICE_ROLE_KEY : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(`Supabase ${isAdmin ? "admin" : "anon"} env vars not configured.`);
  }
  return { url, key };
}

/** Public anon client — safe to use in browser/client components */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const { url, key } = getSupabaseUrlAndKey(false);
    _supabase = createSupabaseClient(url, key);
  }
  return _supabase;
}

/** Admin service-role client — use ONLY for database operations that bypass RLS. NEVER use for auth.signInWithPassword */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const { url, key } = getSupabaseUrlAndKey(true);
    _supabaseAdmin = createSupabaseClient(url, key);
  }
  return _supabaseAdmin;
}

// Convenience re-exports for simple use
export const supabase = { get client() { return getSupabase(); } };
export const supabaseAdmin = { get client() { return getSupabaseAdmin(); } };
