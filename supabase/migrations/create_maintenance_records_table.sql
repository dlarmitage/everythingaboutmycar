-- Create maintenance_records table
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT NOT NULL,
  mileage INTEGER,
  cost NUMERIC,
  service_provider TEXT,
  parts_replaced TEXT[],
  notes TEXT,
  document_url TEXT,
  is_recurring BOOLEAN DEFAULT false NOT NULL,
  next_service_date DATE,
  next_service_mileage INTEGER
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own maintenance records (via vehicle ownership)
CREATE POLICY "Users can view own maintenance records" ON public.maintenance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = maintenance_records.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Allow users to insert maintenance records for their own vehicles
CREATE POLICY "Users can insert maintenance records for own vehicles" ON public.maintenance_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = maintenance_records.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Allow users to update maintenance records for their own vehicles
CREATE POLICY "Users can update maintenance records for own vehicles" ON public.maintenance_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = maintenance_records.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Allow users to delete maintenance records for their own vehicles
CREATE POLICY "Users can delete maintenance records for own vehicles" ON public.maintenance_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = maintenance_records.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Create function to update updated_at when a maintenance record is updated
CREATE OR REPLACE FUNCTION public.handle_maintenance_record_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for maintenance record updates
DROP TRIGGER IF EXISTS on_maintenance_record_updated ON public.maintenance_records;
CREATE TRIGGER on_maintenance_record_updated
  BEFORE UPDATE ON public.maintenance_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_maintenance_record_updated_at();
