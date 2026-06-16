"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  deletePingForUser,
  markPingResolvedForUser,
  sendManualNudge
} from "@/lib/pings";

function requireUserId() {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

export async function sendManualNudgeAction(formData: FormData) {
  const pingId = String(formData.get("pingId") ?? "");
  const userId = requireUserId();

  await sendManualNudge(pingId, userId);
  revalidatePath("/dashboard");
  revalidatePath(`/pings/${pingId}`);
}

export async function markResolvedAction(formData: FormData) {
  const pingId = String(formData.get("pingId") ?? "");
  const userId = requireUserId();

  await markPingResolvedForUser(pingId, userId);
  revalidatePath("/dashboard");
  revalidatePath(`/pings/${pingId}`);
}

export async function deletePingAction(formData: FormData) {
  const pingId = String(formData.get("pingId") ?? "");
  const userId = requireUserId();

  await deletePingForUser(pingId, userId);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
