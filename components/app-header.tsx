import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export function AppHeader() {
  return (
    <header className="border-b border-white/8 bg-[#07111F]/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-8">
          <Link className="text-lg font-semibold tracking-tight text-text" href="/dashboard">
            Ping
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-muted md:flex">
            <Link className="transition hover:text-text" href="/dashboard">
              Dashboard
            </Link>
            <Link className="transition hover:text-text" href="/pings/new">
              New Ping
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden rounded-full border border-electric/20 bg-electric/10 px-3 py-1 text-xs font-medium text-electricSoft md:inline-flex">
            Personal accountability assistant
          </span>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-10 w-10"
              }
            }}
          />
        </div>
      </div>
    </header>
  );
}
