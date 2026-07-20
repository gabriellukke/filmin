"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useState } from "react";
import { addMovieToListAction } from "@/app/lists/[listId]/actions";
import { SubmitButton } from "@/components/submit-button";
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

export function MovieSearch({ listId }: { listId: string }) {
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState<SearchState>({
    status: "idle",
  });
  const [mutationState, action] = useActionState(addMovieToListAction, {});
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

  return (
    <section className="panel h-fit rounded-lg p-5">
      <h2 className="text-lg font-semibold text-stone-950">Add movies</h2>
      <p className="mt-1 text-sm text-stone-600">
        Search TMDB and add a movie to this shared list.
      </p>
      <label
        className="mt-5 block text-sm font-medium text-stone-800"
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

      {mutationState.error ? (
        <p className="mt-3 text-sm text-rose-700">{mutationState.error}</p>
      ) : null}
      {mutationState.success ? (
        <p className="mt-3 text-sm text-emerald-700">
          {mutationState.success}
        </p>
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
            {visibleSearchState.results.map((movie) => (
              <form
                action={action}
                className="rounded-lg border border-stone-200 p-3"
                key={movie.tmdb_id}
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
                <div className="grid grid-cols-[3.5rem_1fr] gap-3">
                  <div className="relative h-20 overflow-hidden rounded-md bg-stone-100">
                    {movie.poster_path ? (
                      <Image
                        alt=""
                        className="object-cover"
                        fill
                        sizes="56px"
                        src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-2 text-center text-xs text-stone-500">
                        No poster
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-stone-950">
                      {movie.title}
                    </h3>
                    <p className="mt-1 text-sm text-stone-600">
                      {movie.release_date
                        ? new Date(
                            `${movie.release_date}T00:00:00`,
                          ).getFullYear()
                        : "Release date unknown"}
                    </p>
                    <SubmitButton
                      className="button-secondary mt-3 w-full"
                      pendingLabel="Adding..."
                    >
                      Add
                    </SubmitButton>
                  </div>
                </div>
              </form>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
