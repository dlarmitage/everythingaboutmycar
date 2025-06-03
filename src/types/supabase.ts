export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          make: string;
          model: string;
          year: number;
          vin: string | null;
          license_plate: string | null;
          color: string | null;
          purchase_date: string | null;
          purchase_price: number | null;
          mileage: number | null;
          image_url: string | null;
          insurance_provider: string | null;
          insurance_policy: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          make: string;
          model: string;
          year: number;
          vin?: string | null;
          license_plate?: string | null;
          color?: string | null;
          purchase_date?: string | null;
          purchase_price?: number | null;
          mileage?: number | null;
          image_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          make?: string;
          model?: string;
          year?: number;
          vin?: string | null;
          license_plate?: string | null;
          color?: string | null;
          purchase_date?: string | null;
          purchase_price?: number | null;
          mileage?: number | null;
          image_url?: string | null;
        };
      };
      maintenance_records: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          vehicle_id: string;
          service_date: string;
          service_type: string;
          description: string;
          mileage: number | null;
          cost: number | null;
          service_provider: string | null;
          parts_replaced: string[] | null;
          notes: string | null;
          document_url: string | null;
          is_recurring: boolean;
          next_service_date: string | null;
          next_service_mileage: number | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          vehicle_id: string;
          service_date: string;
          service_type: string;
          description: string;
          mileage?: number | null;
          cost?: number | null;
          service_provider?: string | null;
          parts_replaced?: string[] | null;
          notes?: string | null;
          document_url?: string | null;
          is_recurring?: boolean;
          next_service_date?: string | null;
          next_service_mileage?: number | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          vehicle_id?: string;
          service_date?: string;
          service_type?: string;
          description?: string;
          mileage?: number | null;
          cost?: number | null;
          service_provider?: string | null;
          parts_replaced?: string[] | null;
          notes?: string | null;
          document_url?: string | null;
          is_recurring?: boolean;
          next_service_date?: string | null;
          next_service_mileage?: number | null;
        };
      };
      documents: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          vehicle_id: string;
          file_name: string;
          file_type: string;
          file_url: string;
          file_size: number;
          analyzed: boolean;
          analysis_result: Json | null;
          maintenance_record_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          vehicle_id: string;
          file_name: string;
          file_type: string;
          file_url: string;
          file_size: number;
          analyzed?: boolean;
          analysis_result?: Json | null;
          maintenance_record_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          vehicle_id?: string;
          file_name?: string;
          file_type?: string;
          file_url?: string;
          file_size?: number;
          analyzed?: boolean;
          analysis_result?: Json | null;
          maintenance_record_id?: string | null;
        };
      };
      recall_notices: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          vehicle_id: string;
          recall_date: string;
          recall_number: string;
          description: string;
          severity: string;
          status: string;
          manufacturer: string;
          affected_components: string[];
          remedy: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          vehicle_id: string;
          recall_date: string;
          recall_number: string;
          description: string;
          severity: string;
          status: string;
          manufacturer: string;
          affected_components: string[];
          remedy?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          vehicle_id?: string;
          recall_date?: string;
          recall_number?: string;
          description?: string;
          severity?: string;
          status?: string;
          manufacturer?: string;
          affected_components?: string[];
          remedy?: string | null;
          notes?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          notification_preferences: Json;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          notification_preferences?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          notification_preferences?: Json;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
