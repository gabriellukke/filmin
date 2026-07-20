import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const listNameSchema = z.object({
  name: z.string().trim().min(1, "List name is required.").max(100),
});

export const inviteCodeSchema = z
  .string()
  .trim()
  .min(8)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/);

export const tmdbQuerySchema = z.object({
  query: z.string().trim().min(2).max(100),
});

const releaseDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .or(z.literal(""))
  .transform((value) => (value === "" ? null : value));

export const movieDtoSchema = z.object({
  tmdb_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1).max(300),
  original_title: z.string().trim().max(300).nullable().optional(),
  poster_path: z.string().trim().max(200).nullable().optional(),
  release_date: releaseDateSchema.optional(),
});

export type MovieDto = z.infer<typeof movieDtoSchema>;

export const addMovieSchema = movieDtoSchema.extend({
  list_id: uuidSchema,
});

export const removeMovieSchema = z.object({
  list_id: uuidSchema,
  list_movie_id: uuidSchema,
});

export const removeMovieByTmdbSchema = z.object({
  list_id: uuidSchema,
  tmdb_id: z.coerce.number().int().positive(),
});

export const watchedSchema = z.object({
  list_id: uuidSchema,
  list_movie_id: uuidSchema,
  watched: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const reorderMoviesSchema = z.object({
  list_id: uuidSchema,
  ordered_ids: z.array(uuidSchema).min(1).max(200),
});
