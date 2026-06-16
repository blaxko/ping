import { Bell, CheckCircle2, Clock3, MailWarning, Trash2 } from "lucide-react";

import type { PingEventRecord } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";

const eventMeta: Record<
  string,
  {
    label: string;
    icon: typeof Bell;
  }
> = {
  ping_created: { label: "Ping created", icon: Bell },
  notification_initial: { label: "Initial notification sent", icon: Bell },
  notification_manual_nudge: { label: "Manual nudge sent", icon: Bell },
  notification_reminder_24h: { label: "24-hour nudge sent", icon: Clock3 },
  notification_deadline_day: { label: "Deadline-day nudge sent", icon: Clock3 },
  notification_overdue_recipient: { label: "Overdue nudge sent to recipient", icon: MailWarning },
  notification_overdue_creator: { label: "Overdue alert sent to creator", icon: MailWarning },
  status_seen: { label: "Recipient viewed the ping", icon: CheckCircle2 },
  status_resolved: { label: "Ping marked resolved", icon: CheckCircle2 },
  ping_deleted: { label: "Ping deleted", icon: Trash2 },
  delivery_failed: { label: "Delivery failed", icon: MailWarning }
};

export function ActivityTimeline({ events }: { events: PingEventRecord[] }) {
  if (events.length === 0) {
    return (
      <div className="glass-panel rounded-[28px] p-6">
        <p className="text-sm text-muted">No events have been logged yet.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-[28px] p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">Activity Timeline</h2>
        <p className="text-sm text-muted">{events.length} events</p>
      </div>

      <div className="space-y-4">
        {events.map((event) => {
          const meta = eventMeta[event.event_type] ?? {
            label: event.event_type,
            icon: Bell
          };
          const Icon = meta.icon;

          return (
            <div
              className="rounded-3xl border border-white/8 bg-white/[0.03] p-4"
              key={event.id}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-electric/12 text-electricSoft">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-text">{meta.label}</p>
                    {event.channel ? (
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.2em] text-muted">
                        {event.channel}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted">{event.message_sent}</p>
                  <p className="mt-2 text-xs text-muted/80">{formatTimestamp(event.timestamp)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
