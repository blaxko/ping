import Link from "next/link";
import { Plus, Target } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

import { PingCard } from "@/components/ping-card";
import { Button } from "@/components/ui/button";
import { listPingsForUser } from "@/lib/pings";

export default async function DashboardPage() {
  const { userId } = auth();

  if (!userId) {
    return null;
  }

  const pings = await listPingsForUser(userId);
  const activeCount = pings.filter((ping) => ping.status !== "resolved").length;
  const overdueCount = pings.filter((ping) => ping.status === "overdue").length;

  return (
    <div className="space-y-8">
      <section className="glass-panel grid gap-6 rounded-[32px] p-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-electricSoft">Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-text">
            Keep every delegated task moving.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted">
            Track who owes what, when the next nudge will happen, and which asks need
            your attention right now.
          </p>
          <div className="mt-8">
            <Link href="/pings/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create a Ping
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-muted">Active Pings</p>
            <p className="mt-3 text-4xl font-semibold text-text">{activeCount}</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-muted">Overdue right now</p>
            <p className="mt-3 text-4xl font-semibold text-text">{overdueCount}</p>
          </div>
        </div>
      </section>

      {pings.length === 0 ? (
        <section className="glass-panel rounded-[32px] p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-electric/12 text-electricSoft">
            <Target className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-text">No active Pings yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
            Start with one clear task and a deadline. Ping will take care of the first
            notification, follow-up nudges, and status tracking for you.
          </p>
          <div className="mt-8">
            <Link href="/pings/new">
              <Button>Create your first Ping</Button>
            </Link>
          </div>
        </section>
      ) : (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-text">Your Pings</h2>
            <p className="text-sm text-muted">{pings.length} total</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pings.map((ping) => (
              <PingCard key={ping.id} ping={ping} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
