import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { inviteCodeSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  const parsed = inviteCodeSchema.safeParse(inviteCode);

  if (!parsed.success) {
    notFound();
  }

  const { supabase } = await requireUser();
  const { data: listId, error } = await supabase.rpc("join_list_by_invite", {
    invite: parsed.data,
  });

  if (!error && listId) {
    redirect(`/lists/${listId}`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-12">
      <div className="panel rounded-lg p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">
          Invite
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-stone-950">
          This invite link is not valid
        </h1>
        <p className="mt-3 text-stone-700">
          The list may have been removed, or the invite code may have been
          copied incorrectly.
        </p>
        <Link className="button-primary mt-6" href="/lists">
          Back to lists
        </Link>
      </div>
    </main>
  );
}
