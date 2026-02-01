import { NextResponse } from "next/server";
import { getUserWithPasswordHash, verifyPassword } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    console.error("[debug-auth] Testing login for:", email);

    const user = await getUserWithPasswordHash(email);
    console.error("[debug-auth] User found:", !!user);

    if (!user) {
      return NextResponse.json({
        success: false,
        step: "user_lookup",
        error: "User not found"
      });
    }

    console.error("[debug-auth] Hash from DB:", user.passwordHash?.substring(0, 20) + "...");

    const isValid = verifyPassword(password, user.passwordHash);
    console.error("[debug-auth] Password valid:", isValid);

    if (!isValid) {
      return NextResponse.json({
        success: false,
        step: "password_verify",
        error: "Password mismatch",
        hashLength: user.passwordHash?.length
      });
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error("[debug-auth] Error:", error);
    return NextResponse.json({
      success: false,
      step: "exception",
      error: String(error)
    });
  }
}
