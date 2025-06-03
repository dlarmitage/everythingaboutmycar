-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  analyzed BOOLEAN DEFAULT false NOT NULL,
  analysis_result JSONB,
  maintenance_record_id UUID REFERENCES public.maintenance_records(id) ON DELETE SET NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own documents (via vehicle ownership)
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = documents.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Allow users to insert documents for their own vehicles
CREATE POLICY "Users can insert documents for own vehicles" ON public.documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = documents.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Allow users to update documents for their own vehicles
CREATE POLICY "Users can update documents for own vehicles" ON public.documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = documents.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Allow users to delete documents for their own vehicles
CREATE POLICY "Users can delete documents for own vehicles" ON public.documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = documents.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Create function to update updated_at when a document is updated
CREATE OR REPLACE FUNCTION public.handle_document_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for document updates
DROP TRIGGER IF EXISTS on_document_updated ON public.documents;
CREATE TRIGGER on_document_updated
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_document_updated_at();
