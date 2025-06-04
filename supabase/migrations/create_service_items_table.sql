-- Create service_items table
CREATE TABLE IF NOT EXISTS public.service_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  service_record_id UUID NOT NULL REFERENCES public.service_records(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  description TEXT,
  cost NUMERIC,
  parts_replaced TEXT[],
  quantity INTEGER DEFAULT 1,
  next_service_date DATE,
  next_service_mileage INTEGER
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.service_items ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own service items (via service record and vehicle ownership)
CREATE POLICY "Users can view own service items" ON public.service_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.service_records
      JOIN public.vehicles ON vehicles.id = service_records.vehicle_id
      WHERE service_records.id = service_items.service_record_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Allow users to insert service items for their own service records
CREATE POLICY "Users can insert service items for own service records" ON public.service_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_records
      JOIN public.vehicles ON vehicles.id = service_records.vehicle_id
      WHERE service_records.id = service_items.service_record_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Allow users to update service items for their own service records
CREATE POLICY "Users can update service items for own service records" ON public.service_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.service_records
      JOIN public.vehicles ON vehicles.id = service_records.vehicle_id
      WHERE service_records.id = service_items.service_record_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Allow users to delete service items for their own service records
CREATE POLICY "Users can delete service items for own service records" ON public.service_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.service_records
      JOIN public.vehicles ON vehicles.id = service_records.vehicle_id
      WHERE service_records.id = service_items.service_record_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Create function to update updated_at when a service item is updated
CREATE OR REPLACE FUNCTION public.handle_service_item_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for service item updates
DROP TRIGGER IF EXISTS on_service_item_updated ON public.service_items;
CREATE TRIGGER on_service_item_updated
  BEFORE UPDATE ON public.service_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_service_item_updated_at();
