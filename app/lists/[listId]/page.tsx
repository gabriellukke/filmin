import Link from "next/link";
import { notFound } from "next/navigation";
import { MembersMenu } from "@/components/members-menu";
import { MovieList, type MovieListItem } from "@/components/movie-list";
import { requireUser } from "@/lib/auth";
import { uuidSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type ListMember = {
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  profiles: {
    id: string;
    email: string | null;
    display_name: string | null;
    avatar_path: string | null;
    avatar_url?: string | null;
  } | null;
};

type ListMovieRow = Omit<MovieListItem, "profiles"> & {
  profiles: {
    id: string;
    email: string | null;
    display_name: string | null;
    avatar_path: string | null;
  } | null;
};

function getMemberName(member: ListMember) {
  return (
    member.profiles?.display_name ||
    member.profiles?.email ||
    "Unknown member"
  );
}

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await params;
  const parsedListId = uuidSchema.safeParse(listId);

  if (!parsedListId.success) {
    notFound();
  }

  const { supabase } = await requireUser();
  const { data: list, error: listError } = await supabase
    .from("lists")
    .select("id,name,invite_code,created_at")
    .eq("id", parsedListId.data)
    .single();

  if (listError || !list) {
    notFound();
  }

  const { data: listMovies, error: movieError } = await supabase
    .from("list_movies")
    .select(
      "id,watched,added_at,added_by,position,movies(id,tmdb_id,title,original_title,poster_path,release_date),profiles!list_movies_added_by_profiles_fkey(id,email,display_name,avatar_path)",
    )
    .eq("list_id", list.id)
    .order("position", { ascending: true })
    .order("added_at", { ascending: true })
    .returns<ListMovieRow[]>();

  const { data: members, error: membersError } = await supabase
    .from("list_members")
    .select(
      "user_id,role,joined_at,profiles!list_members_user_id_profiles_fkey(id,email,display_name,avatar_path)",
    )
    .eq("list_id", list.id)
    .order("joined_at", { ascending: true })
    .returns<ListMember[]>();

  const inviteUrl = `/join/${list.invite_code}`;
  const membersWithAvatars =
    members?.map((member) => ({
      ...member,
      profiles: member.profiles
        ? {
            ...member.profiles,
            avatar_url: member.profiles.avatar_path
              ? supabase.storage
                  .from("avatars")
                  .getPublicUrl(member.profiles.avatar_path).data.publicUrl
              : null,
          }
        : null,
    })) ?? [];
  const memberMenuItems = membersWithAvatars.map((member) => ({
    user_id: member.user_id,
    role: member.role,
    name: getMemberName(member),
    avatar_url: member.profiles?.avatar_url ?? null,
  }));
  const listMoviesWithAvatars =
    listMovies?.map((item) => ({
      ...item,
      profiles: item.profiles
        ? {
            ...item.profiles,
            avatar_url: item.profiles.avatar_path
              ? supabase.storage
                  .from("avatars")
                  .getPublicUrl(item.profiles.avatar_path).data.publicUrl
              : null,
          }
        : null,
    })) ?? [];

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-8">
      <header className="border-b border-stone-200 pb-6">
        <Link className="text-sm font-semibold text-rose-700" href="/lists">
          Back to lists
        </Link>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold text-stone-950">
              {list.name}
            </h1>
            <p className="mt-2 text-stone-600">
              Share this invite link with friends:
            </p>
            <code className="mt-2 block break-all rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-800">
              {inviteUrl}
            </code>
          </div>
          {membersError ? (
            <p className="text-sm text-rose-700">Could not load members.</p>
          ) : (
            <MembersMenu members={memberMenuItems} />
          )}
        </div>
      </header>

      <section className="py-8">
        <h2 className="text-lg font-semibold text-stone-950">Movies</h2>
        {movieError ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {movieError.message}
          </p>
        ) : (
          <MovieList
            initialItems={listMoviesWithAvatars}
            listId={list.id}
          />
        )}
      </section>
    </main>
  );
}
