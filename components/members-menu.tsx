"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type MembersMenuItem = {
  user_id: string;
  role: "owner" | "member";
  name: string;
  avatar_url: string | null;
};

function UsersIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function MembersMenu({ members }: { members: MembersMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="button-secondary cursor-pointer gap-2"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        type="button"
      >
        <UsersIcon />
        <span>{members.length}</span>
      </button>

      {open ? (
        <div
          className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-stone-200 bg-white p-2 shadow-xl"
          role="menu"
        >
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            Members
          </p>
          {members.length > 0 ? (
            <div className="grid gap-1">
              {members.map((member) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-md px-3 py-2"
                  key={member.user_id}
                  role="menuitem"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-rose-100 text-sm font-semibold uppercase text-rose-700">
                      {member.avatar_url ? (
                        <Image
                          alt=""
                          className="object-cover"
                          fill
                          sizes="36px"
                          src={member.avatar_url}
                          unoptimized
                        />
                      ) : (
                        member.name.slice(0, 1)
                      )}
                    </div>
                    <p className="truncate text-sm font-medium text-stone-950">
                      {member.name}
                    </p>
                  </div>
                  <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-semibold capitalize text-stone-600">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-3 py-2 text-sm text-stone-600">
              Members will appear here after they join.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
