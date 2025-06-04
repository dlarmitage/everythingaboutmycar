-- Create service_records table
CREATE TABLE IF NOT EXISTS public.service_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  service_provider TEXT,
  mileage INTEGER,
  total_cost NUMERIC,
  document_url TEXT,
  notes TEXT
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own service records (via vehicle ownership)
CREATE POLICY "Users can view own service records" ON public.service_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = service_records.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Allow users to insert service records for their own vehicles
CREATE POLICY "Users can insert service records for own vehicles" ON public.service_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = service_records.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Allow users to update service records for their own vehicles
CREATE POLICY "Users can update service records for own vehicles" ON public.service_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = service_records.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Allow users to delete service records for their own vehicles
CREATE POLICY "Users can delete service records for own vehicles" ON public.service_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = service_records.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Create function to update updated_at when a service record is updated
CREATE OR REPLACE FUNCTION public.handle_service_record_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for service record updates
DROP TRIGGER IF EXISTS on_service_record_updated ON public.service_records;
CREATE TRIGGER on_service_record_updated
  BEFORE UPDATE ON public.service_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_service_record_updated_at();
