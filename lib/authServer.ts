const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  (process.env.NODE_ENV === "production"
    ? (() => {
        console.warn("[SECURITY WARNING]: ADMIN_SESSION_SECRET is not set in production. Using fallback secret.");
        return "beadu-production-secret-key-2026-secure-sign";
      })()
    : "beadu-production-secret-key-2026-secure-sign");

export const FALLBACK_ADMIN_EMAILS = ["beaduuu@gmail.com", "meet.y.7810@gmail.com"];

/**
 * Checks if the given email has administrator privileges.
 * First checks known store owner fallbacks, then queries Supabase store_admins table.
 */
export async function checkIsAdmin(email?: string | null): Promise<boolean> {
  if (!email || typeof email !== "string") return false;
  const cleanEmail = email.trim().toLowerCase();
  if (FALLBACK_ADMIN_EMAILS.includes(cleanEmail)) return true;

  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase");
    const adminDb = getSupabaseAdmin();
    const { data: adminRow } = await adminDb
      .from("store_admins")
      .select("email")
      .eq("email", cleanEmail)
      .maybeSingle();
    return Boolean(adminRow);
  } catch {
    return false;
  }
}

/**
 * Verifies current request's SSR session and returns whether caller is an authenticated admin.
 */
export async function getAuthenticatedAdmin(): Promise<{ isAdmin: boolean; email?: string; userId?: string }> {
  try {
    const { createSSRClient } = await import("@/lib/supabaseServer");
    const supabase = await createSSRClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData?.user) {
      return { isAdmin: false };
    }

    const email = authData.user.email?.toLowerCase();
    const isAdmin = await checkIsAdmin(email);
    return { isAdmin, email, userId: authData.user.id };
  } catch {
    return { isAdmin: false };
  }
}

// Web Crypto HMAC-SHA256 Helper (Works in Edge Middleware and Node.js)
async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str, "utf8").toString("base64url");
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, "base64url").toString("utf8");
}

export async function createPasswordResetToken(email: string): Promise<string> {
  const payload = JSON.stringify({
    email,
    action: "PASSWORD_RESET",
    exp: Date.now() + 15 * 60 * 1000, // 15 mins
  });

  const encodedPayload = base64UrlEncode(payload);
  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(encodedPayload)
  );

  const signature = Buffer.from(signatureBuffer).toString("base64url");

  return `${encodedPayload}.${signature}`;
}

export async function verifyPasswordResetToken(
  token?: string | null
): Promise<{ valid: boolean; email?: string }> {
  if (!token || typeof token !== "string") return { valid: false };

  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false };

  const [encodedPayload, signature] = parts;

  try {
    const key = await getCryptoKey();
    const sigBytes = Buffer.from(signature, "base64url");

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(encodedPayload)
    );

    if (!isValid) return { valid: false };

    const payloadJson = base64UrlDecode(encodedPayload);
    const data = JSON.parse(payloadJson);

    if (!data || data.action !== "PASSWORD_RESET") return { valid: false };
    if (typeof data.exp === "number" && Date.now() > data.exp) return { valid: false };

    return { valid: true, email: data.email };
  } catch {
    return { valid: false };
  }
}
