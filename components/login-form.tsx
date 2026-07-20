"use client";

import { useActionState } from "react";
import { signInWithMagicLink } from "@/app/login/actions";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(signInWithMagicLink, {});

  return (
    <form action={action} className="panel mt-8 rounded-lg p-5">
      <input name="next" type="hidden" value={next} />
      <label className="text-sm font-medium text-stone-800" htmlFor="email">
        Email
      </label>
      <input
        autoComplete="email"
        className="input-field mt-2"
        id="email"
        name="email"
        placeholder="you@example.com"
        required
        type="email"
      />
      {state.error ? (
        <p className="mt-3 text-sm text-rose-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="mt-3 text-sm text-emerald-700">{state.success}</p>
      ) : null}
      <SubmitButton
        className="button-primary mt-4 w-full"
        pendingLabel="Sending..."
      >
        Send magic link
      </SubmitButton>
    </form>
  );
}
