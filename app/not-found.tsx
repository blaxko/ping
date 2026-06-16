import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <div className="glass-panel max-w-xl rounded-[32px] p-10 text-center">
        <h1 className="text-3xl font-semibold text-text">We couldn’t find that Ping.</h1>
        <p className="mt-4 text-sm leading-7 text-muted">
          It may have been deleted, or the link may no longer be valid.
        </p>
        <Link
          className="mt-8 inline-flex text-sm font-medium text-electricSoft underline decoration-electric/40 underline-offset-4"
          href="/dashboard"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
