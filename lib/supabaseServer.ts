import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseUrlAndKey } from "@/lib/supabase";

/** 
 * Request-scoped SSR client for use in Server Actions and Route Handlers 
 * It automatically handles passing cookies between the browser and Supabase.
 */
export async function createSSRClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseUrlAndKey();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
