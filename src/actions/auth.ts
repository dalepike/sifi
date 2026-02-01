"use server";

import { z } from "zod";
import { createUser, isEmailUnique } from "@/lib/db";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").optional(),
});

export type RegisterResult =
  | { success: true; userId: string }
  | { success: false; error: string };

export async function register(formData: FormData): Promise<RegisterResult> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  };

  const parsed = registerSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const { email, password, name } = parsed.data;

  // Check email uniqueness
  if (!isEmailUnique(email)) {
    return {
      success: false,
      error: "An account with this email already exists",
    };
  }

  try {
    const user = createUser({
      email,
      password,
      name: name || null,
    });

    return { success: true, userId: user.id };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "Failed to create account. Please try again.",
    };
  }
}
