import type { PingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusClasses: Record<PingStatus, string> = {
  notified: "bg-electric/15 text-electricSoft border-electric/30",
  seen: "bg-success/15 text-green-300 border-success/30",
  overdue: "bg-warning/15 text-amber-300 border-warning/30",
  resolved: "bg-white/12 text-white border-white/15"
};

const statusLabels: Record<PingStatus, string> = {
  notified: "Notified",
  seen: "Seen",
  overdue: "Overdue",
  resolved: "Resolved"
};

export function StatusBadge({ status }: { status: PingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        statusClasses[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
