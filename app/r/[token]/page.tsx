import Link from "next/link";
import { CheckCircle2, Clock3 } from "lucide-react";

import { markRecipientResolvedAction } from "@/app/actions/recipient";
import { FormSubmitButton } from "@/components/form-submit-button";
import { StatusBadge } from "@/components/status-badge";
import { getRecipientPing, recordRecipientSeen } from "@/lib/pings";
import { formatDueDate } from "@/lib/utils";

export default async function RecipientPingPage({
  params
}: {
  params: { token: string };
}) {
  const existing = await getRecipientPing(params.token);

  if (!existing) {
    return (
      <main className="grid min-h-screen place-items-center px-6 py-16">
        <div className="glass-panel max-w-xl rounded-[32px] p-10 text-center">
          <h1 className="text-3xl font-semibold text-text">This Ping is unavailable.</h1>
          <p className="mt-4 text-sm leading-7 text-muted">
            The link may be invalid, expired, or the Ping has been deleted by its creator.
          </p>
          <Link
            className="mt-8 inline-flex text-sm font-medium text-electricSoft underline decoration-electric/40 underline-offset-4"
            href="/"
          >
            Return to Ping
          </Link>
        </div>
      </main>
    );
  }

  const ping = await recordRecipientSeen(params.token);

  if (!ping) {
    return null;
  }

  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <div className="glass-panel w-full max-w-2xl rounded-[32px] p-8 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-electricSoft">Ping</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-text">
              {ping.recipient_name}, here’s your follow-up.
            </h1>
          </div>
          <StatusBadge status={ping.status} />
        </div>

        <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-electricSoft">Task</p>
          <p className="mt-4 text-lg leading-8 text-slate-100">{ping.task_description}</p>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-sm text-muted">
          <Clock3 className="h-4 w-4 text-electricSoft" />
          <span>Deadline: {formatDueDate(ping.due_date)}</span>
        </div>

        <div className="mt-8">
          {ping.status === "resolved" ? (
            <div className="rounded-[28px] border border-success/25 bg-success/10 p-6 text-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-medium">This Ping has already been resolved.</p>
              </div>
            </div>
          ) : (
            <form action={markRecipientResolvedAction}>
              <input name="token" type="hidden" value={params.token} />
              <FormSubmitButton className="w-full justify-center py-4 text-base" pendingText="Updating...">
                Mark this as resolved
              </FormSubmitButton>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
