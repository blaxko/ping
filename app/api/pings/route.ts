import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createPingForUser } from "@/lib/pings";
import { createPingSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as unknown;
  const parsed = createPingSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.flatten().formErrors[0] ?? "Please check the form."
      },
      { status: 400 }
    );
  }

  try {
    const ping = await createPingForUser(userId, parsed.data);
    return NextResponse.json({ id: ping.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while creating the ping."
      },
      { status: 500 }
    );
  }
}
