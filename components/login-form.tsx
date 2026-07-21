"use client";

import { useActionState, useState } from "react";
import {
  signInWithGoogle,
  signInWithMagicLink,
  signInWithPassword,
  signUpWithPassword,
} from "@/app/login/actions";
import { SubmitButton } from "@/components/submit-button";

type AuthMode = "signin" | "signup";

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [magicLinkState, magicLinkAction] = useActionState(
    signInWithMagicLink,
    {},
  );
  const [passwordState, passwordAction] = useActionState(
    signInWithPassword,
    {},
  );
  const [signupState, signupAction] = useActionState(signUpWithPassword, {});

  return (
    <div className="panel mt-8 rounded-lg p-5">
      <div className="grid grid-cols-2 rounded-lg bg-stone-100 p-1">
        <button
          className={
            mode === "signin"
              ? "min-h-10 cursor-pointer rounded-md bg-white px-3 text-sm font-semibold text-stone-950 shadow-sm"
              : "min-h-10 cursor-pointer rounded-md px-3 text-sm font-semibold text-stone-600 transition hover:text-stone-950"
          }
          onClick={() => setMode("signin")}
          type="button"
        >
          Sign in
        </button>
        <button
          className={
            mode === "signup"
              ? "min-h-10 cursor-pointer rounded-md bg-white px-3 text-sm font-semibold text-stone-950 shadow-sm"
              : "min-h-10 cursor-pointer rounded-md px-3 text-sm font-semibold text-stone-600 transition hover:text-stone-950"
          }
          onClick={() => setMode("signup")}
          type="button"
        >
          Sign up
        </button>
      </div>

      <form action={signInWithGoogle} className="mt-5">
        <input name="next" type="hidden" value={next} />
        <button
          className="button-secondary w-full cursor-pointer gap-2"
          type="submit"
        >
          <span className="flex size-5 items-center justify-center rounded-full border border-stone-300 text-xs font-bold text-rose-700">
            G
          </span>
          Continue with Google
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          or
        </span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      <div className="min-h-[15.5rem]">
        {mode === "signin" ? (
          <form action={passwordAction}>
            <input name="next" type="hidden" value={next} />
            <label
              className="block text-sm font-medium text-stone-800"
              htmlFor="password-email"
            >
              Email
            </label>
            <input
              autoComplete="email"
              className="input-field mt-2"
              id="password-email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
            <label
              className="mt-4 block text-sm font-medium text-stone-800"
              htmlFor="password"
            >
              Password
            </label>
            <input
              autoComplete="current-password"
              className="input-field mt-2"
              id="password"
              name="password"
              required
              type="password"
            />
            <div className="mt-3 min-h-16">
              {passwordState.error ? (
                <p className="text-sm text-rose-700">{passwordState.error}</p>
              ) : (
                <p className="text-sm text-stone-500">
                  Enter the password connected to your Filmin account.
                </p>
              )}
            </div>
            <SubmitButton
              className="button-primary w-full"
              pendingLabel="Signing in..."
            >
              Sign in
            </SubmitButton>
          </form>
        ) : (
          <form action={signupAction}>
            <input name="next" type="hidden" value={next} />
            <label
              className="block text-sm font-medium text-stone-800"
              htmlFor="signup-email"
            >
              Email
            </label>
            <input
              autoComplete="email"
              className="input-field mt-2"
              id="signup-email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
            <label
              className="mt-4 block text-sm font-medium text-stone-800"
              htmlFor="signup-password"
            >
              Password
            </label>
            <input
              autoComplete="new-password"
              className="input-field mt-2"
              id="signup-password"
              name="password"
              required
              type="password"
            />
            <div className="mt-3 min-h-16">
              {signupState.error ? (
                <p className="text-sm text-rose-700">{signupState.error}</p>
              ) : signupState.success ? (
                <p className="text-sm text-emerald-700">
                  {signupState.success}
                </p>
              ) : (
                <p className="text-sm text-stone-500">
                  At least 8 characters, one number, one symbol, and one
                  uppercase letter.
                </p>
              )}
            </div>
            <SubmitButton
              className="button-primary w-full"
              pendingLabel="Creating..."
            >
              Create account
            </SubmitButton>
          </form>
        )}
      </div>

      {mode === "signin" ? (
        <details className="mt-5 border-t border-stone-200 pt-5">
          <summary className="cursor-pointer text-sm font-semibold text-stone-700 transition hover:text-stone-950">
            Email me a magic link instead
          </summary>
          <form action={magicLinkAction} className="mt-4">
            <input name="next" type="hidden" value={next} />
            <label
              className="block text-sm font-medium text-stone-800"
              htmlFor="magic-email"
            >
              Email
            </label>
            <input
              autoComplete="email"
              className="input-field mt-2"
              id="magic-email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
            {magicLinkState.error ? (
              <p className="mt-3 text-sm text-rose-700">
                {magicLinkState.error}
              </p>
            ) : null}
            {magicLinkState.success ? (
              <p className="mt-3 text-sm text-emerald-700">
                {magicLinkState.success}
              </p>
            ) : null}
            <SubmitButton
              className="button-secondary mt-4 w-full"
              pendingLabel="Sending..."
            >
              Send magic link
            </SubmitButton>
          </form>
        </details>
      ) : (
        <p className="mt-5 border-t border-stone-200 pt-5 text-center text-sm text-stone-600">
          Already have an account?{" "}
          <button
            className="cursor-pointer font-semibold text-rose-700"
            onClick={() => setMode("signin")}
            type="button"
          >
            Sign in
          </button>
        </p>
      )}
    </div>
  );
}
