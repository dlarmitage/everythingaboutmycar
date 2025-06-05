export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          analysis_result: Json | null
          analyzed: boolean
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          service_record_id: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          analysis_result?: Json | null
          analyzed?: boolean
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          service_record_id?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          analysis_result?: Json | null
          analyzed?: boolean
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          service_record_id?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_service_record_id_fkey"
            columns: ["service_record_id"]
            isOneToOne: false
            referencedRelation: "service_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_records: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          vehicle_id: string
          service_date: string
          service_provider: string | null
          mileage: number | null
          total_cost: number | null
          document_url: string | null
          document_id: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          vehicle_id: string
          service_date: string
          service_provider?: string | null
          mileage?: number | null
          total_cost?: number | null
          document_url?: string | null
          document_id?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          vehicle_id?: string
          service_date?: string
          service_provider?: string | null
          mileage?: number | null
          total_cost?: number | null
          document_url?: string | null
          document_id?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_items: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          service_record_id: string
          service_type: string
          description: string | null
          cost: number | null
          parts_replaced: string[] | null
          quantity: number | null
          next_service_date: string | null
          next_service_mileage: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          service_record_id: string
          service_type: string
          description?: string | null
          cost?: number | null
          parts_replaced?: string[] | null
          quantity?: number | null
          next_service_date?: string | null
          next_service_mileage?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          service_record_id?: string
          service_type?: string
          description?: string | null
          cost?: number | null
          parts_replaced?: string[] | null
          quantity?: number | null
          next_service_date?: string | null
          next_service_mileage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_items_service_record_id_fkey"
            columns: ["service_record_id"]
            isOneToOne: false
            referencedRelation: "service_records"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          cost: number | null
          created_at: string
          description: string
          document_url: string | null
          id: string
          is_recurring: boolean
          mileage: number | null
          next_service_date: string | null
          next_service_mileage: number | null
          notes: string | null
          parts_replaced: string[] | null
          service_date: string
          service_provider: string | null
          service_type: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          description: string
          document_url?: string | null
          id?: string
          is_recurring?: boolean
          mileage?: number | null
          next_service_date?: string | null
          next_service_mileage?: number | null
          notes?: string | null
          parts_replaced?: string[] | null
          service_date: string
          service_provider?: string | null
          service_type: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          description?: string
          document_url?: string | null
          id?: string
          is_recurring?: boolean
          mileage?: number | null
          next_service_date?: string | null
          next_service_mileage?: number | null
          notes?: string | null
          parts_replaced?: string[] | null
          service_date?: string
          service_provider?: string | null
          service_type?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          notification_preferences: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          notification_preferences?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          notification_preferences?: Json
          updated_at?: string
        }
        Relationships: []
      }
      recall_notices: {
        Row: {
          affected_components: string[]
          created_at: string
          description: string
          id: string
          manufacturer: string
          notes: string | null
          recall_date: string
          recall_number: string
          remedy: string | null
          severity: string
          status: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          affected_components: string[]
          created_at?: string
          description: string
          id?: string
          manufacturer: string
          notes?: string | null
          recall_date: string
          recall_number: string
          remedy?: string | null
          severity: string
          status: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          affected_components?: string[]
          created_at?: string
          description?: string
          id?: string
          manufacturer?: string
          notes?: string | null
          recall_date?: string
          recall_number?: string
          remedy?: string | null
          severity?: string
          status?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recall_notices_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          body_class: string | null
          color: string | null
          created_at: string
          id: string
          image_url: string | null
          license_plate: string | null
          make: string
          mileage: number | null
          model: string
          purchase_date: string | null
          purchase_price: number | null
          updated_at: string
          user_id: string
          vin: string | null
          year: number
        }
        Insert: {
          body_class?: string | null
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          license_plate?: string | null
          make: string
          mileage?: number | null
          model: string
          purchase_date?: string | null
          purchase_price?: number | null
          updated_at?: string
          user_id: string
          vin?: string | null
          year: number
        }
        Update: {
          body_class?: string | null
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          license_plate?: string | null
          make?: string
          mileage?: number | null
          model?: string
          purchase_date?: string | null
          purchase_price?: number | null
          updated_at?: string
          user_id?: string
          vin?: string | null
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
