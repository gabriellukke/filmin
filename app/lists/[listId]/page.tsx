import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  removeMovieFromListAction,
  toggleWatchedAction,
} from "@/app/lists/[listId]/actions";
import { MovieSearch } from "@/components/movie-search";
import { requireUser } from "@/lib/auth";
import { uuidSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type ListMovie = {
  id: string;
  watched: boolean;
  added_at: string;
  added_by: string | null;
  movies: {
    id: string;
    tmdb_id: number;
    title: string;
    original_title: string | null;
    poster_path: string | null;
    release_date: string | null;
  } | null;
  profiles: {
    id: string;
    email: string | null;
    display_name: string | null;
  } | null;
};

type ListMember = {
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  profiles: {
    id: string;
    email: string | null;
    display_name: string | null;
  } | null;
};

function getMemberName(member: ListMember) {
  return (
    member.profiles?.display_name ||
    member.profiles?.email ||
    "Unknown member"
  );
}

function getProfileName(
  profile: { email: string | null; display_name: string | null } | null,
) {
  return profile?.display_name || profile?.email || "Unknown member";
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
      "id,watched,added_at,added_by,movies(id,tmdb_id,title,original_title,poster_path,release_date),profiles!list_movies_added_by_profiles_fkey(id,email,display_name)",
    )
    .eq("list_id", list.id)
    .order("added_at", { ascending: false })
    .returns<ListMovie[]>();

  const { data: members, error: membersError } = await supabase
    .from("list_members")
    .select(
      "user_id,role,joined_at,profiles!list_members_user_id_profiles_fkey(id,email,display_name)",
    )
    .eq("list_id", list.id)
    .order("joined_at", { ascending: true })
    .returns<ListMember[]>();

  const inviteUrl = `/join/${list.invite_code}`;

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-8">
      <header className="border-b border-stone-200 pb-6">
        <Link className="text-sm font-semibold text-rose-700" href="/lists">
          Back to lists
        </Link>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
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
          <div className="panel rounded-lg p-4 lg:w-80">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-stone-950">Members</h2>
              <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-600">
                {members?.length ?? 0}
              </span>
            </div>
            {membersError ? (
              <p className="mt-3 text-sm text-rose-700">
                Could not load list members.
              </p>
            ) : members && members.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {members.map((member) => (
                  <div
                    className="flex items-center justify-between gap-3"
                    key={member.user_id}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-semibold uppercase text-rose-700">
                        {getMemberName(member).slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-stone-950">
                          {getMemberName(member)}
                        </p>
                        {member.profiles?.email ? (
                          <p className="truncate text-xs text-stone-500">
                            {member.profiles.email}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-semibold capitalize text-stone-600">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-stone-600">
                Members will appear here after they join.
              </p>
            )}
          </div>
        </div>
      </header>

      <section className="grid gap-8 py-8 lg:grid-cols-[24rem_1fr]">
        <MovieSearch listId={list.id} />

        <div>
          <h2 className="text-lg font-semibold text-stone-950">Movies</h2>
          {movieError ? (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {movieError.message}
            </p>
          ) : listMovies && listMovies.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {listMovies.map((item) => {
                const movie = item.movies;

                if (!movie) {
                  return null;
                }

                return (
                  <article className="panel rounded-lg p-3" key={item.id}>
                    <div className="grid grid-cols-[4.5rem_1fr] gap-4">
                      <div className="relative h-28 overflow-hidden rounded-md bg-stone-100">
                        {movie.poster_path ? (
                          <Image
                            alt=""
                            className="object-cover"
                            fill
                            sizes="72px"
                            src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-stone-500">
                            No poster
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-semibold text-stone-950">
                              {movie.title}
                            </h3>
                            <p className="mt-1 text-sm text-stone-600">
                              {movie.release_date
                                ? new Date(
                                    `${movie.release_date}T00:00:00`,
                                  ).getFullYear()
                                : "Release date unknown"}
                            </p>
                            <p className="mt-2 text-sm text-stone-500">
                              Added by {getProfileName(item.profiles)}
                            </p>
                          </div>
                          <span
                            className={
                              item.watched
                                ? "rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
                                : "rounded-md bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-600"
                            }
                          >
                            {item.watched ? "Watched" : "Unwatched"}
                          </span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <form action={toggleWatchedAction}>
                            <input
                              name="list_id"
                              type="hidden"
                              value={list.id}
                            />
                            <input
                              name="list_movie_id"
                              type="hidden"
                              value={item.id}
                            />
                            <input
                              name="watched"
                              type="hidden"
                              value={item.watched ? "false" : "true"}
                            />
                            <button className="button-secondary" type="submit">
                              Mark {item.watched ? "unwatched" : "watched"}
                            </button>
                          </form>
                          <form action={removeMovieFromListAction}>
                            <input
                              name="list_id"
                              type="hidden"
                              value={list.id}
                            />
                            <input
                              name="list_movie_id"
                              type="hidden"
                              value={item.id}
                            />
                            <button className="button-danger" type="submit">
                              Remove
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="panel mt-4 rounded-lg p-6">
              <p className="font-medium text-stone-950">No movies yet.</p>
              <p className="mt-1 text-sm text-stone-600">
                Search TMDB and add the first title for the group.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
