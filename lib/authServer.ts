const SESSION_COOKIE_NAME = "beadu_admin_session";
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "beadu-atelier-production-secret-key-2026-secure-sign";

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
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf8").toString("base64url");
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "base64url").toString("utf8");
  }
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return atob(base64);
}

/**
 * Creates a cryptographically signed admin session token: payload.signature
 */
export async function createAdminSessionToken(email: string): Promise<string> {
  const payload = JSON.stringify({
    email,
    role: "ADMIN",
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const encodedPayload = base64UrlEncode(payload);
  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(encodedPayload)
  );

  let binary = "";
  const bytes = new Uint8Array(signatureBuffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const signature = base64UrlEncode(binary);

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies the signed session token string
 */
export async function verifyAdminSessionToken(
  token?: string | null
): Promise<{ valid: boolean; email?: string }> {
  if (!token || typeof token !== "string") return { valid: false };

  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false };

  const [encodedPayload, signature] = parts;

  try {
    const key = await getCryptoKey();
    const sigBinary = base64UrlDecode(signature);
    const sigBytes = new Uint8Array(sigBinary.length);
    for (let i = 0; i < sigBinary.length; i++) {
      sigBytes[i] = sigBinary.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(encodedPayload)
    );

    if (!isValid) return { valid: false };

    const payloadJson = base64UrlDecode(encodedPayload);
    const data = JSON.parse(payloadJson);

    if (!data || data.role !== "ADMIN") return { valid: false };
    if (typeof data.exp === "number" && Date.now() > data.exp) return { valid: false };

    return { valid: true, email: data.email };
  } catch {
    return { valid: false };
  }
}

/**
 * Server-Side helper to verify admin session from next/headers cookies
 */
export async function getAdminSession(): Promise<{ valid: boolean; email?: string }> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!cookie?.value) return { valid: false };
    return verifyAdminSessionToken(cookie.value);
  } catch {
    return { valid: false };
  }
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

  let binary = "";
  const bytes = new Uint8Array(signatureBuffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const signature = base64UrlEncode(binary);

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
    const sigBinary = base64UrlDecode(signature);
    const sigBytes = new Uint8Array(sigBinary.length);
    for (let i = 0; i < sigBinary.length; i++) {
      sigBytes[i] = sigBinary.charCodeAt(i);
    }

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

export { SESSION_COOKIE_NAME };
