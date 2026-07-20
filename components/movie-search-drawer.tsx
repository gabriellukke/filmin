"use client";

import { useEffect, useState } from "react";
import { MovieSearch } from "@/components/movie-search";

function AddIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function CloseIcon() {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function MovieSearchDrawer({ listId }: { listId: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        className="button-primary cursor-pointer gap-2"
        onClick={() => setOpen(true)}
        type="button"
      >
        <AddIcon />
        Add movie
      </button>

      {open ? (
        <div
          aria-labelledby="movie-search-drawer-title"
          aria-modal="true"
          className="fixed inset-0 z-50"
          role="dialog"
        >
          <button
            aria-label="Close add movie drawer"
            className="drawer-backdrop absolute inset-0 cursor-default bg-stone-950/35"
            onClick={() => setOpen(false)}
            type="button"
          />
          <aside className="drawer-sheet absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:w-[28rem] sm:rounded-l-2xl sm:rounded-tr-none sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                  Filmin
                </p>
                <h2
                  className="mt-1 text-xl font-semibold text-stone-950"
                  id="movie-search-drawer-title"
                >
                  Add movies
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  Search TMDB and add movies to this shared list.
                </p>
              </div>
              <button
                aria-label="Close drawer"
                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50 hover:text-stone-950"
                onClick={() => setOpen(false)}
                title="Close"
                type="button"
              >
                <CloseIcon />
              </button>
            </div>
            <MovieSearch listId={listId} showHeader={false} variant="plain" />
          </aside>
        </div>
      ) : null}
    </>
  );
}
