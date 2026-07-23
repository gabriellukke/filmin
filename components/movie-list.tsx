"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  removeMovieFromListAction,
  reorderMoviesAction,
  toggleWatchedAction,
} from "@/app/lists/[listId]/actions";
import { MovieSearchDrawer } from "@/components/movie-search-drawer";

export type MovieListItem = {
  id: string;
  watched: boolean;
  watched_at: string | null;
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
    avatar_url: string | null;
  } | null;
};

type SortMode = "custom" | "added_at" | "title";
type FilterMode = "all" | "watched" | "unwatched";

const sortOptions: { label: string; value: SortMode }[] = [
  { label: "Custom order", value: "custom" },
  { label: "Recently added", value: "added_at" },
  { label: "Alphabetical", value: "title" },
];

const filterOptions: { label: string; value: FilterMode }[] = [
  { label: "All", value: "all" },
  { label: "Watched", value: "watched" },
  { label: "Unwatched", value: "unwatched" },
];

function getProfileName(
  profile: { email: string | null; display_name: string | null } | null,
) {
  return profile?.display_name || profile?.email || "Unknown member";
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatWatchedDate(date: string | null) {
  if (!date) {
    return "Set date";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
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

function sortMovies(items: MovieListItem[], sortMode: SortMode) {
  if (sortMode === "custom") {
    return items;
  }

  return [...items].sort((a, b) => {
    if (sortMode === "added_at") {
      return (
        new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
      );
    }

    return (a.movies?.title ?? "").localeCompare(b.movies?.title ?? "", undefined, {
      sensitivity: "base",
    });
  });
}

function filterMovies(items: MovieListItem[], filterMode: FilterMode) {
  if (filterMode === "all") {
    return items;
  }

  return items.filter((item) =>
    filterMode === "watched" ? item.watched : !item.watched,
  );
}

function getFilterLabel(filterMode: FilterMode) {
  return (
    filterOptions.find((option) => option.value === filterMode)?.label ?? "All"
  );
}

function getSortLabel(sortMode: SortMode) {
  return (
    sortOptions.find((option) => option.value === sortMode)?.label ??
    "Custom order"
  );
}

function FilterIcon() {
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
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
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

function ListIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
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

function WatchedDateEditor({
  item,
  listId,
}: {
  item: MovieListItem;
  listId: string;
}) {
  const initialDate = item.watched_at ?? getTodayDate();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  return (
    <div className="relative">
      <button
        aria-expanded={isOpen}
        className="inline-flex h-8 cursor-pointer items-center rounded-md border border-stone-200 bg-white px-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 hover:text-stone-950 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200 dark:hover:bg-stone-900 dark:hover:text-white"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {formatWatchedDate(item.watched_at)}
      </button>

      {isOpen ? (
        <form
          action={async (formData) => {
            setIsOpen(false);
            await toggleWatchedAction(formData);
          }}
          className="absolute left-0 z-20 mt-2 w-56 rounded-lg border border-stone-200 bg-white p-3 shadow-lg dark:border-stone-700 dark:bg-stone-950"
        >
          <input name="list_id" type="hidden" value={listId} />
          <input name="list_movie_id" type="hidden" value={item.id} />
          <input name="watched" type="hidden" value="true" />
          <label
            className="mb-2 block text-xs font-semibold text-stone-600 dark:text-stone-300"
            htmlFor={`watched-at-${item.id}`}
          >
            Watched date
          </label>
          <input
            className="h-9 w-full rounded-md border border-stone-200 bg-white px-2 text-sm font-medium text-stone-700 outline-none transition focus:border-rose-700 focus:shadow-[0_0_0_3px_rgb(190_18_60_/_0.14)] dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200"
            id={`watched-at-${item.id}`}
            name="watched_at"
            onChange={(event) => setSelectedDate(event.target.value)}
            type="date"
            value={selectedDate}
          />
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              className="inline-flex h-8 cursor-pointer items-center rounded-md px-2 text-xs font-semibold text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-900 dark:hover:text-white"
              onClick={() => setSelectedDate(initialDate)}
              type="button"
            >
              Reset
            </button>
            <button
              className="inline-flex h-8 cursor-pointer items-center rounded-md bg-rose-700 px-3 text-xs font-semibold text-white transition hover:bg-rose-800"
              type="submit"
            >
              Save
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

export function MovieList({
  initialItems,
  listId,
}: {
  initialItems: MovieListItem[];
  listId: string;
}) {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("custom");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const canDrag = sortMode === "custom" && filterMode === "all";
  const itemsKey = initialItems
    .map(
      (item) =>
        `${item.id}:${item.position}:${item.watched}:${item.watched_at ?? ""}`,
    )
    .join("|");

  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-600">
          {canDrag
            ? "Drag movies to reorder the list."
            : "Switch to all movies and custom order to drag movies."}
        </p>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="relative">
            <button
              aria-expanded={filterMenuOpen}
              aria-haspopup="menu"
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 hover:text-stone-950"
              onClick={() => {
                setFilterMenuOpen((open) => !open);
                setSortMenuOpen(false);
              }}
              type="button"
            >
              <span>{getFilterLabel(filterMode)}</span>
              <FilterIcon />
            </button>
            {filterMenuOpen ? (
              <div
                className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-stone-200 bg-white p-2 shadow-xl"
                role="menu"
              >
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Filter by
                </p>
                {filterOptions.map((option) => {
                  const selected = option.value === filterMode;

                  return (
                    <button
                      aria-checked={selected}
                      className={
                        selected
                          ? "flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold text-emerald-700 transition hover:bg-stone-50"
                          : "flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-stone-800 transition hover:bg-stone-50"
                      }
                      key={option.value}
                      onClick={() => {
                        setFilterMode(option.value);
                        setFilterMenuOpen(false);
                      }}
                      role="menuitemradio"
                      type="button"
                    >
                      <span>{option.label}</span>
                      {selected ? <CheckIcon /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <div className="relative">
            <button
              aria-expanded={sortMenuOpen}
              aria-haspopup="menu"
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 hover:text-stone-950"
              onClick={() => {
                setSortMenuOpen((open) => !open);
                setFilterMenuOpen(false);
              }}
              type="button"
            >
              <span>{getSortLabel(sortMode)}</span>
              <ListIcon />
            </button>
            {sortMenuOpen ? (
              <div
                className="absolute right-0 z-20 mt-2 w-60 rounded-lg border border-stone-200 bg-white p-2 shadow-xl"
                role="menu"
              >
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Sort by
                </p>
                {sortOptions.map((option) => {
                  const selected = option.value === sortMode;

                  return (
                    <button
                      aria-checked={selected}
                      className={
                        selected
                          ? "flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold text-emerald-700 transition hover:bg-stone-50"
                          : "flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-stone-800 transition hover:bg-stone-50"
                      }
                      key={option.value}
                      onClick={() => {
                        setSortMode(option.value);
                        setSortMenuOpen(false);
                      }}
                      role="menuitemradio"
                      type="button"
                    >
                      <span>{option.label}</span>
                      {selected ? <CheckIcon /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <MovieSearchDrawer listId={listId} />
        </div>
      </div>
      <MovieListRows
        canDrag={canDrag}
        filterMode={filterMode}
        initialItems={initialItems}
        key={itemsKey}
        listId={listId}
        sortMode={sortMode}
      />
    </div>
  );
}

function MovieListRows({
  canDrag,
  filterMode,
  initialItems,
  listId,
  sortMode,
}: {
  canDrag: boolean;
  filterMode: FilterMode;
  initialItems: MovieListItem[];
  listId: string;
  sortMode: SortMode;
}) {
  const [items, setItems] = useState(initialItems);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const itemsRef = useRef(initialItems);
  const dragStartItemsRef = useRef<MovieListItem[] | null>(null);
  const didDropRef = useRef(false);
  const visibleItems = useMemo(
    () => sortMovies(filterMovies(items, filterMode), sortMode),
    [filterMode, items, sortMode],
  );

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

  return (
    <>
      {isPending ? (
        <div className="mb-3 flex justify-end">
          <p className="text-sm text-stone-500">Saving order...</p>
        </div>
      ) : null}
      {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
      {items.length === 0 ? (
        <div className="panel rounded-lg p-6">
          <p className="font-medium text-stone-950">No movies yet.</p>
          <p className="mt-1 text-sm text-stone-600">
            Search TMDB and add the first title for the group.
          </p>
        </div>
      ) : null}
      {items.length > 0 && visibleItems.length === 0 ? (
        <div className="panel rounded-lg p-6">
          <p className="font-medium text-stone-950">No movies match.</p>
          <p className="mt-1 text-sm text-stone-600">
            Change the filter to see more movies in this list.
          </p>
        </div>
      ) : null}
      <div className="grid gap-3">
        {visibleItems.map((item) => {
          const movie = item.movies;

          if (!movie) {
            return null;
          }

          return (
            <article
              className={
                !canDrag
                  ? "panel rounded-lg p-2"
                  : draggedId === item.id
                  ? "panel cursor-grabbing rounded-lg p-2 opacity-60"
                  : "panel cursor-grab rounded-lg p-2"
              }
              draggable={canDrag}
              key={item.id}
              onDragEnd={() => {
                if (!canDrag) {
                  return;
                }

                if (!didDropRef.current && dragStartItemsRef.current) {
                  setMovieItems(dragStartItemsRef.current);
                }

                setDraggedId(null);
                dragStartItemsRef.current = null;
                didDropRef.current = false;
              }}
              onDragOver={(event) => {
                if (!canDrag) {
                  return;
                }

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
                if (!canDrag) {
                  return;
                }

                setDraggedId(item.id);
                dragStartItemsRef.current = itemsRef.current;
                didDropRef.current = false;
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", item.id);
              }}
              onDrop={(event) => {
                if (!canDrag) {
                  return;
                }

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
              <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3">
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
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
                          <span>Added by</span>
                          <span className="relative flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-rose-100 text-[0.625rem] font-semibold uppercase text-rose-700">
                            {item.profiles?.avatar_url ? (
                              <Image
                                alt=""
                                className="object-cover"
                                fill
                                sizes="20px"
                                src={item.profiles.avatar_url}
                                unoptimized
                              />
                            ) : (
                              getProfileName(item.profiles).slice(0, 1)
                            )}
                          </span>
                          <span className="truncate">
                            {getProfileName(item.profiles)}
                          </span>
                        </div>
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
                          <input
                            name="watched_at"
                            type="hidden"
                            value={item.watched ? "" : getTodayDate()}
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
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                      {item.watched ? (
                        <span className="text-emerald-700">Watched</span>
                      ) : (
                        <span className="text-stone-500">Unwatched</span>
                      )}
                      {item.watched ? (
                        <WatchedDateEditor item={item} listId={listId} />
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
