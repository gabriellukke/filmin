"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/login/actions";

export function ProfileMenu({
  avatarUrl,
  displayName,
  email,
}: {
  avatarUrl: string | null;
  displayName: string;
  email: string;
}) {
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
        aria-label="Open profile menu"
        className="relative flex size-11 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-rose-100 text-sm font-semibold uppercase text-rose-700 ring-1 ring-stone-200 transition hover:ring-stone-300"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        type="button"
      >
        {avatarUrl ? (
          <Image
            alt=""
            className="object-cover"
            fill
            sizes="44px"
            src={avatarUrl}
            unoptimized
          />
        ) : (
          displayName.slice(0, 1)
        )}
      </button>

      {open ? (
        <div
          className="absolute right-0 z-20 mt-2 w-60 rounded-lg border border-stone-200 bg-white p-2 shadow-xl"
          role="menu"
        >
          <div className="border-b border-stone-100 px-3 py-2">
            <p className="truncate text-sm font-semibold text-stone-950">
              {displayName}
            </p>
            <p className="truncate text-xs text-stone-500">{email}</p>
          </div>
          <Link
            className="mt-2 block rounded-md px-3 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
            href="/profile"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            Profile
          </Link>
          <form action={signOut}>
            <button
              className="flex w-full cursor-pointer rounded-md px-3 py-2.5 text-left text-sm font-medium text-stone-800 transition hover:bg-stone-50"
              role="menuitem"
              type="submit"
            >
              Log out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
