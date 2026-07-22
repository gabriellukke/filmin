import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSafeRedirect } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/lists");
  }

  const params = await searchParams;
  const next = getSafeRedirect(params.next);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-12 sm:justify-start sm:pt-24">
      <div className="mb-8 flex justify-end">
        <ThemeToggle />
      </div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">
          Filmin
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-950">
          Welcome to Filmin
        </h1>
        <p className="mt-3 text-stone-700">
          Sign in or create an account to share movie lists with friends.
        </p>
      </div>
      {params.error ? (
        <p className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {decodeURIComponent(params.error)}
        </p>
      ) : null}
      <LoginForm next={next} />
    </main>
  );
}
