export type PingStatus = "notified" | "seen" | "overdue" | "resolved";
export type NotificationChannel = "email" | "sms" | "both";
export type DirectChannel = Exclude<NotificationChannel, "both">;

export type PingRecord = {
  id: string;
  created_by: string;
  recipient_name: string;
  recipient_email: string | null;
  recipient_phone: string | null;
  task_description: string;
  due_date: string;
  status: PingStatus;
  notification_channels: NotificationChannel;
  public_token: string;
  seen_at: string | null;
  resolved_at: string | null;
  last_notified_at: string | null;
  created_at: string;
  deleted_at: string | null;
};

export type PingEventRecord = {
  id: string;
  ping_id: string;
  event_type: string;
  message_sent: string;
  channel: DirectChannel | null;
  provider_message_id: string | null;
  metadata: Record<string, unknown>;
  timestamp: string;
};

export type PingWithEvents = {
  ping: PingRecord;
  events: PingEventRecord[];
};

export type CreatePingInput = {
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  taskDescription: string;
  dueDate: string;
  notificationChannels: NotificationChannel;
};

export type NotificationVariant =
  | "initial"
  | "manual_nudge"
  | "reminder_24h"
  | "deadline_day"
  | "overdue_recipient";

export type NotificationResult = {
  ok: boolean;
  channel: DirectChannel;
  message: string;
  providerMessageId?: string;
  error?: string;
};
