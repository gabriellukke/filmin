"use client";

import { useActionState } from "react";
import {
  updatePasswordAction,
  updateProfileAction,
} from "@/app/profile/actions";
import { SubmitButton } from "@/components/submit-button";

export function ProfileForms({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const [profileState, profileAction] = useActionState(updateProfileAction, {});
  const [passwordState, passwordAction] = useActionState(
    updatePasswordAction,
    {},
  );

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form action={profileAction} className="panel rounded-lg p-5">
        <h2 className="font-semibold text-stone-950">Profile</h2>
        <p className="mt-1 text-sm text-stone-600">{email}</p>
        <label
          className="mt-5 block text-sm font-medium text-stone-800"
          htmlFor="display-name"
        >
          Display name
        </label>
        <input
          className="input-field mt-2"
          defaultValue={displayName}
          id="display-name"
          name="display_name"
          required
        />
        {profileState.error ? (
          <p className="mt-3 text-sm text-rose-700">{profileState.error}</p>
        ) : null}
        {profileState.success ? (
          <p className="mt-3 text-sm text-emerald-700">
            {profileState.success}
          </p>
        ) : null}
        <SubmitButton
          className="button-primary mt-4 w-full"
          pendingLabel="Saving..."
        >
          Save profile
        </SubmitButton>
      </form>

      <form action={passwordAction} className="panel rounded-lg p-5">
        <h2 className="font-semibold text-stone-950">Password</h2>
        <p className="mt-1 text-sm text-stone-600">
          Set or change the password for this account.
        </p>
        <label
          className="mt-5 block text-sm font-medium text-stone-800"
          htmlFor="new-password"
        >
          New password
        </label>
        <input
          autoComplete="new-password"
          className="input-field mt-2"
          id="new-password"
          name="password"
          required
          type="password"
        />
        {passwordState.error ? (
          <p className="mt-3 text-sm text-rose-700">{passwordState.error}</p>
        ) : null}
        {passwordState.success ? (
          <p className="mt-3 text-sm text-emerald-700">
            {passwordState.success}
          </p>
        ) : null}
        <SubmitButton
          className="button-secondary mt-4 w-full"
          pendingLabel="Updating..."
        >
          Update password
        </SubmitButton>
      </form>
    </div>
  );
}
