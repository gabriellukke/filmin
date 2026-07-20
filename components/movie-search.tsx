"use client";

import Image from "next/image";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  addMovieToListAction,
  removeMovieByTmdbAction,
} from "@/app/lists/[listId]/actions";
import type { MovieDto } from "@/lib/validation";

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; results: MovieDto[] };

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [delayMs, value]);

  return debouncedValue;
}

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

export function MovieSearch({
  listId,
  showHeader = true,
  variant = "panel",
}: {
  listId: string;
  showHeader?: boolean;
  variant?: "panel" | "plain";
}) {
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState<SearchState>({
    status: "idle",
  });
  const [addedMovieIds, setAddedMovieIds] = useState<Set<number>>(new Set());
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [pendingMovieId, setPendingMovieId] = useState<number | null>(null);
  const [isAddingMovie, startAddMovieTransition] = useTransition();
  const trimmedQuery = useMemo(() => query.trim(), [query]);
  const debouncedQuery = useDebouncedValue(trimmedQuery, 400);
  const visibleSearchState: SearchState =
    trimmedQuery.length < 2 ? { status: "idle" } : searchState;

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      return;
    }

    const controller = new AbortController();

    async function searchMovies() {
      setSearchState({ status: "loading" });

      const response = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(debouncedQuery)}`,
        { signal: controller.signal },
      );
      const payload = (await response.json()) as {
        results?: MovieDto[];
        error?: string;
      };

      if (!response.ok) {
        setSearchState({
          status: "error",
          message: payload.error ?? "Search failed.",
        });
        return;
      }

      setSearchState({ status: "success", results: payload.results ?? [] });
    }

    searchMovies().catch((error) => {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setSearchState({
        status: "error",
        message: "Search is unavailable. Try again.",
      });
    });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  function handleToggleMovie(
    event: FormEvent<HTMLFormElement>,
    tmdbId: number,
    wasAdded: boolean,
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setPendingMovieId(tmdbId);
    setMutationError(null);

    startAddMovieTransition(async () => {
      const result = wasAdded
        ? await removeMovieByTmdbAction(formData)
        : await addMovieToListAction({}, formData);

      if (result.error) {
        setMutationError(result.error);
        setPendingMovieId(null);
        return;
      }

      if (result.addedTmdbId) {
        setAddedMovieIds((currentIds) => {
          const nextIds = new Set(currentIds);
          nextIds.add(result.addedTmdbId as number);
          return nextIds;
        });
      }

      if (result.removedTmdbId) {
        setAddedMovieIds((currentIds) => {
          const nextIds = new Set(currentIds);
          nextIds.delete(result.removedTmdbId as number);
          return nextIds;
        });
      }

      setPendingMovieId(null);
    });
  }

  return (
    <section
      className={
        variant === "panel" ? "panel h-fit rounded-lg p-5" : "h-fit"
      }
    >
      {showHeader ? (
        <>
          <h2 className="text-lg font-semibold text-stone-950">Add movies</h2>
          <p className="mt-1 text-sm text-stone-600">
            Search TMDB and add a movie to this shared list.
          </p>
        </>
      ) : null}
      <label
        className={
          showHeader
            ? "mt-5 block text-sm font-medium text-stone-800"
            : "block text-sm font-medium text-stone-800"
        }
        htmlFor="movie-search"
      >
        Movie title
      </label>
      <input
        className="input-field mt-2"
        id="movie-search"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="The Matrix"
        value={query}
      />

      {mutationError ? (
        <p className="mt-3 text-sm text-rose-700">{mutationError}</p>
      ) : null}

      <div className="mt-4">
        {visibleSearchState.status === "idle" ? (
          <p className="text-sm text-stone-600">
            Type at least two characters to search.
          </p>
        ) : null}
        {visibleSearchState.status === "loading" ? (
          <p className="text-sm text-stone-600">Searching...</p>
        ) : null}
        {visibleSearchState.status === "error" ? (
          <p className="text-sm text-rose-700">{visibleSearchState.message}</p>
        ) : null}
        {visibleSearchState.status === "success" &&
        visibleSearchState.results.length === 0 ? (
          <p className="text-sm text-stone-600">No movies found.</p>
        ) : null}
        {visibleSearchState.status === "success" &&
        visibleSearchState.results.length > 0 ? (
          <div className="grid gap-3">
            {visibleSearchState.results.map((movie) => {
              const wasAdded = addedMovieIds.has(movie.tmdb_id);

              return (
                <form
                  className="rounded-lg border border-stone-200 p-3"
                  key={movie.tmdb_id}
                  onSubmit={(event) =>
                    handleToggleMovie(event, movie.tmdb_id, wasAdded)
                  }
                >
                  <input name="list_id" type="hidden" value={listId} />
                  <input name="tmdb_id" type="hidden" value={movie.tmdb_id} />
                  <input name="title" type="hidden" value={movie.title} />
                  <input
                    name="original_title"
                    type="hidden"
                    value={movie.original_title ?? ""}
                  />
                  <input
                    name="poster_path"
                    type="hidden"
                    value={movie.poster_path ?? ""}
                  />
                  <input
                    name="release_date"
                    type="hidden"
                    value={movie.release_date ?? ""}
                  />
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
                    <div className="flex min-w-0 items-start justify-between gap-3">
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
                      </div>
                      <button
                        aria-label={
                          wasAdded
                            ? `Remove ${movie.title} from list`
                            : `Add ${movie.title}`
                        }
                        className={
                          wasAdded
                            ? "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md bg-emerald-50 text-emerald-700 transition hover:bg-rose-50 hover:text-rose-700"
                            : "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50 hover:text-stone-950"
                        }
                        disabled={
                          isAddingMovie && pendingMovieId === movie.tmdb_id
                        }
                        title={
                          wasAdded
                            ? "Remove from list"
                            : pendingMovieId === movie.tmdb_id
                              ? "Adding..."
                              : "Add movie"
                        }
                        type="submit"
                      >
                        {wasAdded ? <CheckIcon /> : <AddIcon />}
                      </button>
                    </div>
                  </div>
                </form>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
