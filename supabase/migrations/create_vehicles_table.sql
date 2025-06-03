-- Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  vin TEXT,
  license_plate TEXT,
  color TEXT,
  purchase_date DATE,
  purchase_price NUMERIC,
  mileage INTEGER,
  image_url TEXT,
  insurance_provider TEXT,
  insurance_policy TEXT,
  notes TEXT
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own vehicles
CREATE POLICY "Users can view own vehicles" ON public.vehicles
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own vehicles
CREATE POLICY "Users can insert own vehicles" ON public.vehicles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own vehicles
CREATE POLICY "Users can update own vehicles" ON public.vehicles
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own vehicles
CREATE POLICY "Users can delete own vehicles" ON public.vehicles
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at when a vehicle is updated
CREATE OR REPLACE FUNCTION public.handle_vehicle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for vehicle updates
DROP TRIGGER IF EXISTS on_vehicle_updated ON public.vehicles;
CREATE TRIGGER on_vehicle_updated
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.handle_vehicle_updated_at();
