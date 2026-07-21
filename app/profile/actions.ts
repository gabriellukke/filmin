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

const avatarSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, "Choose an image to upload.")
  .refine(
    (file) => file.size <= 2 * 1024 * 1024,
    "Profile picture must be 2MB or smaller.",
  )
  .refine(
    (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    "Use a JPEG, PNG, or WebP image.",
  );

function getAvatarExtension(fileType: string) {
  if (fileType === "image/png") {
    return "png";
  }

  if (fileType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

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

export async function updateAvatarAction(
  _state: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const parsed = avatarSchema.safeParse(formData.get("avatar"));

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Profile picture could not be saved.",
    };
  }

  const { supabase, user } = await requireUser();
  const avatarPath = `${user.id}/avatar.${getAvatarExtension(parsed.data.type)}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(avatarPath, parsed.data, {
      cacheControl: "3600",
      contentType: parsed.data.type,
      upsert: true,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_path: avatarPath })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  revalidatePath("/profile");
  revalidatePath("/lists");
  return { success: "Profile picture updated." };
}
