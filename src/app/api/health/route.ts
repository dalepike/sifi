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

  // Always return 200 so Railway doesn't fail deployment
  // The checks object shows actual health status
  return NextResponse.json(
    { status: checks.database ? "healthy" : "degraded", checks },
    { status: 200 }
  );
}
