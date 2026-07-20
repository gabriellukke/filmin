"use server";

import { revalidatePath } from "next/cache";
import {
  addMovieSchema,
  removeMovieByTmdbSchema,
  removeMovieSchema,
  reorderMoviesSchema,
  watchedSchema,
} from "@/lib/validation";
import { requireUser } from "@/lib/auth";

type MutationState = {
  addedTmdbId?: number;
  error?: string;
  removedTmdbId?: number;
  success?: string;
};

export async function addMovieToListAction(
  _state: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = addMovieSchema.safeParse({
    list_id: formData.get("list_id"),
    tmdb_id: formData.get("tmdb_id"),
    title: formData.get("title"),
    original_title: formData.get("original_title") || null,
    poster_path: formData.get("poster_path") || null,
    release_date: formData.get("release_date") || null,
  });

  if (!parsed.success) {
    return { error: "The selected movie could not be added." };
  }

  const { supabase, user } = await requireUser();
  const movie = parsed.data;
  const { data: movieId, error: movieError } = await supabase.rpc(
    "upsert_movie",
    {
      input_tmdb_id: movie.tmdb_id,
      input_title: movie.title,
      input_original_title: movie.original_title ?? null,
      input_poster_path: movie.poster_path ?? null,
      input_release_date: movie.release_date ?? null,
    },
  );

  if (movieError || !movieId) {
    return { error: movieError?.message ?? "Could not save this movie." };
  }

  const { data: lastMovie } = await supabase
    .from("list_movies")
    .select("position")
    .eq("list_id", movie.list_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("list_movies").insert({
    list_id: movie.list_id,
    movie_id: movieId,
    added_by: user.id,
    position: (lastMovie?.position ?? -1) + 1,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        addedTmdbId: movie.tmdb_id,
        success: "That movie is already on this list.",
      };
    }

    return { error: error.message };
  }

  revalidatePath(`/lists/${movie.list_id}`);
  return { addedTmdbId: movie.tmdb_id, success: "Movie added." };
}

export async function reorderMoviesAction(
  listId: string,
  orderedIds: string[],
): Promise<MutationState> {
  const parsed = reorderMoviesSchema.safeParse({
    list_id: listId,
    ordered_ids: orderedIds,
  });

  if (!parsed.success) {
    return { error: "Could not save the new movie order." };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("reorder_list_movies", {
    input_list_id: parsed.data.list_id,
    input_list_movie_ids: parsed.data.ordered_ids,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/lists/${parsed.data.list_id}`);
  return { success: "Movie order saved." };
}

export async function removeMovieFromListAction(formData: FormData) {
  const parsed = removeMovieSchema.safeParse({
    list_id: formData.get("list_id"),
    list_movie_id: formData.get("list_movie_id"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await requireUser();
  await supabase
    .from("list_movies")
    .delete()
    .eq("id", parsed.data.list_movie_id)
    .eq("list_id", parsed.data.list_id);

  revalidatePath(`/lists/${parsed.data.list_id}`);
}

export async function removeMovieByTmdbAction(
  formData: FormData,
): Promise<MutationState> {
  const parsed = removeMovieByTmdbSchema.safeParse({
    list_id: formData.get("list_id"),
    tmdb_id: formData.get("tmdb_id"),
  });

  if (!parsed.success) {
    return { error: "The selected movie could not be removed." };
  }

  const { supabase } = await requireUser();
  const { data: movie, error: movieError } = await supabase
    .from("movies")
    .select("id")
    .eq("tmdb_id", parsed.data.tmdb_id)
    .maybeSingle();

  if (movieError) {
    return { error: movieError.message };
  }

  if (!movie) {
    return { removedTmdbId: parsed.data.tmdb_id };
  }

  const { error } = await supabase
    .from("list_movies")
    .delete()
    .eq("list_id", parsed.data.list_id)
    .eq("movie_id", movie.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/lists/${parsed.data.list_id}`);
  return { removedTmdbId: parsed.data.tmdb_id };
}

export async function toggleWatchedAction(formData: FormData) {
  const parsed = watchedSchema.safeParse({
    list_id: formData.get("list_id"),
    list_movie_id: formData.get("list_movie_id"),
    watched: formData.get("watched"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase } = await requireUser();
  await supabase
    .from("list_movies")
    .update({ watched: parsed.data.watched })
    .eq("id", parsed.data.list_movie_id)
    .eq("list_id", parsed.data.list_id);

  revalidatePath(`/lists/${parsed.data.list_id}`);
}
