# Ping

Ping is a personal accountability assistant built with Next.js 14, Clerk, Supabase, Resend, Twilio, Tailwind CSS, and Vercel cron jobs.

## Features

- Clerk sign-up and sign-in
- Protected dashboard for creators
- Four-step Ping creation flow
- Supabase-backed ping + event timeline storage
- Recipient public page with `Seen` and `Resolved` tracking
- Initial notifications, 24-hour nudges, deadline-day nudges, overdue recipient nudges, and overdue creator alerts

## Environment

Copy `.env.example` to `.env.local` and fill in the required values:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `CRON_SECRET`

## Database

Run the SQL migration in [`supabase/migrations/202606070001_create_ping_schema.sql`](/C:/Users/HP/blaxko.codex/supabase/migrations/202606070001_create_ping_schema.sql) inside your Supabase project.

## Development

```bash
corepack pnpm install
corepack pnpm dev
```

## Cron

Configure the Vercel cron secret as the `CRON_SECRET` environment variable. The generated `vercel.json` runs `/api/cron/process-pings` every hour.
