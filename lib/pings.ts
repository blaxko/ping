import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { isSameDay, subHours } from "date-fns";

import { getRequiredEnv } from "@/lib/env";
import { sendCreatorOverdueAlert, sendRecipientNotifications } from "@/lib/notifications";
import type {
  CreatePingInput,
  NotificationVariant,
  PingEventRecord,
  PingRecord,
  PingStatus,
  PingWithEvents
} from "@/lib/types";
import { createPingSchema } from "@/lib/validators";

let supabaseAdminSingleton: any | undefined;

function getSupabaseAdmin() {
  if (!supabaseAdminSingleton) {
    supabaseAdminSingleton = createClient<any>(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  return supabaseAdminSingleton;
}

function normalizePing(row: Record<string, unknown>) {
  return row as unknown as PingRecord;
}

function normalizeEvent(row: Record<string, unknown>) {
  return row as unknown as PingEventRecord;
}

function deriveStatus(ping: Pick<PingRecord, "resolved_at" | "seen_at" | "due_date">): PingStatus {
  if (ping.resolved_at) {
    return "resolved";
  }

  if (new Date(ping.due_date).getTime() < Date.now()) {
    return "overdue";
  }

  if (ping.seen_at) {
    return "seen";
  }

  return "notified";
}

function buildEventType(variant: NotificationVariant | "overdue_creator") {
  switch (variant) {
    case "initial":
      return "notification_initial";
    case "manual_nudge":
      return "notification_manual_nudge";
    case "reminder_24h":
      return "notification_reminder_24h";
    case "deadline_day":
      return "notification_deadline_day";
    case "overdue_recipient":
      return "notification_overdue_recipient";
    case "overdue_creator":
      return "notification_overdue_creator";
  }
}

async function ensurePingStatus(ping: PingRecord) {
  const derived = deriveStatus(ping);

  if (ping.status === derived) {
    return ping;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("pings")
    .update({ status: derived })
    .eq("id", ping.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return normalizePing(data as Record<string, unknown>);
}

async function logEvent(params: {
  pingId: string;
  eventType: string;
  message: string;
  channel?: "email" | "sms";
  providerMessageId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("ping_events").insert({
    ping_id: params.pingId,
    event_type: params.eventType,
    message_sent: params.message,
    channel: params.channel ?? null,
    provider_message_id: params.providerMessageId ?? null,
    metadata: params.metadata ?? {}
  });

  if (error) {
    throw error;
  }
}

async function getEventTypesForPing(pingId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ping_events")
    .select("event_type")
    .eq("ping_id", pingId);

  if (error) {
    throw error;
  }

  return new Set((data ?? []).map((row: any) => row.event_type));
}

async function updateLastNotifiedAt(pingId: string) {
  const supabase = getSupabaseAdmin();
  await supabase
    .from("pings")
    .update({ last_notified_at: new Date().toISOString() })
    .eq("id", pingId);
}

async function getCreatorEmail(userId: string) {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const preferred =
      user.emailAddresses.find(
        (address) => address.id === user.primaryEmailAddressId
      ) ?? user.emailAddresses[0];

    return preferred?.emailAddress;
  } catch {
    return undefined;
  }
}

async function sendAndLogRecipientVariant(ping: PingRecord, variant: NotificationVariant) {
  const eventType = buildEventType(variant);
  const results = await sendRecipientNotifications({ ping, variant });
  let hasSuccess = false;

  for (const result of results) {
    if (result.ok) {
      hasSuccess = true;
      await logEvent({
        pingId: ping.id,
        eventType,
        channel: result.channel,
        providerMessageId: result.providerMessageId,
        message: result.message
      });
    } else {
      await logEvent({
        pingId: ping.id,
        eventType: "delivery_failed",
        channel: result.channel,
        message: result.message,
        metadata: {
          original_event_type: eventType,
          error: result.error
        }
      });
    }
  }

  if (hasSuccess) {
    await updateLastNotifiedAt(ping.id);
  }
}

export function getDisplayStatus(ping: PingRecord) {
  return deriveStatus(ping);
}

export async function listPingsForUser(userId: string): Promise<PingRecord[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("pings")
    .select("*")
    .eq("created_by", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    ...normalizePing(row as Record<string, unknown>),
    status: deriveStatus(normalizePing(row as Record<string, unknown>))
  }));
}

export async function getPingForUser(pingId: string, userId: string): Promise<PingWithEvents | null> {
  const supabase = getSupabaseAdmin();
  const pingResponse = await supabase
    .from("pings")
    .select("*")
    .eq("id", pingId)
    .eq("created_by", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (pingResponse.error) {
    throw pingResponse.error;
  }

  if (!pingResponse.data) {
    return null;
  }

  const eventResponse = await supabase
    .from("ping_events")
    .select("*")
    .eq("ping_id", pingId)
    .order("timestamp", { ascending: false });

  if (eventResponse.error) {
    throw eventResponse.error;
  }

  const ping = normalizePing(pingResponse.data as Record<string, unknown>);

  return {
    ping: {
      ...ping,
      status: deriveStatus(ping)
    },
    events: (eventResponse.data ?? []).map((row: any) =>
      normalizeEvent(row as Record<string, unknown>)
    )
  };
}

export async function createPingForUser(
  userId: string,
  input: CreatePingInput
): Promise<PingRecord> {
  const parsed = createPingSchema.parse(input);
  const supabase = getSupabaseAdmin();
  const insertPayload = {
    created_by: userId,
    recipient_name: parsed.recipientName,
    recipient_email: parsed.recipientEmail || null,
    recipient_phone: parsed.recipientPhone || null,
    task_description: parsed.taskDescription,
    due_date: new Date(parsed.dueDate).toISOString(),
    status: "notified",
    notification_channels: parsed.notificationChannels,
    public_token: crypto.randomUUID().replaceAll("-", "")
  };

  const { data, error } = await supabase
    .from("pings")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const ping = normalizePing(data as Record<string, unknown>);

  await logEvent({
    pingId: ping.id,
    eventType: "ping_created",
    message: `Ping created for ${ping.recipient_name}.`
  });
  await sendAndLogRecipientVariant(ping, "initial");

  return ping;
}

export async function markPingResolvedForUser(
  pingId: string,
  userId: string
): Promise<PingRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("pings")
    .update({
      resolved_at: new Date().toISOString(),
      status: "resolved"
    })
    .eq("id", pingId)
    .eq("created_by", userId)
    .is("deleted_at", null)
    .is("resolved_at", null)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    await logEvent({
      pingId,
      eventType: "status_resolved",
      message: "Marked as resolved by the creator."
    });
  }

  return data ? normalizePing(data as Record<string, unknown>) : null;
}

export async function sendManualNudge(
  pingId: string,
  userId: string
): Promise<PingRecord | null> {
  const pingData = await getPingForUser(pingId, userId);

  if (!pingData) {
    return null;
  }

  await sendAndLogRecipientVariant(pingData.ping, "manual_nudge");
  return pingData.ping;
}

export async function deletePingForUser(
  pingId: string,
  userId: string
): Promise<PingRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("pings")
    .update({
      deleted_at: new Date().toISOString()
    })
    .eq("id", pingId)
    .eq("created_by", userId)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    await logEvent({
      pingId,
      eventType: "ping_deleted",
      message: "Ping deleted by the creator."
    });
  }

  return data ? normalizePing(data as Record<string, unknown>) : null;
}

