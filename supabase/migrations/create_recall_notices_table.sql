-- Create recall_notices table
CREATE TABLE IF NOT EXISTS public.recall_notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  recall_date DATE NOT NULL,
  recall_number TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  affected_components TEXT[] NOT NULL,
  remedy TEXT,
  notes TEXT
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.recall_notices ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view recall notices for their own vehicles
CREATE POLICY "Users can view recall notices for own vehicles" ON public.recall_notices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = recall_notices.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Allow users to insert recall notices for their own vehicles
CREATE POLICY "Users can insert recall notices for own vehicles" ON public.recall_notices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = recall_notices.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Allow users to update recall notices for their own vehicles
CREATE POLICY "Users can update recall notices for own vehicles" ON public.recall_notices
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = recall_notices.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Allow users to delete recall notices for their own vehicles
CREATE POLICY "Users can delete recall notices for own vehicles" ON public.recall_notices
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = recall_notices.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Create function to update updated_at when a recall notice is updated
CREATE OR REPLACE FUNCTION public.handle_recall_notice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for recall notice updates
DROP TRIGGER IF EXISTS on_recall_notice_updated ON public.recall_notices;
CREATE TRIGGER on_recall_notice_updated
  BEFORE UPDATE ON public.recall_notices
  FOR EACH ROW EXECUTE FUNCTION public.handle_recall_notice_updated_at();
