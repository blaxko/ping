"use server";

import { revalidatePath } from "next/cache";

import { markRecipientResolved } from "@/lib/pings";

export async function markRecipientResolvedAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");

  await markRecipientResolved(token);
  revalidatePath(`/r/${token}`);
}
