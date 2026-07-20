"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import {
  removeMovieFromListAction,
  reorderMoviesAction,
  toggleWatchedAction,
} from "@/app/lists/[listId]/actions";

export type MovieListItem = {
  id: string;
  watched: boolean;
  added_at: string;
  added_by: string | null;
  position: number;
  movies: {
    id: string;
    tmdb_id: number;
    title: string;
    original_title: string | null;
    poster_path: string | null;
    release_date: string | null;
  } | null;
  profiles: {
    id: string;
    email: string | null;
    display_name: string | null;
  } | null;
};

function getProfileName(
  profile: { email: string | null; display_name: string | null } | null,
) {
  return profile?.display_name || profile?.email || "Unknown member";
}

function moveItem(items: MovieListItem[], fromId: string, toId: string) {
  const fromIndex = items.findIndex((item) => item.id === fromId);
  const toIndex = items.findIndex((item) => item.id === toId);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function hasSameOrder(a: MovieListItem[], b: MovieListItem[]) {
  return (
    a.length === b.length && a.every((item, index) => item.id === b[index]?.id)
  );
}

function EyeIcon() {
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
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CheckIcon() {
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
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function TrashIcon() {
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
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

export function MovieList({
  initialItems,
  listId,
}: {
  initialItems: MovieListItem[];
  listId: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const itemsRef = useRef(initialItems);
  const dragStartItemsRef = useRef<MovieListItem[] | null>(null);
  const didDropRef = useRef(false);

  function setMovieItems(nextItems: MovieListItem[]) {
    itemsRef.current = nextItems;
    setItems(nextItems);
  }

  function saveOrder(nextItems: MovieListItem[], rollbackItems: MovieListItem[]) {
    setMovieItems(nextItems);
    setError(null);

    startTransition(async () => {
      const result = await reorderMoviesAction(
        listId,
        nextItems.map((item) => item.id),
      );

      if (result.error) {
        setMovieItems(rollbackItems);
        setError(result.error);
        return;
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="panel mt-4 rounded-lg p-6">
        <p className="font-medium text-stone-950">No movies yet.</p>
        <p className="mt-1 text-sm text-stone-600">
          Search TMDB and add the first title for the group.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-stone-600">
          Drag movies to reorder the list.
        </p>
        {isPending ? (
          <p className="text-sm text-stone-500">Saving order...</p>
        ) : null}
      </div>
      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
      <div className="grid gap-3">
        {items.map((item) => {
          const movie = item.movies;

          if (!movie) {
            return null;
          }

          return (
            <article
              className={
                draggedId === item.id
                  ? "panel cursor-grabbing rounded-lg p-2 opacity-60"
                  : "panel cursor-grab rounded-lg p-2"
              }
              draggable
              key={item.id}
              onDragEnd={() => {
                if (!didDropRef.current && dragStartItemsRef.current) {
                  setMovieItems(dragStartItemsRef.current);
                }

                setDraggedId(null);
                dragStartItemsRef.current = null;
                didDropRef.current = false;
              }}
              onDragOver={(event) => {
                event.preventDefault();
                const activeDraggedId = draggedId;

                if (!activeDraggedId || activeDraggedId === item.id) {
                  return;
                }

                const nextItems = moveItem(
                  itemsRef.current,
                  activeDraggedId,
                  item.id,
                );

                if (!hasSameOrder(itemsRef.current, nextItems)) {
                  setMovieItems(nextItems);
                }
              }}
              onDragStart={(event) => {
                setDraggedId(item.id);
                dragStartItemsRef.current = itemsRef.current;
                didDropRef.current = false;
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", item.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const droppedId = event.dataTransfer.getData("text/plain");

                if (!droppedId) {
                  return;
                }

                didDropRef.current = true;
                setDraggedId(null);

                const rollbackItems =
                  dragStartItemsRef.current ?? itemsRef.current;
                const nextItems = itemsRef.current;

                dragStartItemsRef.current = null;

                if (!hasSameOrder(rollbackItems, nextItems)) {
                  saveOrder(nextItems, rollbackItems);
                }
              }}
            >
              <div className="grid grid-cols-[1.5rem_4.5rem_minmax(0,1fr)] gap-3">
                <div className="flex h-[6.75rem] cursor-grab items-center justify-center text-stone-400 active:cursor-grabbing">
                  <span aria-hidden="true" className="text-lg leading-none">
                    ⋮⋮
                  </span>
                  <span className="sr-only">Drag to reorder</span>
                </div>
                <div className="relative h-[6.75rem] w-[4.5rem] overflow-hidden rounded-md bg-stone-100">
                  {movie.poster_path ? (
                    <Image
                      alt=""
                      className="object-cover"
                      fill
                      sizes="72px"
                      src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-2 text-center text-xs text-stone-500">
                      No poster
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex h-full flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-stone-950">
                          {movie.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-stone-600">
                          {movie.release_date
                            ? new Date(
                                `${movie.release_date}T00:00:00`,
                              ).getFullYear()
                            : "Release date unknown"}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          Added by {getProfileName(item.profiles)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <form action={toggleWatchedAction}>
                          <input name="list_id" type="hidden" value={listId} />
                          <input
                            name="list_movie_id"
                            type="hidden"
                            value={item.id}
                          />
                          <input
                            name="watched"
                            type="hidden"
                            value={item.watched ? "false" : "true"}
                          />
                          <button
                            aria-label={
                              item.watched
                                ? "Mark movie as unwatched"
                                : "Mark movie as watched"
                            }
                            className={
                              item.watched
                                ? "inline-flex size-9 cursor-pointer items-center justify-center rounded-md bg-emerald-50 text-emerald-700 transition hover:bg-stone-100 hover:text-stone-600"
                                : "inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50 hover:text-stone-950"
                            }
                            title={
                              item.watched
                                ? "Undo watched"
                                : "Mark as watched"
                            }
                            type="submit"
                          >
                            {item.watched ? <CheckIcon /> : <EyeIcon />}
                          </button>
                        </form>
                        <form action={removeMovieFromListAction}>
                          <input name="list_id" type="hidden" value={listId} />
                          <input
                            name="list_movie_id"
                            type="hidden"
                            value={item.id}
                          />
                          <button
                            aria-label="Remove movie"
                            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-rose-100 bg-white text-rose-700 transition hover:bg-rose-50"
                            title="Remove movie"
                            type="submit"
                          >
                            <TrashIcon />
                          </button>
                        </form>
                      </div>
                    </div>
                    <div className="text-xs font-semibold">
                      {item.watched ? (
                        <span className="text-emerald-700">Watched</span>
                      ) : (
                        <span className="text-stone-500">Unwatched</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
