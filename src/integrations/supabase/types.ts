export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          action: string
          actor_name: string
          actor_type: string
          created_at: string
          id: string
          metadata: Json | null
          post_id: string | null
        }
        Insert: {
          action: string
          actor_name: string
          actor_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          post_id?: string | null
        }
        Update: {
          action?: string
          actor_name?: string
          actor_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_memory: {
        Row: {
          agent_name: string
          content: Json
          created_at: string
          id: string
          memory_type: string
          updated_at: string
        }
        Insert: {
          agent_name: string
          content?: Json
          created_at?: string
          id?: string
          memory_type: string
          updated_at?: string
        }
        Update: {
          agent_name?: string
          content?: Json
          created_at?: string
          id?: string
          memory_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_summons: {
        Row: {
          agent_name: string
          completed_at: string | null
          created_at: string
          id: string
          post_id: string
          ritual_type: string
          status: string
          user_id: string
        }
        Insert: {
          agent_name: string
          completed_at?: string | null
          created_at?: string
          id?: string
          post_id: string
          ritual_type?: string
          status?: string
          user_id: string
        }
        Update: {
          agent_name?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          post_id?: string
          ritual_type?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_summons_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_war_votes: {
        Row: {
          created_at: string
          id: string
          side: string
          user_id: string
          war_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          side: string
          user_id: string
          war_id: string
        }
        Update: {
          created_at?: string
          id?: string
          side?: string
          user_id?: string
          war_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_war_votes_war_id_fkey"
            columns: ["war_id"]
            isOneToOne: false
            referencedRelation: "agent_wars"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_wars: {
        Row: {
          challenger: string
          challenger_action: string
          challenger_amount: number
          community_myth_votes: number
          community_oracle_votes: number
          community_rush_votes: number
          created_at: string
          defender: string
          defender_action: string
          defender_amount: number
          entry_price: number
          id: string
          post_id: string
          resolved_at: string | null
          resolved_price: number | null
          status: string
          winner: string | null
        }
        Insert: {
          challenger: string
          challenger_action: string
          challenger_amount: number
          community_myth_votes?: number
          community_oracle_votes?: number
          community_rush_votes?: number
          created_at?: string
          defender: string
          defender_action: string
          defender_amount: number
          entry_price: number
          id?: string
          post_id: string
          resolved_at?: string | null
          resolved_price?: number | null
          status?: string
          winner?: string | null
        }
        Update: {
          challenger?: string
          challenger_action?: string
          challenger_amount?: number
          community_myth_votes?: number
          community_oracle_votes?: number
          community_rush_votes?: number
          created_at?: string
          defender?: string
          defender_action?: string
          defender_amount?: number
          entry_price?: number
          id?: string
          post_id?: string
          resolved_at?: string | null
          resolved_price?: number | null
          status?: string
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_wars_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      clips: {
        Row: {
          clip_type: string
          created_at: string
          id: string
          post_id: string
          trigger_event: Json | null
        }
        Insert: {
          clip_type: string
          created_at?: string
          id?: string
          post_id: string
          trigger_event?: Json | null
        }
        Update: {
          clip_type?: string
          created_at?: string
          id?: string
          post_id?: string
          trigger_event?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "clips_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      early_ape_nfts: {
        Row: {
          entry_price: number
          id: string
          mint_status: string
          minted_at: string
          post_id: string
          qualifying_price: number
          token_id: number | null
          tx_hash: string | null
          user_id: string
        }
        Insert: {
          entry_price: number
          id?: string
          mint_status?: string
          minted_at?: string
          post_id: string
          qualifying_price: number
          token_id?: number | null
          tx_hash?: string | null
          user_id: string
        }
        Update: {
          entry_price?: number
          id?: string
          mint_status?: string
          minted_at?: string
          post_id?: string
          qualifying_price?: number
          token_id?: number | null
          tx_hash?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "early_ape_nfts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      leveraged_positions: {
        Row: {
          action: string
          amount: number
          closed_at: string | null
          created_at: string
          entry_price: number
          id: string
          is_open: boolean
          leverage: number
          liquidation_price: number
          pnl: number | null
          post_id: string
          user_id: string
        }
        Insert: {
          action: string
          amount: number
          closed_at?: string | null
          created_at?: string
          entry_price: number
          id?: string
          is_open?: boolean
          leverage: number
          liquidation_price: number
          pnl?: number | null
          post_id: string
          user_id: string
        }
        Update: {
          action?: string
          amount?: number
          closed_at?: string | null
          created_at?: string
          entry_price?: number
          id?: string
          is_open?: boolean
          leverage?: number
          liquidation_price?: number
          pnl?: number | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leveraged_positions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          creator_id: string
          current_price: number | null
          id: string
          is_active: boolean | null
          price_change_pct: number | null
          token_address: string | null
          volume: number | null
        }
        Insert: {
          content: string
          created_at?: string
          creator_id: string
          current_price?: number | null
          id?: string
          is_active?: boolean | null
          price_change_pct?: number | null
          token_address?: string | null
          volume?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          creator_id?: string
          current_price?: number | null
          id?: string
          is_active?: boolean | null
          price_change_pct?: number | null
          token_address?: string | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          id: string
          post_id: string
          price: number
          recorded_at: string
        }
        Insert: {
          id?: string
          post_id: string
          price: number
          recorded_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          price?: number
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          total_pnl: number | null
          username: string | null
          wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          total_pnl?: number | null
          username?: string | null
          wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          total_pnl?: number | null
          username?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      rotations: {
        Row: {
          amount: number
          created_at: string
          from_post_id: string
          id: string
          price_from: number
          price_to: number
          to_post_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          from_post_id: string
          id?: string
          price_from: number
          price_to: number
          to_post_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          from_post_id?: string
          id?: string
          price_from?: number
          price_to?: number
          to_post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rotations_from_post_id_fkey"
            columns: ["from_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotations_to_post_id_fkey"
            columns: ["to_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          action: string
          amount: number
          created_at: string
          id: string
          post_id: string
          price_at_trade: number
          user_id: string
        }
        Insert: {
          action: string
          amount: number
          created_at?: string
          id?: string
          post_id: string
          price_at_trade: number
          user_id: string
        }
        Update: {
          action?: string
          amount?: number
          created_at?: string
          id?: string
          post_id?: string
          price_at_trade?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      agent_process_trade: {
        Args: {
          _action: string
          _agent_name: string
          _amount: number
          _post_id: string
        }
        Returns: Json
      }
      check_and_create_clip: {
        Args: {
          _action: string
          _actor_name: string
          _actor_type: string
          _amount: number
          _new_price: number
          _old_price: number
          _post_id: string
          _price_change_pct: number
        }
        Returns: undefined
      }
      check_early_ape_nft: {
        Args: { _new_price: number; _post_id: string }
        Returns: undefined
      }
      check_liquidations: { Args: { _post_id: string }; Returns: Json }
      confirm_early_ape_mint: {
        Args: { _nft_id: string; _tx_hash: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      open_leveraged_position: {
        Args: {
          _action: string
          _amount: number
          _leverage: number
          _post_id: string
        }
        Returns: Json
      }
      process_rotation: {
        Args: { _amount: number; _from_post_id: string; _to_post_id: string }
        Returns: Json
      }
      process_trade: {
        Args: { _action: string; _amount: number; _post_id: string }
        Returns: Json
      }
      upsert_agent_memory: {
        Args: { _agent_name: string; _content: Json; _memory_type: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
