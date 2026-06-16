import Link from "next/link";
import { ArrowRight, BellRing, Clock3, ShieldCheck } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { userId } = auth();

  return (
    <main className="grid-bg min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10">
        <header className="flex items-center justify-between py-4">
          <Link className="text-lg font-semibold text-text" href="/">
            Ping
          </Link>
          <div className="flex items-center gap-3">
            <Link href={userId ? "/dashboard" : "/sign-in"}>
              <Button variant="ghost">{userId ? "Dashboard" : "Sign in"}</Button>
            </Link>
            <Link href={userId ? "/pings/new" : "/sign-up"}>
              <Button>{userId ? "New Ping" : "Start Free"}</Button>
            </Link>
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-20">
          <div className="max-w-4xl">
            <span className="inline-flex rounded-full border border-electric/20 bg-electric/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-electricSoft">
              Personal accountability assistant
            </span>
            <h1 className="mt-8 max-w-4xl text-5xl font-semibold tracking-tight text-text sm:text-7xl">
              Delegate the task once. Ping handles the follow-up.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-muted">
              Send a clear ask, keep the deadline visible, and let Ping nudge people
              automatically until the work gets seen or resolved.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href={userId ? "/pings/new" : "/sign-up"}>
                <Button className="w-full sm:w-auto">
                  Create your first Ping
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={userId ? "/dashboard" : "/sign-in"}>
                <Button className="w-full sm:w-auto" variant="secondary">
                  {userId ? "Open dashboard" : "Log in"}
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-16 grid gap-5 lg:grid-cols-3">
            {[
              {
                title: "Delegate with clarity",
                body: "Capture the task, deadline, and preferred contact method in a tight four-step flow.",
                icon: BellRing
              },
              {
                title: "Automatic nudges",
                body: "Ping follows up 24 hours before the deadline, on the day itself, and after overdue status.",
                icon: Clock3
              },
              {
                title: "Private creator workspace",
                body: "Creators stay inside a Clerk-protected dashboard with full timelines, status history, and controls.",
                icon: ShieldCheck
              }
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div className="glass-panel rounded-[28px] p-6" key={item.title}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-electric/12 text-electricSoft">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 text-xl font-semibold text-text">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted">{item.body}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
