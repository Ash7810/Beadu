import { NextResponse } from "next/server";
import { createSSRClient } from "@/lib/supabaseServer";

async function handleLogout() {
  const supabase = await createSSRClient();
  await supabase.auth.signOut();
  return NextResponse.json({ success: true, message: "Logged out successfully." });
}

export { handleLogout as GET, handleLogout as POST };
