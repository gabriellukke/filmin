export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      lists: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          invite_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          invite_code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          invite_code?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      list_members: {
        Row: {
          list_id: string;
          user_id: string;
          role: "owner" | "member";
          joined_at: string;
        };
        Insert: {
          list_id: string;
          user_id: string;
          role: "owner" | "member";
          joined_at?: string;
        };
        Update: {
          list_id?: string;
          user_id?: string;
          role?: "owner" | "member";
          joined_at?: string;
        };
        Relationships: [];
      };
      movies: {
        Row: {
          id: string;
          tmdb_id: number;
          title: string;
          original_title: string | null;
          poster_path: string | null;
          release_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tmdb_id: number;
          title: string;
          original_title?: string | null;
          poster_path?: string | null;
          release_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tmdb_id?: number;
          title?: string;
          original_title?: string | null;
          poster_path?: string | null;
          release_date?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      list_movies: {
        Row: {
          id: string;
          list_id: string;
          movie_id: string;
          added_by: string | null;
          watched: boolean;
          position: number;
          added_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          movie_id: string;
          added_by?: string | null;
          watched?: boolean;
          position?: number;
          added_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          movie_id?: string;
          added_by?: string | null;
          watched?: boolean;
          position?: number;
          added_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_list_member: {
        Args: { target_list_id: string };
        Returns: boolean;
      };
      is_list_owner: {
        Args: { target_list_id: string };
        Returns: boolean;
      };
      shares_list_with_profile: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
      join_list_by_invite: {
        Args: { invite: string };
        Returns: string;
      };
      reorder_list_movies: {
        Args: {
          input_list_id: string;
          input_list_movie_ids: string[];
        };
        Returns: undefined;
      };
      upsert_movie: {
        Args: {
          input_tmdb_id: number;
          input_title: string;
          input_original_title: string | null;
          input_poster_path: string | null;
          input_release_date: string | null;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
