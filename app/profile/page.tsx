import Link from "next/link";
import { ProfileForms } from "@/components/profile-forms";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,email")
    .eq("id", user.id)
    .maybeSingle();
  const email = profile?.email ?? user.email ?? "No email";
  const displayName =
    profile?.display_name ??
    user.user_metadata.name ??
    user.user_metadata.full_name ??
    email.split("@")[0] ??
    "";

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-8">
      <header className="border-b border-stone-200 pb-6">
        <Link className="text-sm font-semibold text-rose-700" href="/lists">
          Back to lists
        </Link>
        <div className="mt-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">
            Filmin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-stone-950">
            Profile
          </h1>
          <p className="mt-2 text-stone-600">
            Manage how your name appears in shared movie lists.
          </p>
        </div>
      </header>

      <section className="py-8">
        <ProfileForms displayName={displayName} email={email} />
      </section>
    </main>
  );
}
