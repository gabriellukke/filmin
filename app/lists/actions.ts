"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSafeRedirect, requireUser } from "@/lib/auth";
import { generateInviteCode } from "@/lib/invite-code";
import { listNameSchema } from "@/lib/validation";

type CreateListState = {
  error?: string;
};

export async function createListAction(
  _state: CreateListState,
  formData: FormData,
): Promise<CreateListState> {
  const parsed = listNameSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter a valid list name.",
    };
  }

  const { supabase, user } = await requireUser();
  const listId = crypto.randomUUID();
  const inviteCode = generateInviteCode();

  const { error: listError } = await supabase.from("lists").insert({
    id: listId,
    name: parsed.data.name,
    owner_id: user.id,
    invite_code: inviteCode,
  });

  if (listError) {
    return { error: listError?.message ?? "Could not create the list." };
  }

  const { error: memberError } = await supabase.from("list_members").insert({
    list_id: listId,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    return { error: memberError.message };
  }

  revalidatePath("/lists");
  redirect(getSafeRedirect(`/lists/${listId}`));
}
