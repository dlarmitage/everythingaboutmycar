import type { Database } from './supabase';

export type Vehicle = Database['public']['Tables']['vehicles']['Row'];
export type MaintenanceRecord = Database['public']['Tables']['maintenance_records']['Row'];

// Base Document type from Supabase schema
type BaseDocument = Database['public']['Tables']['documents']['Row'];

// Extended Document type with additional properties used in the application
export interface Document extends BaseDocument {
  document_type?: string;
  title?: string;
  description?: string;
  vehicles?: Vehicle | null;
}

export type RecallNotice = Database['public']['Tables']['recall_notices']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
export type MaintenanceRecordInsert = Database['public']['Tables']['maintenance_records']['Insert'];
export type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
export type RecallNoticeInsert = Database['public']['Tables']['recall_notices']['Insert'];

export type DocumentAnalysisResult = {
  vehicleInfo?: {
    make?: string;
    model?: string;
    year?: number;
    vin?: string;
    licensePlate?: string;
    color?: string;
  };
  maintenanceInfo?: {
    serviceDate?: string;
    serviceType?: string;
    description?: string;
    mileage?: number;
    cost?: number;
    serviceProvider?: string;
    partsReplaced?: string[];
    notes?: string;
    isRecurring?: boolean;
    nextServiceDate?: string;
    nextServiceMileage?: number;
  };
  recallInfo?: {
    recallDate?: string;
    recallNumber?: string;
    description?: string;
    severity?: string;
    status?: string;
    manufacturer?: string;
    affectedComponents?: string[];
    remedy?: string;
    notes?: string;
  };
  otherInfo?: Record<string, any>;
};

export type FileUploadState = {
  isUploading: boolean;
  progress: number;
  error: string | null;
};

export type NotificationPreferences = {
  email: boolean;
  push: boolean;
  sms: boolean;
  maintenanceDue: boolean;
  maintenanceOverdue: boolean;
  recallNotices: boolean;
  serviceReminders: boolean;
};

export type AppContextType = {
  user: Profile | null;
  setUser: (user: Profile | null) => void;
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  maintenanceRecords: MaintenanceRecord[];
  documents: Document[];
  recallNotices: RecallNotice[];
  refreshVehicles: () => Promise<void>;
  refreshMaintenanceRecords: () => Promise<void>;
  refreshDocuments: () => Promise<void>;
  refreshRecallNotices: () => Promise<void>;
  isLoading: boolean;
};
