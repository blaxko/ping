import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ExternalLink } from "lucide-react";

import {
  deletePingAction,
  markResolvedAction,
  sendManualNudgeAction
} from "@/app/actions/pings";
import { ActivityTimeline } from "@/components/activity-timeline";
import { FormSubmitButton } from "@/components/form-submit-button";
import { StatusBadge } from "@/components/status-badge";
import { formatDueDate, formatTimestamp } from "@/lib/utils";
import { getPingForUser } from "@/lib/pings";

export default async function PingDetailPage({
  params
}: {
  params: { id: string };
}) {
  const { userId } = auth();

  if (!userId) {
    return null;
  }

  const data = await getPingForUser(params.id, userId);

  if (!data) {
    notFound();
  }

  const { ping, events } = data;
  const publicUrl = `/r/${ping.public_token}`;

  return (
    <div className="space-y-8">
      <section className="glass-panel grid gap-6 rounded-[32px] p-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={ping.status} />
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted">
              {ping.notification_channels}
            </span>
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-text">
            {ping.recipient_name}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted">
            {ping.task_description}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-muted">Due</p>
              <p className="mt-2 text-lg font-semibold text-text">{formatDueDate(ping.due_date)}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-muted">Created</p>
              <p className="mt-2 text-lg font-semibold text-text">{formatTimestamp(ping.created_at)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-electricSoft">Recipient access</p>
            <Link
              className="mt-3 inline-flex items-center gap-2 text-sm text-text underline decoration-white/20 underline-offset-4 transition hover:text-electricSoft"
              href={publicUrl}
              target="_blank"
            >
              Open public ping page
              <ExternalLink className="h-4 w-4" />
            </Link>
            <div className="mt-5 space-y-2 text-sm text-muted">
              <p>{ping.recipient_email || "No email added"}</p>
              <p>{ping.recipient_phone || "No phone number added"}</p>
            </div>
          </div>

          <div className="grid gap-3">
            <form action={sendManualNudgeAction}>
              <input name="pingId" type="hidden" value={ping.id} />
              <FormSubmitButton className="w-full justify-center" pendingText="Sending nudge...">
                Send manual nudge
              </FormSubmitButton>
            </form>

            <form action={markResolvedAction}>
              <input name="pingId" type="hidden" value={ping.id} />
              <FormSubmitButton
                className="w-full justify-center"
                pendingText="Marking resolved..."
                variant="secondary"
              >
                Mark as resolved
              </FormSubmitButton>
            </form>

            <form action={deletePingAction}>
              <input name="pingId" type="hidden" value={ping.id} />
              <FormSubmitButton
                className="w-full justify-center"
                pendingText="Deleting ping..."
                variant="danger"
              >
                Delete ping
              </FormSubmitButton>
            </form>
          </div>
        </div>
      </section>

      <ActivityTimeline events={events} />
    </div>
  );
}
