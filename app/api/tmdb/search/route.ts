import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tmdbQuerySchema } from "@/lib/validation";

type TmdbMovie = {
  id: number;
  title?: string;
  original_title?: string;
  poster_path?: string | null;
  release_date?: string;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const parsed = tmdbQuerySchema.safeParse({
    query: request.nextUrl.searchParams.get("query"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Query is too short." }, { status: 400 });
  }

  const token = process.env.TMDB_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "TMDB_ACCESS_TOKEN is not configured." },
      { status: 500 },
    );
  }

  const tmdbUrl = new URL("https://api.themoviedb.org/3/search/movie");
  tmdbUrl.searchParams.set("query", parsed.data.query);
  tmdbUrl.searchParams.set("include_adult", "false");
  tmdbUrl.searchParams.set("language", "en-US");
  tmdbUrl.searchParams.set("page", "1");

  try {
    const response = await fetch(tmdbUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "TMDB search failed. Try again." },
        { status: response.status === 429 ? 429 : 502 },
      );
    }

    const payload = (await response.json()) as { results?: TmdbMovie[] };
    const results = (payload.results ?? []).slice(0, 10).map((movie) => ({
      tmdb_id: movie.id,
      title: movie.title ?? movie.original_title ?? "Untitled",
      original_title: movie.original_title ?? null,
      poster_path: movie.poster_path ?? null,
      release_date: movie.release_date || null,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "TMDB search is unavailable. Try again." },
      { status: 502 },
    );
  }
}
