/**
 * Hand-written database types mirroring supabase/migrations/0001_init_schema.sql.
 *
 * No Supabase CLI is available locally to generate these; keep this file in sync
 * by hand whenever the schema changes. Shape follows the supabase-js `Database`
 * convention (Row/Insert/Update per table) so typed clients infer correctly.
 */

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
      camps: {
        Row: {
          id: string;
          name: string;
          location: string | null;
          start_date: string | null;
          end_date: string | null;
          capacity: number | null;
          base_price: number;
          registration_open: boolean;
          registration_opens_at: string | null;
          registration_closes_at: string | null;
          payment_due_date: string | null;
          tagline: string | null;
          description: string | null;
          config: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          capacity?: number | null;
          base_price?: number;
          registration_open?: boolean;
          registration_opens_at?: string | null;
          registration_closes_at?: string | null;
          payment_due_date?: string | null;
          tagline?: string | null;
          description?: string | null;
          config?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["camps"]["Insert"]>;
        Relationships: [];
      };
      camp_settings: {
        Row: {
          id: boolean;
          current_camp_id: string | null;
          settings: Json;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          current_camp_id?: string | null;
          settings?: Json;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["camp_settings"]["Insert"]>;
        Relationships: [];
      };
      camp_form_fields: {
        Row: {
          id: string;
          camp_id: string;
          key: string;
          label: string;
          field_type: string;
          required: boolean;
          options: Json | null;
          sort_order: number;
          config: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          camp_id: string;
          key: string;
          label: string;
          field_type?: string;
          required?: boolean;
          options?: Json | null;
          sort_order?: number;
          config?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["camp_form_fields"]["Insert"]>;
        Relationships: [];
      };
      price_tiers: {
        Row: {
          id: string;
          camp_id: string;
          name: string;
          price: number;
          hidden: boolean;
          invitation_token: string | null;
          valid_from: string | null;
          valid_until: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          camp_id: string;
          name: string;
          price: number;
          hidden?: boolean;
          invitation_token?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["price_tiers"]["Insert"]>;
        Relationships: [];
      };
      registrations: {
        Row: {
          id: string;
          reference: string;
          camp_id: string;
          price_tier_id: string | null;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          form_data: Json;
          status: string;
          payment_status: string;
          amount_due: number;
          amount_paid: number;
          stripe_session_id: string | null;
          deleted: boolean;
          registered_at: string;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reference: string;
          camp_id: string;
          price_tier_id?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          form_data?: Json;
          status?: string;
          payment_status?: string;
          amount_due?: number;
          amount_paid?: number;
          stripe_session_id?: string | null;
          deleted?: boolean;
          registered_at?: string;
          updated_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["registrations"]["Insert"]>;
        Relationships: [];
      };
      submission_attempts: {
        Row: {
          id: string;
          email: string | null;
          ip: string | null;
          camp_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          ip?: string | null;
          camp_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["submission_attempts"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          permissions: string[];
          visible_tabs: string[];
          dashboard_metrics: Json;
          status: string;
          last_active_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          email?: string | null;
          permissions?: string[];
          visible_tabs?: string[];
          dashboard_metrics?: Json;
          status?: string;
          last_active_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Insert"]>;
        Relationships: [];
      };
      admin_invitations: {
        Row: {
          id: string;
          email: string;
          role: string;
          permissions: string[];
          visible_tabs: string[];
          token: string;
          status: string;
          invited_by: string | null;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role?: string;
          permissions?: string[];
          visible_tabs?: string[];
          token: string;
          status?: string;
          invited_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_invitations"]["Insert"]>;
        Relationships: [];
      };
      logs: {
        Row: {
          id: string;
          level: string;
          actor: string | null;
          action: string | null;
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          level?: string;
          actor?: string | null;
          action?: string | null;
          message?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["logs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
