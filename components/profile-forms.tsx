"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  updateAvatarAction,
  updatePasswordAction,
  updateProfileAction,
} from "@/app/profile/actions";
import { SubmitButton } from "@/components/submit-button";

export function ProfileForms({
  avatarUrl,
  displayName,
  email,
}: {
  avatarUrl: string | null;
  displayName: string;
  email: string;
}) {
  const [avatarState, avatarAction] = useActionState(updateAvatarAction, {});
  const [profileState, profileAction] = useActionState(updateProfileAction, {});
  const [passwordState, passwordAction] = useActionState(
    updatePasswordAction,
    {},
  );

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form action={avatarAction} className="panel rounded-lg p-5 lg:col-span-2">
        <h2 className="font-semibold text-stone-950">Profile picture</h2>
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-rose-100 text-3xl font-semibold uppercase text-rose-700">
            {avatarUrl ? (
              <Image
                alt=""
                className="object-cover"
                fill
                sizes="96px"
                src={avatarUrl}
                unoptimized
              />
            ) : (
              displayName.slice(0, 1)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <label
              className="block text-sm font-medium text-stone-800"
              htmlFor="avatar"
            >
              Upload image
            </label>
            <input
              accept="image/jpeg,image/png,image/webp"
              className="mt-2 block w-full text-sm text-stone-700 file:mr-4 file:min-h-10 file:cursor-pointer file:rounded-md file:border file:border-stone-200 file:bg-white file:px-3 file:text-sm file:font-semibold file:text-stone-800 file:transition hover:file:bg-stone-50"
              id="avatar"
              name="avatar"
              required
              type="file"
            />
            <p className="mt-2 text-xs text-stone-500">
              JPEG, PNG, or WebP. Maximum 2MB.
            </p>
            {avatarState.error ? (
              <p className="mt-3 text-sm text-rose-700">
                {avatarState.error}
              </p>
            ) : null}
            {avatarState.success ? (
              <p className="mt-3 text-sm text-emerald-700">
                {avatarState.success}
              </p>
            ) : null}
          </div>
        </div>
        <SubmitButton
          className="button-secondary mt-4 w-full sm:w-auto"
          pendingLabel="Uploading..."
        >
          Upload picture
        </SubmitButton>
      </form>

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
