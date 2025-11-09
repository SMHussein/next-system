import type { NextRequest } from "next/server";
import db from "@/db";
import { cronLogs } from "@/db/schema";
import env from "../../../../env";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  try {
    await db.insert(cronLogs).values({
      info: "CRON JOB EXECUTED 🕺🕺",
    });
  } catch (e) {
    console.error(e);
    throw e;
  }

  return Response.json({ success: true });
}
