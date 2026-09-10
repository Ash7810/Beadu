import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy singletons — only instantiated when actually called at runtime,
// so the build doesn't fail when env vars are not yet configured.
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

/** Public anon client — safe to use in browser/client components */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
    url = url.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
    if (!url.startsWith("http://") && !url.startsWith("https://")) url = `https://${url}`;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase env vars not configured: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
    _supabase = createClient(url, key);
  }
  return _supabase;
}

/** Admin service-role client — use ONLY in Server Actions / API routes */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
    url = url.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
    if (!url.startsWith("http://") && !url.startsWith("https://")) url = `https://${url}`;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase admin env vars not configured: SUPABASE_SERVICE_ROLE_KEY");
    _supabaseAdmin = createClient(url, key);
  }
  return _supabaseAdmin;
}

// Convenience re-exports for simple use
export const supabase = { get client() { return getSupabase(); } };
export const supabaseAdmin = { get client() { return getSupabaseAdmin(); } };
