"use client";

import { useActionState } from "react";
import { createListAction } from "@/app/lists/actions";
import { SubmitButton } from "@/components/submit-button";

export function CreateListForm() {
  const [state, action] = useActionState(createListAction, {});

  return (
    <form action={action} className="panel h-fit rounded-lg p-5">
      <h2 className="text-lg font-semibold text-stone-950">Create a list</h2>
      <p className="mt-1 text-sm text-stone-600">
        Start a shared watch list and invite friends after it is created.
      </p>
      <label
        className="mt-5 block text-sm font-medium text-stone-800"
        htmlFor="name"
      >
        List name
      </label>
      <input
        className="input-field mt-2"
        id="name"
        maxLength={100}
        name="name"
        placeholder="Friday movie night"
        required
      />
      {state.error ? (
        <p className="mt-3 text-sm text-rose-700">{state.error}</p>
      ) : null}
      <SubmitButton
        className="button-primary mt-4 w-full"
        pendingLabel="Creating..."
      >
        Create list
      </SubmitButton>
    </form>
  );
}
