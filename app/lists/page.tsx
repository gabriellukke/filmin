import Link from "next/link";
import { CreateListForm } from "@/components/create-list-form";
import { ProfileMenu } from "@/components/profile-menu";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getListsErrorMessage(message: string) {
  if (
    message.includes("schema cache") ||
    message.includes("public.lists") ||
    message.includes("relation")
  ) {
    return {
      title: "Database setup is not complete",
      body: "Apply the Supabase migration, then refresh this page. Filmin needs the lists table before it can show or create shared movie lists.",
    };
  }

  return {
    title: "Could not load your lists",
    body: "Something went wrong while loading your shared lists. Refresh the page and try again.",
  };
}

export default async function ListsPage() {
  const { supabase, user } = await requireUser();
  const { data: lists, error } = await supabase
    .from("lists")
    .select("id,name,owner_id,created_at")
    .order("created_at", { ascending: false });
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,email,avatar_path")
    .eq("id", user.id)
    .maybeSingle();
  const email = profile?.email ?? user.email ?? "No email";
  const displayName =
    profile?.display_name ??
    user.user_metadata.name ??
    user.user_metadata.full_name ??
    email.split("@")[0] ??
    "";
  const avatarUrl = profile?.avatar_path
    ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_path).data
        .publicUrl
    : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-8">
      <header className="flex flex-col gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">
            Filmin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-stone-950">
            Movie lists
          </h1>
          <p className="mt-1 text-sm text-stone-600">{email}</p>
        </div>
        <ProfileMenu
          avatarUrl={avatarUrl}
          displayName={displayName}
          email={email}
        />
      </header>

      <section className="grid gap-6 py-8 lg:grid-cols-[22rem_1fr]">
        <CreateListForm />

        <div>
          <h2 className="text-lg font-semibold text-stone-950">
            Your shared lists
          </h2>
          {error ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-900">
              <p className="font-semibold">
                {getListsErrorMessage(error.message).title}
              </p>
              <p className="mt-2 text-sm leading-6 text-rose-800">
                {getListsErrorMessage(error.message).body}
              </p>
            </div>
          ) : lists && lists.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {lists.map((list) => (
                <Link
                  className="panel block rounded-lg p-4 transition hover:border-stone-300 hover:bg-stone-50"
                  href={`/lists/${list.id}`}
                  key={list.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-stone-950">
                        {list.name}
                      </h3>
                      <p className="mt-1 text-sm text-stone-600">
                        Created {new Date(list.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {list.owner_id === user.id ? (
                      <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                        Owner
                      </span>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="panel mt-4 rounded-lg p-6">
              <p className="font-semibold text-stone-950">
                Start your first movie list
              </p>
              <p className="mt-2 max-w-lg text-sm leading-6 text-stone-600">
                Create a list for your next movie night, then share the invite
                link with friends so everyone can add titles and mark what the
                group has watched.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
