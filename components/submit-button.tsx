"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "button-primary",
  pendingLabel = "Working...",
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? pendingLabel : children}
    </button>
  );
}
