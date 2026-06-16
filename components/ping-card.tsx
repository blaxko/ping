import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import type { PingRecord } from "@/lib/types";
import { formatDueDate, getInitials, relativeDeadline } from "@/lib/utils";

export function PingCard({ ping }: { ping: PingRecord }) {
  return (
    <Link
      className="glass-panel group block rounded-[28px] p-6 transition duration-300 hover:-translate-y-1 hover:border-electric/40"
      href={`/pings/${ping.id}`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-electric/15 text-sm font-semibold text-electricSoft">
            {getInitials(ping.recipient_name)}
          </div>
          <div>
            <p className="text-lg font-semibold text-text">{ping.recipient_name}</p>
            <p className="text-sm text-muted">
              {ping.recipient_email || ping.recipient_phone || "No recipient channel"}
            </p>
          </div>
        </div>
        <ArrowUpRight className="h-5 w-5 text-muted transition group-hover:text-electricSoft" />
      </div>

      <p className="mb-6 line-clamp-3 text-sm leading-7 text-slate-100">
        {ping.task_description}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Clock3 className="h-4 w-4 text-electricSoft" />
          <div>
            <p>{formatDueDate(ping.due_date)}</p>
            <p className="text-xs text-muted/80">{relativeDeadline(ping.due_date)}</p>
          </div>
        </div>
        <StatusBadge status={ping.status} />
      </div>
    </Link>
  );
}
