"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminSession } from "@/lib/authServer";

export async function deleteOrder(id: string) {
  const session = await getAdminSession();
  if (!session.valid) throw new Error("Unauthorized: Admin authentication required.");

  const { error } = await getSupabaseAdmin()
    .from("bracelets")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
}

export async function updateOrderStatus(id: string, status: string) {
  const session = await getAdminSession();
  if (!session.valid) throw new Error("Unauthorized: Admin authentication required.");

  const { error } = await getSupabaseAdmin()
    .from("bracelets")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
}

export async function updateOrderDetails(id: string, formData: FormData) {
  const session = await getAdminSession();
  if (!session.valid) throw new Error("Unauthorized: Admin authentication required.");

  const safeId = String(id || "").trim();
  if (!safeId) throw new Error("Order ID is required");

  const customer_name = String((formData.get("customer_name") as string) || "").trim().slice(0, 100);
  const email = String((formData.get("email") as string) || "").trim().slice(0, 150);
  const phone = String((formData.get("phone") as string) || "").trim().replace(/[^\d+ -]/g, "").slice(0, 20);
  const address = String((formData.get("address") as string) || "").trim().slice(0, 500);
  const wrist_inches = Math.min(12, Math.max(4, Number(formData.get("wrist_inches")) || 7.0));
  const status = String((formData.get("status") as string) || "draft").slice(0, 50);

  const { error } = await getSupabaseAdmin()
    .from("bracelets")
    .update({
      customer_name,
      email,
      phone,
      address,
      wrist_inches,
      status,
    })
    .eq("id", safeId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
}
