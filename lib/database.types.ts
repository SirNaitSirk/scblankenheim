/**
 * Hand-written database types mirroring supabase/migrations/ (0001 to 0011).
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
          gender: string | null;
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
          // supabase/migrations/0012_mail_settings.sql
          reminders_paused: boolean;
          reminders_paused_at: string | null;
          // supabase/migrations/0013_participant_access.sql
          access_token: string;
        };
        Insert: {
          id?: string;
          reference: string;
          camp_id: string;
          price_tier_id?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          gender?: string | null;
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
          reminders_paused?: boolean;
          reminders_paused_at?: string | null;
          access_token?: string;
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
          kind: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          ip?: string | null;
          camp_id?: string | null;
          kind?: string;
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
      // supabase/migrations/0007_stripe_payments.sql
      stripe_payments: {
        Row: {
          id: string;
          registration_id: string;
          payment_intent_id: string;
          checkout_session_id: string | null;
          status: string;
          amount_cents: number;
          refunded_cents: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          registration_id: string;
          payment_intent_id: string;
          checkout_session_id?: string | null;
          status: string;
          amount_cents: number;
          refunded_cents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stripe_payments"]["Insert"]>;
        Relationships: [];
      };
      stripe_events: {
        Row: {
          id: string;
          type: string;
          received_at: string;
        };
        Insert: {
          id: string;
          type: string;
          received_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stripe_events"]["Insert"]>;
        Relationships: [];
      };
      // supabase/migrations/0008_email_deliveries.sql
      email_deliveries: {
        Row: {
          id: string;
          registration_id: string | null; // null for test sends (0012_mail_settings.sql)
          kind: string;
          status: string;
          trigger: string;
          actor: string | null;
          provider_message_id: string | null;
          error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          registration_id?: string | null;
          kind: string;
          status: string;
          trigger: string;
          actor?: string | null;
          provider_message_id?: string | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_deliveries"]["Insert"]>;
        Relationships: [];
      };
      // supabase/migrations/0009_room_planning.sql
      houses: {
        Row: { id: string; name: string; sort_order: number; created_at: string };
        Insert: { id?: string; name: string; sort_order?: number; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["houses"]["Insert"]>;
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          house_id: string;
          name: string;
          beds: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          house_id: string;
          name: string;
          beds: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rooms"]["Insert"]>;
        Relationships: [];
      };
      camp_rooms: {
        Row: { camp_id: string; room_id: string; gender: string };
        Insert: { camp_id: string; room_id: string; gender: string };
        Update: Partial<Database["public"]["Tables"]["camp_rooms"]["Insert"]>;
        Relationships: [];
      };
      room_assignments: {
        Row: {
          registration_id: string;
          camp_id: string;
          room_id: string;
          assigned_at: string;
        };
        Insert: {
          registration_id: string;
          camp_id: string;
          room_id: string;
          assigned_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["room_assignments"]["Insert"]>;
        Relationships: [];
      };
      // supabase/migrations/0010_tent_circles.sql
      tent_circles: {
        Row: {
          id: string;
          camp_id: string;
          name: string;
          kind: string;
          leader_registration_id: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          camp_id: string;
          name: string;
          kind?: string;
          leader_registration_id?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tent_circles"]["Insert"]>;
        Relationships: [];
      };
      tent_circle_members: {
        Row: {
          registration_id: string;
          camp_id: string;
          tent_circle_id: string;
          assigned_at: string;
        };
        Insert: {
          registration_id: string;
          camp_id: string;
          tent_circle_id: string;
          assigned_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tent_circle_members"]["Insert"]>;
        Relationships: [];
      };
      // supabase/migrations/0011_camp_mail_info.sql
      camp_mail_info: {
        Row: {
          camp_id: string;
          highlights: string | null;
          team_greeting: string | null;
          arrival_address: string | null;
          arrival_time: string | null;
          pickup_time: string | null;
          first_day: string | null;
          emergency_phone: string | null;
          phone_rules: string | null;
          photos_url: string | null;
          feedback_url: string | null;
          next_camp_note: string | null;
          teaser_enabled: boolean;
          packing_enabled: boolean;
          arrival_enabled: boolean;
          thanks_enabled: boolean;
          updated_at: string;
          // supabase/migrations/0012_mail_settings.sql
          reminders_enabled: boolean;
          teaser_days_before: number | null;
          packing_days_before: number | null;
          arrival_days_before: number | null;
          thanks_days_after: number | null;
          reminder_first_after_days: number | null;
          reminder_before_due_days: number | null;
          reminder_min_gap_days: number | null;
          sender_name: string | null;
          reply_to: string | null;
          text_greeting: string | null;
          text_closing: string | null;
          contact_name: string | null;
          contact_phone: string | null;
        };
        Insert: {
          camp_id: string;
          highlights?: string | null;
          team_greeting?: string | null;
          arrival_address?: string | null;
          arrival_time?: string | null;
          pickup_time?: string | null;
          first_day?: string | null;
          emergency_phone?: string | null;
          phone_rules?: string | null;
          photos_url?: string | null;
          feedback_url?: string | null;
          next_camp_note?: string | null;
          teaser_enabled?: boolean;
          packing_enabled?: boolean;
          arrival_enabled?: boolean;
          thanks_enabled?: boolean;
          updated_at?: string;
          reminders_enabled?: boolean;
          teaser_days_before?: number | null;
          packing_days_before?: number | null;
          arrival_days_before?: number | null;
          thanks_days_after?: number | null;
          reminder_first_after_days?: number | null;
          reminder_before_due_days?: number | null;
          reminder_min_gap_days?: number | null;
          sender_name?: string | null;
          reply_to?: string | null;
          text_greeting?: string | null;
          text_closing?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["camp_mail_info"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      // supabase/migrations/0009_room_planning.sql (replaces 0005)
      create_public_registration: {
        Args: {
          p_camp_id: string;
          p_reference: string;
          p_first_name: string;
          p_last_name: string;
          p_email: string;
          p_gender: string;
          p_form_data: Json;
          p_amount_due: number;
          p_price_tier_id: string | null;
          p_option_limits: Json;
        };
        Returns: Json;
      };
      // supabase/migrations/0010_tent_circles.sql
      fits_tent_circle: {
        Args: { p_kind: string; p_gender: string | null };
        Returns: boolean;
      };
      assign_tent_circle: {
        Args: { p_camp_id: string; p_registration_id: string; p_circle_id: string };
        Returns: Json;
      };
      save_tent_circle: {
        Args: {
          p_camp_id: string;
          p_circle_id: string | null;
          p_name: string;
          p_kind: string;
          p_leader_id: string;
        };
        Returns: Json;
      };
      assign_room: {
        Args: { p_camp_id: string; p_registration_id: string; p_room_id: string };
        Returns: Json;
      };
      set_room_gender: {
        Args: { p_camp_id: string; p_room_id: string; p_gender: string | null };
        Returns: Json;
      };
      update_room_beds: {
        Args: { p_room_id: string; p_beds: number; p_camp_id: string | null };
        Returns: Json;
      };
      room_occupancy: {
        Args: { p_camp_id: string; p_room_id: string };
        Returns: number;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
