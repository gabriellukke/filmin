"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { passwordSchema } from "@/lib/validation";

type ProfileState = {
  error?: string;
  success?: string;
};

const profileSchema = z.object({
  display_name: z.string().trim().min(1, "Display name is required.").max(80),
});

const updatePasswordSchema = z.object({
  password: passwordSchema,
});

export async function updateProfileAction(
  _state: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const parsed = profileSchema.safeParse({
    display_name: formData.get("display_name"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Profile could not be saved.",
    };
  }

  const { supabase, user } = await requireUser();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.display_name })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: { name: parsed.data.display_name },
  });

  if (authError) {
    return { error: authError.message };
  }

  revalidatePath("/profile");
  revalidatePath("/lists");
  return { success: "Profile updated." };
}

export async function updatePasswordAction(
  _state: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Password could not be saved.",
    };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password updated." };
}
