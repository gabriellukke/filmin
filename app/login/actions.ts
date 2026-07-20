"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSafeRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type LoginState = {
  error?: string;
  success?: string;
};

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  next: z.string().optional(),
});

function getMagicLinkErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim() &&
    error.message.trim() !== "{}"
  ) {
    return error.message;
  }

  return "Could not send the magic link. Check your Supabase SMTP settings, Resend API key, and verified sender domain.";
}

export async function signInWithMagicLink(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email." };
  }

  const requestHeaders = await headers();
  const origin =
    requestHeaders.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const next = getSafeRedirect(parsed.data.next);
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
        next,
      )}`,
    },
  });

  if (error) {
    return { error: getMagicLinkErrorMessage(error) };
  }

  return { success: "Check your email for a sign-in link." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
