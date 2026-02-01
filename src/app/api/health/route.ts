import { NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle-client";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    database: false,
    timestamp: new Date().toISOString(),
  };

  try {
    await db.execute(sql`SELECT 1`);
    checks.database = true;
  } catch (error) {
    console.error("Health check failed:", error);
  }

  const healthy = checks.database;

  return NextResponse.json(
    { status: healthy ? "healthy" : "unhealthy", checks },
    { status: healthy ? 200 : 503 }
  );
}
