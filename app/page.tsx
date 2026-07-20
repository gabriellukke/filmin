import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/lists");
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">
            Filmin
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-normal text-stone-950 sm:text-6xl">
            Shared movie lists without the spreadsheet.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-stone-700">
            Create a list, invite friends with a link, search TMDB, and keep
            track of what the group has watched.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="button-primary" href="/login">
              Sign in
            </Link>
            <Link className="button-secondary" href="/lists">
              Open lists
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
