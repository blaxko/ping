import { NextResponse } from "next/server";

import { getOptionalEnv } from "@/lib/env";
import { processScheduledNotifications } from "@/lib/pings";

export async function GET(request: Request) {
  const secret = getOptionalEnv("CRON_SECRET");
  const authorization = request.headers.get("authorization");

  if (secret && authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processScheduledNotifications();
  return NextResponse.json(result);
}
