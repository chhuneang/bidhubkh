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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          active: boolean | null
          category_id: string | null
          created_at: string
          email_notifications: boolean | null
          frequency: string | null
          id: string
          keywords: string[] | null
          last_triggered_at: string | null
          maximum_value: number | null
          minimum_value: number | null
          name: string
          organization_id: string | null
          telegram_chat_id: string | null
          telegram_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          category_id?: string | null
          created_at?: string
          email_notifications?: boolean | null
          frequency?: string | null
          id?: string
          keywords?: string[] | null
          last_triggered_at?: string | null
          maximum_value?: number | null
          minimum_value?: number | null
          name: string
          organization_id?: string | null
          telegram_chat_id?: string | null
          telegram_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          category_id?: string | null
          created_at?: string
          email_notifications?: boolean | null
          frequency?: string | null
          id?: string
          keywords?: string[] | null
          last_triggered_at?: string | null
          maximum_value?: number | null
          minimum_value?: number | null
          name?: string
          organization_id?: string | null
          telegram_chat_id?: string | null
          telegram_notifications?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name_en: string
          name_km: string | null
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name_en: string
          name_km?: string | null
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name_en?: string
          name_km?: string | null
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          industry: string | null
          location: string | null
          max_contract_budget: number | null
          min_contract_budget: number | null
          name: string
          phone: string | null
          registration_number: string | null
          slug: string
          tax_id: string | null
          team_size: string | null
          updated_at: string
          user_id: string
          website: string | null
          years_in_business: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          max_contract_budget?: number | null
          min_contract_budget?: number | null
          name: string
          phone?: string | null
          registration_number?: string | null
          slug: string
          tax_id?: string | null
          team_size?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
          years_in_business?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          max_contract_budget?: number | null
          min_contract_budget?: number | null
          name?: string
          phone?: string | null
          registration_number?: string | null
          slug?: string
          tax_id?: string | null
          team_size?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
          years_in_business?: number | null
        }
        Relationships: []
      }
      company_products: {
        Row: {
          category_id: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          keywords: string[] | null
          name: string
        }
        Insert: {
          category_id?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string[] | null
          name: string
        }
        Update: {
          category_id?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string[] | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name_en: string
          name_km: string | null
          org_type: string
          slug: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name_en: string
          name_km?: string | null
          org_type: string
          slug: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name_en?: string
          name_km?: string | null
          org_type?: string
          slug?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          khqr_md5: string | null
          khqr_string: string | null
          payment_method: string
          plan_slug: string
          status: string
          transaction_reference: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          khqr_md5?: string | null
          khqr_string?: string | null
          payment_method?: string
          plan_slug: string
          status?: string
          transaction_reference?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          khqr_md5?: string | null
          khqr_string?: string | null
          payment_method?: string
          plan_slug?: string
          status?: string
          transaction_reference?: string | null
          user_id?: string
        }
        Relationships: []
      }
      raw_tenders: {
        Row: {
          content_hash: string
          created_at: string
          external_id: string
          id: string
          processing_error: string | null
          raw_description: string | null
          raw_payload: Json
          raw_title: string
          retrieved_at: string
          source_id: string
          source_url: string
          status: string
        }
        Insert: {
          content_hash: string
          created_at?: string
          external_id: string
          id?: string
          processing_error?: string | null
          raw_description?: string | null
          raw_payload: Json
          raw_title: string
          retrieved_at?: string
          source_id: string
          source_url: string
          status?: string
        }
        Update: {
          content_hash?: string
          created_at?: string
          external_id?: string
          id?: string
          processing_error?: string | null
          raw_description?: string | null
          raw_payload?: Json
          raw_title?: string
          retrieved_at?: string
          source_id?: string
          source_url?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_tenders_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          created_at: string
          custom_notes: string | null
          id: string
          language: string
          sections: Json
          status: string
          tender_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_notes?: string | null
          id?: string
          language?: string
          sections?: Json
          status?: string
          tender_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_notes?: string | null
          id?: string
          language?: string
          sections?: Json
          status?: string
          tender_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_tenders: {
        Row: {
          created_at: string
          id: string
          last_viewed_at: string | null
          notes: string | null
          status: Database["public"]["Enums"]["saved_tender_status"]
          tender_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_viewed_at?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["saved_tender_status"]
          tender_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_viewed_at?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["saved_tender_status"]
          tender_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_tenders_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          access_method: Database["public"]["Enums"]["source_access_method"]
          active: boolean
          auto_approve: boolean
          check_frequency_hours: number
          code: string
          created_at: string
          id: string
          last_checked_at: string | null
          last_error: string | null
          last_success_at: string | null
          metadata: Json | null
          name: string
          parser_version: string | null
          source_type: string
          updated_at: string
          website_url: string
        }
        Insert: {
          access_method?: Database["public"]["Enums"]["source_access_method"]
          active?: boolean
          auto_approve?: boolean
          check_frequency_hours?: number
          code: string
          created_at?: string
          id?: string
          last_checked_at?: string | null
          last_error?: string | null
          last_success_at?: string | null
          metadata?: Json | null
          name: string
          parser_version?: string | null
          source_type: string
          updated_at?: string
          website_url: string
        }
        Update: {
          access_method?: Database["public"]["Enums"]["source_access_method"]
          active?: boolean
          auto_approve?: boolean
          check_frequency_hours?: number
          code?: string
          created_at?: string
          id?: string
          last_checked_at?: string | null
          last_error?: string | null
          last_success_at?: string | null
          metadata?: Json | null
          name?: string
          parser_version?: string | null
          source_type?: string
          updated_at?: string
          website_url?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          ai_summary_limit: number
          alert_rules_limit: number
          billing_interval: string
          created_at: string
          description: string | null
          features: Json
          id: string
          is_popular: boolean
          name: string
          price_khr: number
          price_usd: number
          slug: string
        }
        Insert: {
          ai_summary_limit?: number
          alert_rules_limit?: number
          billing_interval?: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_popular?: boolean
          name: string
          price_khr?: number
          price_usd?: number
          slug: string
        }
        Update: {
          ai_summary_limit?: number
          alert_rules_limit?: number
          billing_interval?: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_popular?: boolean
          name?: string
          price_khr?: number
          price_usd?: number
          slug?: string
        }
        Relationships: []
      }
      tender_documents: {
        Row: {
          ai_extraction_status: string | null
          created_at: string
          document_type: string | null
          extracted_text: string | null
          file_hash: string | null
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          name: string
          original_url: string
          storage_path: string | null
          tender_id: string
        }
        Insert: {
          ai_extraction_status?: string | null
          created_at?: string
          document_type?: string | null
          extracted_text?: string | null
          file_hash?: string | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          name: string
          original_url: string
          storage_path?: string | null
          tender_id: string
        }
        Update: {
          ai_extraction_status?: string | null
          created_at?: string
          document_type?: string | null
          extracted_text?: string | null
          file_hash?: string | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          original_url?: string
          storage_path?: string | null
          tender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_documents_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tenders: {
        Row: {
          category_id: string | null
          confidence_score: number | null
          created_at: string
          currency: string | null
          deadline: string | null
          description: string | null
          duplicate_count: number
          duplicate_of_id: string | null
          eligibility: string | null
          estimated_value: number | null
          external_id: string
          fingerprint: string | null
          first_seen_at: string
          id: string
          last_seen_at: string
          location: string | null
          moderation_notes: string | null
          moderation_status: string | null
          organization_id: string | null
          original_url: string
          procurement_method: string | null
          products_services: Json | null
          published_at: string
          raw_tender_id: string | null
          reference_number: string | null
          requirements: Json | null
          slug: string
          source_id: string
          status: Database["public"]["Enums"]["tender_status"]
          summary: string | null
          title: string
          updated_at: string
          validation_errors: Json | null
        }
        Insert: {
          category_id?: string | null
          confidence_score?: number | null
          created_at?: string
          currency?: string | null
          deadline?: string | null
          description?: string | null
          duplicate_count?: number
          duplicate_of_id?: string | null
          eligibility?: string | null
          estimated_value?: number | null
          external_id: string
          fingerprint?: string | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          location?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          organization_id?: string | null
          original_url: string
          procurement_method?: string | null
          products_services?: Json | null
          published_at: string
          raw_tender_id?: string | null
          reference_number?: string | null
          requirements?: Json | null
          slug: string
          source_id: string
          status?: Database["public"]["Enums"]["tender_status"]
          summary?: string | null
          title: string
          updated_at?: string
          validation_errors?: Json | null
        }
        Update: {
          category_id?: string | null
          confidence_score?: number | null
          created_at?: string
          currency?: string | null
          deadline?: string | null
          description?: string | null
          duplicate_count?: number
          duplicate_of_id?: string | null
          eligibility?: string | null
          estimated_value?: number | null
          external_id?: string
          fingerprint?: string | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          location?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          organization_id?: string | null
          original_url?: string
          procurement_method?: string | null
          products_services?: Json | null
          published_at?: string
          raw_tender_id?: string | null
          reference_number?: string | null
          requirements?: Json | null
          slug?: string
          source_id?: string
          status?: Database["public"]["Enums"]["tender_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tenders_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_raw_tender_id_fkey"
            columns: ["raw_tender_id"]
            isOneToOne: false
            referencedRelation: "raw_tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          payment_method: string
          plan_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          payment_method?: string
          plan_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          payment_method?: string
          plan_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      saved_tender_status:
        | "interested"
        | "reviewing"
        | "preparing_bid"
        | "submitted"
        | "won"
        | "lost"
        | "rejected"
      source_access_method: "api" | "html_scraper" | "rss" | "manual"
      tender_status: "draft" | "published" | "archived" | "cancelled"
      user_role_type: "admin" | "moderator" | "user"
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
      saved_tender_status: [
        "interested",
        "reviewing",
        "preparing_bid",
        "submitted",
        "won",
        "lost",
        "rejected",
      ],
      source_access_method: ["api", "html_scraper", "rss", "manual"],
      tender_status: ["draft", "published", "archived", "cancelled"],
      user_role_type: ["admin", "moderator", "user"],
    },
  },
} as const