export async function getRecipientPing(token: string): Promise<PingRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("pings")
    .select("*")
    .eq("public_token", token)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const ping = await ensurePingStatus(normalizePing(data as Record<string, unknown>));
  return {
    ...ping,
    status: deriveStatus(ping)
  };
}

export async function recordRecipientSeen(token: string): Promise<PingRecord | null> {
  const ping = await getRecipientPing(token);

  if (!ping || ping.seen_at) {
    return ping;
  }

  const supabase = getSupabaseAdmin();
  const nextStatus = deriveStatus({
    due_date: ping.due_date,
    resolved_at: ping.resolved_at,
    seen_at: new Date().toISOString()
  });
  const { data, error } = await supabase
    .from("pings")
    .update({
      seen_at: new Date().toISOString(),
      status: nextStatus
    })
    .eq("id", ping.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await logEvent({
    pingId: ping.id,
    eventType: "status_seen",
    message: "Recipient opened the Ping link."
  });

  const updated = normalizePing(data as Record<string, unknown>);
  return {
    ...updated,
    status: deriveStatus(updated)
  };
}

export async function markRecipientResolved(token: string): Promise<PingRecord | null> {
  const ping = await getRecipientPing(token);

  if (!ping || ping.resolved_at) {
    return ping;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("pings")
    .update({
      resolved_at: new Date().toISOString(),
      status: "resolved"
    })
    .eq("id", ping.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await logEvent({
    pingId: ping.id,
    eventType: "status_resolved",
    message: "Recipient marked this Ping as resolved."
  });

  return normalizePing(data as Record<string, unknown>);
}

export async function processScheduledNotifications(): Promise<{
  processed: number;
  scanned: number;
}> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("pings")
    .select("*")
    .is("deleted_at", null)
    .is("resolved_at", null);

  if (error) {
    throw error;
  }

  const now = new Date();
  let processed = 0;

  for (const row of data ?? []) {
    const ping = normalizePing(row as Record<string, unknown>);
    const eventTypes = await getEventTypesForPing(ping.id);
    const dueDate = new Date(ping.due_date);
    const createdAt = new Date(ping.created_at);
    const updatedPing = await ensurePingStatus(ping);
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (
      createdAt <= subHours(dueDate, 24) &&
      hoursUntilDue <= 24 &&
      hoursUntilDue > 0 &&
      !eventTypes.has("notification_reminder_24h")
    ) {
      await sendAndLogRecipientVariant(updatedPing, "reminder_24h");
      processed += 1;
      eventTypes.add("notification_reminder_24h");
    }

    if (
      isSameDay(dueDate, now) &&
      dueDate.getTime() > now.getTime() &&
      !eventTypes.has("notification_deadline_day")
    ) {
      await sendAndLogRecipientVariant(updatedPing, "deadline_day");
      processed += 1;
      eventTypes.add("notification_deadline_day");
    }

    if (dueDate.getTime() <= now.getTime() && !eventTypes.has("notification_overdue_recipient")) {
      await sendAndLogRecipientVariant(updatedPing, "overdue_recipient");
      processed += 1;
      eventTypes.add("notification_overdue_recipient");
    }

    if (dueDate.getTime() <= now.getTime() && !eventTypes.has("notification_overdue_creator")) {
      const creatorEmail = await getCreatorEmail(updatedPing.created_by);
      const result = await sendCreatorOverdueAlert({
        ping: updatedPing,
        creatorEmail
      });

      if (result.ok) {
        await logEvent({
          pingId: updatedPing.id,
          eventType: "notification_overdue_creator",
          channel: "email",
          providerMessageId: result.providerMessageId,
          message: result.message
        });
        processed += 1;
      } else {
        await logEvent({
          pingId: updatedPing.id,
          eventType: "delivery_failed",
          channel: "email",
          message: result.message,
          metadata: {
            original_event_type: "notification_overdue_creator",
            error: result.error
          }
        });
      }
    }
  }

  return {
    processed,
    scanned: data?.length ?? 0
  };
}
